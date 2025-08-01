<?php
/**
 * Class WooPay_Session.
 *
 * @package PooCommerce\Payments
 */

namespace WCPay\WooPay;

use Automattic\Jetpack\Connection\Rest_Authentication;
use Automattic\PooCommerce\StoreApi\RoutesController;
use Automattic\PooCommerce\StoreApi\StoreApi;
use Automattic\PooCommerce\StoreApi\Utilities\JsonWebToken;
use Jetpack_Options;
use WCPay\Blocks_Data_Extractor;
use WCPay\Logger;
use WCPay\Platform_Checkout\SessionHandler;
use WCPay\Platform_Checkout\WooPay_Store_Api_Token;
use WCPay\WooPay\WooPay_Scheduler;
use WC_Customer;
use WC_Payments;
use WC_Payments_Customer_Service;
use WC_Payments_Features;
use WCPay\MultiCurrency\MultiCurrency;
use WP_REST_Request;

/**
 * Class responsible for handling woopay sessions.
 * This class should be loaded as soon as possible so the correct session is loaded.
 * So don't load it in the WC_Payments::init() function.
 */
class WooPay_Session {

	const STORE_API_NAMESPACE_PATTERN = '@^(wc/store(/v[\d]+)?|store-api)$@';

	const WOOPAY_SESSION_KEY = 'woopay-user-data';

	/**
	 * Init the hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'determine_current_user', [ __CLASS__, 'determine_current_user_for_woopay' ], 20 );
		add_filter( 'poocommerce_session_handler', [ __CLASS__, 'add_woopay_store_api_session_handler' ], 20 );
		add_action( 'poocommerce_order_payment_status_changed', [ __CLASS__, 'woopay_order_payment_status_changed' ] );
		add_action( 'woopay_restore_order_customer_id', [ __CLASS__, 'restore_order_customer_id_from_requests_with_verified_email' ] );
		add_filter( 'poocommerce_order_needs_payment', [ __CLASS__, 'woopay_trial_subscriptions_handler' ], 20, 3 );

		register_deactivation_hook( WCPAY_PLUGIN_FILE, [ __CLASS__, 'run_and_remove_woopay_restore_order_customer_id_schedules' ] );

		add_filter( 'automatewoo/referrals/referred_order_advocate', [ __CLASS__, 'automatewoo_refer_a_friend_referral_from_parameter' ] );
	}

	/**
	 * This filter is used to add a custom session handler before processing Store API request callbacks.
	 * This is only necessary because the Store API SessionHandler currently doesn't provide an `init_session_cookie` method.
	 *
	 * @param string $default_session_handler The default session handler class name.
	 *
	 * @return string The session handler class name.
	 */
	public static function add_woopay_store_api_session_handler( $default_session_handler ) {
		$cart_token = wc_clean( wp_unslash( $_SERVER['HTTP_CART_TOKEN'] ?? null ) );

		if (
		$cart_token &&
		self::is_request_from_woopay() &&
		\WC_Payments_Utils::is_store_api_request() &&
		class_exists( JsonWebToken::class ) &&
		JsonWebToken::validate( $cart_token, '@' . wp_salt() )
		) {
			return SessionHandler::class;
		}

		return $default_session_handler;
	}

	/**
	 * Sets the current user as the user sent via the api from WooPay if present.
	 *
	 * @param \WP_User|null|int $user user to be used during the request.
	 *
	 * @return \WP_User|null|int
	 */
	public static function determine_current_user_for_woopay( $user ) {
		if ( ! self::is_request_from_woopay() || ! \WC_Payments_Utils::is_store_api_request() ) {
			return $user;
		}

		if ( ! self::is_woopay_enabled() ) {
			return $user;
		}

		// Validate that the request is signed properly.
		if ( ! self::has_valid_request_signature() ) {
			Logger::log( __( 'WooPay request is not signed correctly.', 'poocommerce-payments' ) );
			wp_die( esc_html__( 'WooPay request is not signed correctly.', 'poocommerce-payments' ), 401 );
		}

		add_filter( 'wcpay_is_woopay_store_api_request', '__return_true' );

		$cart_token_user_id = self::get_user_id_from_cart_token();
		if ( null === $cart_token_user_id ) {
			return $user;
		}

		return $cart_token_user_id;
	}

	/**
	 * Returns the user ID from the cart token.
	 *
	 * @return int|null The User ID or null if there's no cart token in the request.
	 */
	public static function get_user_id_from_cart_token() {
		$payload = self::get_payload_from_cart_token();

		if ( null === $payload ) {
			return null;
		}

		$session_handler = new SessionHandler();
		$session_data    = $session_handler->get_session( $payload->user_id );
		$customer        = maybe_unserialize( $session_data['customer'] );

		// If the token is already authenticated, return the customer ID.
		if ( is_numeric( $customer['id'] ) && intval( $customer['id'] ) > 0 ) {
			return intval( $customer['id'] );
		}

		$woopay_verified_email_address = self::get_woopay_verified_email_address();
		$enabled_adapted_extensions    = get_option( WooPay_Scheduler::ENABLED_ADAPTED_EXTENSIONS_OPTION_NAME, [] );

		// If the email is verified on WooPay, matches session email (set during the redirection),
		// and the store has an adapted extension installed,
		// return the user to get extension data without authentication.
		if ( ( is_countable( $enabled_adapted_extensions ) ? count( $enabled_adapted_extensions ) : 0 ) > 0 && null !== $woopay_verified_email_address && ! empty( $customer['email'] ) ) {
			$user = get_user_by( 'email', $woopay_verified_email_address );

			if ( $woopay_verified_email_address === $customer['email'] && $user ) {
				// Remove Gift Cards session cache to load account gift cards.
				add_filter( 'poocommerce_gc_account_session_timeout_minutes', '__return_false' );

				return $user->ID;
			}
		}

		return null;
	}

	/**
	 * Update order data for extensions which uses cookies,
	 * also prevent set order customer ID on requests with
	 * email verified to skip the login screen on the TYP.
	 * After 10 minutes, the customer ID will be restored
	 * and the user will need to login to access the TYP.
	 *
	 * @param int $order_id The order ID being updated.
	 */
	public static function woopay_order_payment_status_changed( $order_id ) {
		if ( ! self::is_woopay_enabled() ) {
			return;
		}

		if ( ! self::is_request_from_woopay() || ! \WC_Payments_Utils::is_store_api_request() ) {
			return;
		}

		$woopay_adapted_extensions = new WooPay_Adapted_Extensions();
		$woopay_adapted_extensions->update_order_extension_data( $order_id );

		$woopay_verified_email_address = self::get_woopay_verified_email_address();

		if ( null === $woopay_verified_email_address ) {
			return;
		}

		$enabled_adapted_extensions = get_option( WooPay_Scheduler::ENABLED_ADAPTED_EXTENSIONS_OPTION_NAME, [] );

		if ( ( is_countable( $enabled_adapted_extensions ) ? count( $enabled_adapted_extensions ) : 0 ) === 0 ) {
			return;
		}

		$payload = self::get_payload_from_cart_token();

		if ( null === $payload ) {
			return;
		}

		$order = wc_get_order( $order_id );

		// Guest users user_id on the cart token payload looks like "t_hash" and the order
		// customer id is 0, logged in users is the real user id in both cases.
		$user_is_logged_in = $payload->user_id === $order->get_customer_id();

		if ( ! $user_is_logged_in && $woopay_verified_email_address === $order->get_billing_email() ) {
			$order->add_meta_data( 'woopay_merchant_customer_id', $order->get_customer_id(), true );
			$order->set_customer_id( 0 );
			$order->save();

			wp_schedule_single_event( time() + 10 * MINUTE_IN_SECONDS, 'woopay_restore_order_customer_id', [ $order_id ] );
		}
	}

	/**
	 * Restore the order customer ID after 10 minutes
	 * on requests with email verified.
	 *
	 * @param \WC_Order $order_id The order ID being updated.
	 */
	public static function restore_order_customer_id_from_requests_with_verified_email( $order_id ) {
		$order = wc_get_order( $order_id );

		if ( ! $order->meta_exists( 'woopay_merchant_customer_id' ) ) {
			return;
		}

		$order->set_customer_id( $order->get_meta( 'woopay_merchant_customer_id' ) );
		$order->delete_meta_data( 'woopay_merchant_customer_id' );
		$order->save();
	}

	/**
	 * Restore all WooPay verified email orders customer ID
	 * and disable the schedules when plugin is disabled.
	 */
	public static function run_and_remove_woopay_restore_order_customer_id_schedules() {
		// PooCommerce is disabled when disabling WCPay.
		if ( ! function_exists( 'wc_get_orders' ) ) {
			return;
		}

		$args = [
			'meta_key' => 'woopay_merchant_customer_id', //phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
		'return'       => 'ids',
		];

		$order_ids = wc_get_orders( $args );

		if ( ! empty( $order_ids ) ) {
			foreach ( $order_ids as $order_id ) {
				self::restore_order_customer_id_from_requests_with_verified_email( $order_id );
			}
		}

		wp_clear_scheduled_hook( 'woopay_restore_order_customer_id' );
	}

	/**
	 * Fix for AutomateWoo - Refer A Friend Add-on
	 * plugin when using link referrals.
	 *
	 * @param int $advocate_id The advocate ID.
	 *
	 * @return false|int|mixed The advocate ID or false if the request is not from WooPay.
	 */
	public static function automatewoo_refer_a_friend_referral_from_parameter( $advocate_id ) {
		if ( ! self::is_request_from_woopay() || ! \WC_Payments_Utils::is_store_api_request() ) {
			return $advocate_id;
		}

		if ( ! self::is_woopay_enabled() ) {
			return $advocate_id;
		}

		if ( empty( $_GET['automatewoo_referral_id'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return false;
		}

		$automatewoo_referral = (int) wc_clean( wp_unslash( $_GET['automatewoo_referral_id'] ) ); // phpcs:ignore WordPress.Security.NonceVerification

		return $automatewoo_referral;
	}

	/**
	 * Process trial subscriptions for WooPay.
	 *
	 * @param bool      $needs_payment If the order needs payment.
	 * @param \WC_Order $order The order.
	 * @param array     $valid_order_statuses The valid order statuses.
	 */
	public static function woopay_trial_subscriptions_handler( $needs_payment, $order, $valid_order_statuses ) {
		if ( ! self::is_request_from_woopay() || ! \WC_Payments_Utils::is_store_api_request() ) {
			return $needs_payment;
		}

		if ( ! self::is_woopay_enabled() ) {
			return $needs_payment;
		}

		if ( ! class_exists( 'WC_Subscriptions_Cart' ) || $order->get_total() > 0 ) {
			return $needs_payment;
		}

		if ( \WC_Subscriptions_Cart::cart_contains_subscription() ) {
			return true;
		}

		return $needs_payment;
	}

	/**
	 * Returns the payload from a cart token.
	 *
	 * @return object|null The cart token payload if it's valid.
	 */
	private static function get_payload_from_cart_token() {
		if ( ! isset( $_SERVER['HTTP_CART_TOKEN'] ) ) {
			return null;
		}

		if ( ! class_exists( JsonWebToken::class ) ) {
			return null;
		}

		$cart_token = wc_clean( wp_unslash( $_SERVER['HTTP_CART_TOKEN'] ) );

		if ( $cart_token && JsonWebToken::validate( $cart_token, '@' . wp_salt() ) ) {
			$payload = JsonWebToken::get_parts( $cart_token )->payload;

			if ( empty( $payload ) ) {
				return null;
			}

			// Store API namespace is used as the token issuer.
			if ( ! preg_match( self::STORE_API_NAMESPACE_PATTERN, $payload->iss ) ) {
				return null;
			}

			return $payload;
		}

		return null;
	}

	/**
	 * Returns the encrypted session request for the frontend.
	 *
	 * @return array The encrypted session request or an empty array if the server is not eligible for encryption.
	 */
	public static function get_frontend_init_session_request() {
		if ( ! extension_loaded( 'openssl' ) || ! function_exists( 'openssl_encrypt' ) ) {
			return [];
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing
		$order_id      = ! empty( $_POST['order_id'] ) ? absint( wp_unslash( $_POST['order_id'] ) ) : null;
		$key           = ! empty( $_POST['key'] ) ? sanitize_text_field( wp_unslash( $_POST['key'] ) ) : null;
		$billing_email = ! empty( $_POST['billing_email'] ) ? sanitize_text_field( wp_unslash( $_POST['billing_email'] ) ) : null;
		// phpcs:enable
		// phpcs:disable WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.MissingUnslash, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, Generic.Arrays.DisallowLongArraySyntax.Found
		$appearance = ! empty( $_POST['appearance'] ) ? self::array_map_recursive( array( __CLASS__, 'sanitize_string' ), $_POST['appearance'] ) : null;

		$session = self::get_init_session_request( $order_id, $key, $billing_email, null, $appearance );

		return WooPay_Utilities::encrypt_and_sign_data( $session );
	}

	/**
	 * Retrieves cart data from the current session.
	 *
	 * If the request doesn't come from WooPay, this uses the same strategy in
	 * `hydrate_from_api` on the Checkout Block to retrieve cart data.
	 *
	 * @param bool                 $is_pay_for_order Whether the request is for a pay-for-order session.
	 * @param int|null             $order_id Pay-for-order order ID.
	 * @param string|null          $key Pay-for-order key.
	 * @param string|null          $billing_email Pay-for-order billing email.
	 * @param WP_REST_Request|null $woopay_request The WooPay request object.
	 *
	 * @return array The cart data.
	 */
	private static function get_cart_data( $is_pay_for_order, $order_id, $key, $billing_email, $woopay_request ) {
		if ( ! $woopay_request ) {
			return ! $is_pay_for_order
			? rest_preload_api_request( [], '/wc/store/v1/cart' )['/wc/store/v1/cart']['body']
			: rest_preload_api_request( [], '/wc/store/v1/order/' . rawurlencode( $order_id ) . '?key=' . rawurlencode( $key ) . '&billing_email=' . rawurlencode( $billing_email ) )[ '/wc/store/v1/order/' . rawurlencode( $order_id ) . '?key=' . rawurlencode( $key ) . '&billing_email=' . rawurlencode( $billing_email ) ]['body'];
		}

		$cart_request = new WP_REST_Request( 'GET', '/wc/store/v1/cart' );
		$cart_request->set_header( 'Cart-Token', $woopay_request->get_header( 'cart_token' ) );
		return rest_do_request( $cart_request )->get_data();
	}

	/**
	 * Retrieves checkout data from the current session.
	 *
	 * If the request doesn't come from WooPay, this uses the same strategy in
	 * `hydrate_from_api` on the Checkout Block to retrieve checkout data.
	 *
	 * @param WP_REST_Request $woopay_request The WooPay request object.
	 * @return mixed The checkout data.
	 */
	private static function get_checkout_data( $woopay_request ) {
		add_filter( 'poocommerce_store_api_disable_nonce_check', '__return_true' );

		if ( ! $woopay_request ) {
			$preloaded_checkout_data = rest_preload_api_request( [], '/wc/store/v1/checkout' );
			$checkout_data           = isset( $preloaded_checkout_data['/wc/store/v1/checkout'] ) ? $preloaded_checkout_data['/wc/store/v1/checkout']['body'] : '';
		} else {
			$checkout_request = new WP_REST_Request( 'GET', '/wc/store/v1/checkout' );
			$checkout_request->set_header( 'Cart-Token', $woopay_request->get_header( 'cart_token' ) );
			$checkout_data = rest_do_request( $checkout_request )->get_data();
		}

		remove_filter( 'poocommerce_store_api_disable_nonce_check', '__return_true' );

		return $checkout_data;
	}

	/**
	 * Retrieves the user email from the current session.
	 *
	 * @param \WP_User $user The user object.
	 * @return string The user email.
	 */
	public static function get_user_email( $user ) {
		if ( ! empty( $_POST['email'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return sanitize_email( wp_unslash( $_POST['email'] ) ); // phpcs:ignore WordPress.Security.NonceVerification
		}

		if ( ! empty( $_GET['email'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return sanitize_email( wp_unslash( $_GET['email'] ) ); // phpcs:ignore WordPress.Security.NonceVerification
		}

		if ( ! empty( $_POST['encrypted_data'] ) && is_array( $_POST['encrypted_data'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			// phpcs:ignore WordPress.Security.NonceVerification, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
			$decrypted_data = WooPay_Utilities::decrypt_signed_data( $_POST['encrypted_data'] );

			if ( ! empty( $decrypted_data['user_email'] ) ) {
				return sanitize_email( wp_unslash( $decrypted_data['user_email'] ) );
			}
		}

		// Get the email from the customer object if it's available.
		if ( ! empty( WC()->customer ) ) {
			$billing_email = WC()->customer->get_billing_email();

			if ( ! empty( $billing_email ) ) {
				return $billing_email;
			}

			$customer_email = WC()->customer->get_email();

			if ( ! empty( $customer_email ) ) {
				return $customer_email;
			}
		}

		// As a last resort, we try to get the email from the customer logged in the store.
		if ( $user->exists() ) {
			return $user->user_email;
		}

		return '';
	}

	/**
	 * Returns the initial session request data.
	 *
	 * @param int|null             $order_id Pay-for-order order ID.
	 * @param string|null          $key Pay-for-order key.
	 * @param string|null          $billing_email Pay-for-order billing email.
	 * @param WP_REST_Request|null $woopay_request The WooPay request object.
	 * @param array                $appearance Merchant appearance.
	 * @return array The initial session request data without email and user_session.
	 */
	public static function get_init_session_request( $order_id = null, $key = null, $billing_email = null, $woopay_request = null, $appearance = null ) {
		$user             = wp_get_current_user();
		$is_pay_for_order = null !== $order_id;
		$order            = wc_get_order( $order_id );
		$customer_id      = WC_Payments::get_customer_service()->get_customer_id_by_user_id( $user->ID );
		if ( null === $customer_id ) {
			// create customer.
			$customer_data = WC_Payments_Customer_Service::map_customer_data( null, new WC_Customer( $user->ID ) );
			$customer_id   = WC_Payments::get_customer_service()->create_customer_for_user( $user, $customer_data );
		}

		if ( WC_Payments_Features::is_customer_multi_currency_enabled() && 0 !== $user->ID ) {
			// Multicurrency selection is stored on user meta when logged in and WC session when logged out.
			// This code just makes sure that currency selection is available on WC session for WooPay.
			$currency      = get_user_meta( $user->ID, MultiCurrency::CURRENCY_META_KEY, true );
			$currency_code = strtoupper( $currency );

			if ( ! empty( $currency_code ) && WC()->session ) {
				WC()->session->set( MultiCurrency::CURRENCY_SESSION_KEY, $currency_code );
			}
		}

		$account_id = WC_Payments::get_account_service()->get_stripe_account_id();

		$site_logo_id      = get_theme_mod( 'custom_logo' );
		$site_logo_url     = $site_logo_id ? ( wp_get_attachment_image_src( $site_logo_id, 'full' )[0] ?? '' ) : '';
		$woopay_store_logo = WC_Payments::get_gateway()->get_option( 'platform_checkout_store_logo' );

		$store_logo = $site_logo_url;
		if ( ! empty( $woopay_store_logo ) ) {
			$store_logo = get_rest_url( null, 'wc/v3/payments/file/' . $woopay_store_logo );
		}

		include_once WCPAY_ABSPATH . 'includes/compat/blocks/class-blocks-data-extractor.php';
		$blocks_data_extractor = new Blocks_Data_Extractor();

		$cart_data     = self::get_cart_data( $is_pay_for_order, $order_id, $key, $billing_email, $woopay_request );
		$checkout_data = self::get_checkout_data( $woopay_request );
		$email         = self::get_user_email( $user );

		if ( $woopay_request ) {
			$order_id = $checkout_data['order_id'] ?? null;
		}

		$request = [
			'wcpay_version'        => WCPAY_VERSION_NUMBER,
			'user_id'              => $user->ID,
			'customer_id'          => $customer_id,
			'session_nonce'        => self::create_woopay_nonce( $user->ID ),
			'store_api_token'      => self::init_store_api_token(),
			'email'                => $email,
			'store_data'           => [
				'store_name'                     => get_bloginfo( 'name' ),
				'store_logo'                     => $store_logo,
				'custom_message'                 => self::get_formatted_custom_terms(),
				'blog_id'                        => Jetpack_Options::get_option( 'id' ),
				'blog_url'                       => get_site_url(),
				'blog_checkout_url'              => ! $is_pay_for_order ? wc_get_checkout_url() : $order->get_checkout_payment_url(),
				'blog_shop_url'                  => get_permalink( wc_get_page_id( 'shop' ) ),
				'blog_timezone'                  => wp_timezone_string(),
				'store_api_url'                  => self::get_store_api_url(),
				'account_id'                     => $account_id,
				'test_mode'                      => WC_Payments::mode()->is_test(),
				'capture_method'                 => empty( WC_Payments::get_gateway()->get_option( 'manual_capture' ) ) || 'no' === WC_Payments::get_gateway()->get_option( 'manual_capture' ) ? 'automatic' : 'manual',
				'is_subscriptions_plugin_active' => WC_Payments::get_gateway()->is_subscriptions_plugin_active(),
				'poocommerce_tax_display_cart'   => get_option( 'poocommerce_tax_display_cart' ),
				'ship_to_billing_address_only'   => wc_ship_to_billing_address_only(),
				'return_url'                     => ! $is_pay_for_order ? wc_get_cart_url() : $order->get_checkout_payment_url(),
				'blocks_data'                    => $blocks_data_extractor->get_data(),
				'checkout_schema_namespaces'     => $blocks_data_extractor->get_checkout_schema_namespaces(),
				'optional_fields_status'         => self::get_option_fields_status(),
			],
			'user_session'         => null,
			'preloaded_requests'   => ! $is_pay_for_order ? [
				'cart'     => $cart_data,
				'checkout' => $checkout_data,
			] : [
				'cart'     => $cart_data,
				'checkout' => [
					'order_id' => $order_id, // This is a workaround for the checkout order error. https://github.com/poocommerce/poocommerce-blocks/blob/04f36065b34977f02079e6c2c8cb955200a783ff/assets/js/blocks/checkout/block.tsx#L81-L83.
				],
			],
			'tracks_user_identity' => WC_Payments::woopay_tracker()->tracks_get_identity(),
			'appearance'           => $appearance,
		];

		$woopay_adapted_extensions = new WooPay_Adapted_Extensions();
		$request['extension_data'] = $woopay_adapted_extensions->get_extension_data();

		if ( ! empty( $email ) ) {
			// Save email in session to skip TYP verify email and check if
			// WooPay verified email matches.
			WC()->customer->set_billing_email( $email );
			WC()->customer->save();

			$woopay_adapted_extensions->init();
			$request['adapted_extensions'] = $woopay_adapted_extensions->get_adapted_extensions_data( $email );

			if ( ! is_user_logged_in() && count( $request['adapted_extensions'] ) > 0 ) {
				$store_user_email_registered = get_user_by( 'email', $email );

				if ( $store_user_email_registered ) {
					$request['email_verified_session_nonce'] = self::create_woopay_nonce( $store_user_email_registered->ID );
				}
			}
		}

		return $request;
	}

	/**
	 * Recursively map an array.
	 *
	 * @param callable $callback The sanitize_text_field function.
	 * @param array    $array    The nested array.
	 *
	 * @return array A new appearance array.
	 */
	private static function array_map_recursive( $callback, $array ) {
		$func = function ( $item ) use ( &$func, &$callback ) {
			return is_array( $item ) ? array_map( $func, $item ) : call_user_func( $callback, $item );
		};

		return array_map( $func, $array );
	}

	/**
	 * Sanitize a string.
	 *
	 * @param string $item A string.
	 *
	 * @return string The sanitized string.
	 */
	private static function sanitize_string( $item ) {
		return sanitize_text_field( wp_unslash( $item ) );
	}

	/**
	 * Used to initialize woopay session.
	 *
	 * @return void
	 */
	public static function ajax_init_woopay() {
		$is_nonce_valid = check_ajax_referer( 'wcpay_init_woopay_nonce', false, false );

		if ( ! $is_nonce_valid ) {
			wp_send_json_error(
				__( 'You aren’t authorized to do that.', 'poocommerce-payments' ),
				403
			);
		}

		$order_id      = ! empty( $_POST['order_id'] ) ? absint( wp_unslash( $_POST['order_id'] ) ) : null;
		$key           = ! empty( $_POST['key'] ) ? sanitize_text_field( wp_unslash( $_POST['key'] ) ) : null;
		$billing_email = ! empty( $_POST['billing_email'] ) ? sanitize_text_field( wp_unslash( $_POST['billing_email'] ) ) : null;
		$appearance    = ! empty( $_POST['appearance'] ) ? self::array_map_recursive( array( __CLASS__, 'sanitize_string' ), $_POST['appearance'] ) : null; // phpcs:disable WordPress.Security.ValidatedSanitizedInput.MissingUnslash, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, Generic.Arrays.DisallowLongArraySyntax.Found

		$body                 = self::get_init_session_request( $order_id, $key, $billing_email, null, $appearance );
		$body['user_session'] = isset( $_REQUEST['user_session'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['user_session'] ) ) : null;

		$args = [
			'url'     => WooPay_Utilities::get_woopay_rest_url( 'init' ),
			'method'  => 'POST',
			'timeout' => 30,
			'body'    => wp_json_encode( $body ),
			'headers' => [
				'Content-Type' => 'application/json',
			],
		];

		/**
		 * Suppress psalm error from Jetpack Connection namespacing WP_Error.
		 *
		 * @psalm-suppress UndefinedDocblockClass
		 */
		$response = \Automattic\Jetpack\Connection\Client::remote_request( $args, wp_json_encode( $body ) );

		if ( is_wp_error( $response ) || ! is_array( $response ) ) {
			Logger::error( 'HTTP_REQUEST_ERROR ' . var_export( $response, true ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_var_export
			// Respond with same message platform would respond with on failure.
			$response_body_json = wp_json_encode( [ 'result' => 'failure' ] );
		} else {
			$response_body_json = wp_remote_retrieve_body( $response );
		}

		Logger::log( $response_body_json );
		wp_send_json( json_decode( $response_body_json ) );
	}

	/**
	 * Used to initialize woopay session on frontend
	 *
	 * @return void
	 */
	public static function ajax_get_woopay_session() {
		$is_nonce_valid = check_ajax_referer( 'woopay_session_nonce', false, false );

		if ( ! $is_nonce_valid ) {
			wp_send_json_error(
				__( 'You aren’t authorized to do that.', 'poocommerce-payments' ),
				403
			);
		}

		$blog_id = Jetpack_Options::get_option( 'id' );
		if ( empty( $blog_id ) ) {
			wp_send_json_error(
				__( 'Could not determine the blog ID.', 'poocommerce-payments' ),
				503
			);
		}

		wp_send_json( self::get_frontend_init_session_request() );
	}

	/**
	 * Save the blocks checkout phone number in session.
	 *
	 * @return void
	 */
	public static function ajax_set_woopay_phone_number() {
		$is_nonce_valid = check_ajax_referer( 'woopay_session_nonce', false, false );

		if ( ! $is_nonce_valid ) {
			wp_send_json_error(
				__( 'You aren’t authorized to do that.', 'poocommerce-payments' ),
				403
			);
		}

		if ( ! ( isset( WC()->session ) && WC()->session->has_session() ) ) {
			WC()->session->set_customer_session_cookie( true );
		}

		if ( ! empty( $_POST['empty'] ) && filter_var( wp_unslash( $_POST['empty'] ), FILTER_VALIDATE_BOOLEAN ) ) {
			WC()->session->__unset( self::WOOPAY_SESSION_KEY );

			wp_send_json_success();

			return;
		}

		$data = [
			'save_user_in_woopay'     => filter_var( wp_unslash( $_POST['save_user_in_woopay'] ), FILTER_VALIDATE_BOOLEAN ),
			'woopay_source_url'       =>
			wc_clean( wp_unslash( $_POST['woopay_source_url'] ) ),
			'woopay_is_blocks'        => filter_var( wp_unslash( $_POST['save_user_in_woopay'] ), FILTER_VALIDATE_BOOLEAN ),
			'woopay_viewport'         => wc_clean( wp_unslash( $_POST['woopay_viewport'] ) ),
			'woopay_user_phone_field' => [
				'full' => wc_clean( wp_unslash( $_POST['woopay_user_phone_field']['full'] ) ),
			],
		];

		WC()->session->set( self::WOOPAY_SESSION_KEY, $data );

		wp_send_json_success();
	}

	/**
	 * Used to initialize woopay session on frontend
	 *
	 * @return void
	 */
	public static function ajax_get_woopay_minimum_session_data() {
		$is_nonce_valid = check_ajax_referer( 'woopay_session_nonce', false, false );

		if ( ! $is_nonce_valid ) {
			wp_send_json_error(
				__( 'You aren’t authorized to do that.', 'poocommerce-payments' ),
				403
			);
		}

		$blog_id = Jetpack_Options::get_option( 'id' );
		if ( empty( $blog_id ) ) {
			wp_send_json_error(
				__( 'Could not determine the blog ID.', 'poocommerce-payments' ),
				503
			);
		}

		wp_send_json( self::get_woopay_minimum_session_data() );
	}

	/**
	 * Return WooPay minimum session data.
	 *
	 * @return array Array of minimum session data used by WooPay or false on failures.
	 */
	public static function get_woopay_minimum_session_data() {
		if ( ! extension_loaded( 'openssl' ) || ! function_exists( 'openssl_encrypt' ) ) {
			return [];
		}

		$blog_id = Jetpack_Options::get_option( 'id' );
		if ( empty( $blog_id ) ) {
			return [];
		}

		$data = [
			'wcpay_version'     => WCPAY_VERSION_NUMBER,
			'blog_id'           => $blog_id,
			'blog_rest_url'     => get_rest_url(),
			'blog_checkout_url' => wc_get_checkout_url(),
			'session_nonce'     => self::create_woopay_nonce( get_current_user_id() ),
			'store_api_token'   => self::init_store_api_token(),
		];

		return WooPay_Utilities::encrypt_and_sign_data( $data );
	}

	/**
	 * Get the WooPay verified email address from the header.
	 *
	 * @return string|null The WooPay verified email address if it's set.
	 */
	private static function get_woopay_verified_email_address() {
		$has_woopay_verified_email_address = isset( $_SERVER['HTTP_X_WOOPAY_VERIFIED_EMAIL_ADDRESS'] );

		return $has_woopay_verified_email_address ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_WOOPAY_VERIFIED_EMAIL_ADDRESS'] ) ) : null;
	}

	/**
	 * Returns true if the request that's currently being processed is from WooPay, false
	 * otherwise.
	 *
	 * @return bool True if request is from WooPay.
	 */
	private static function is_request_from_woopay(): bool {
		return isset( $_SERVER['HTTP_USER_AGENT'] ) && 'WooPay' === $_SERVER['HTTP_USER_AGENT'];
	}

	/**
	 * Returns true if the request that's currently being processed is signed with the blog token.
	 *
	 * @return bool True if the request signature is valid.
	 */
	private static function has_valid_request_signature() {
		return apply_filters( 'wcpay_woopay_is_signed_with_blog_token', Rest_Authentication::is_signed_with_blog_token() );
	}

	/**
	 * Returns true if WooPay is enabled, false otherwise.
	 *
	 * @return bool True if WooPay is enabled, false otherwise.
	 */
	private static function is_woopay_enabled(): bool {
		// There were previously instances of this function being called too early. While those should be resolved, adding this defensive check as well.
		if ( ! class_exists( WC_Payments_Features::class ) || ! class_exists( WC_Payments::class ) || is_null( WC_Payments::get_gateway() ) ) {
			return false;
		}

		return WC_Payments_Features::is_woopay_eligible() && 'yes' === WC_Payments::get_gateway()->get_option( 'platform_checkout', 'no' );
	}

	/**
	 * Initializes the WooPay_Store_Api_Token class and returns the Cart token.
	 *
	 * @return string The Cart Token.
	 */
	private static function init_store_api_token() {
		$cart_route = WooPay_Store_Api_Token::init();

		return $cart_route->get_cart_token();
	}

	/**
	 * Retrieves the Store API URL.
	 *
	 * @return string
	 */
	private static function get_store_api_url() {
		if ( class_exists( StoreApi::class ) && class_exists( RoutesController::class ) ) {
			try {
				$cart          = StoreApi::container()->get( RoutesController::class )->get( 'cart' );
				$store_api_url = method_exists( $cart, 'get_namespace' ) ? $cart->get_namespace() : 'wc/store';
			} catch ( \Exception $e ) {
				$store_api_url = 'wc/store';
			}
		}

		return get_rest_url( null, $store_api_url ?? 'wc/store' );
	}

	/**
	 * WooPay requests to the merchant API does not include a cookie, so the token
	 * is always empty. This function creates a nonce that can be used without
	 * a cookie.
	 *
	 * @param int $uid The uid to be used for the nonce. Most likely the user ID.
	 * @return false|string
	 */
	private static function create_woopay_nonce( int $uid ) {
		$action = 'wc_store_api';
		$token  = '';
		$i      = wp_nonce_tick( $action );

		return substr( wp_hash( $i . '|' . $action . '|' . $uid . '|' . $token, 'nonce' ), -12, 10 );
	}

	/**
	 * Gets the custom message from the settings and replaces the placeholders with the correct links.
	 *
	 * @return string The custom message with the placeholders replaced.
	 */
	private static function get_formatted_custom_terms() {
		$custom_message = WC_Payments::get_gateway()->get_option( 'platform_checkout_custom_message' );

		$terms_value          = wc_terms_and_conditions_page_id() ?
			'<a href="' . get_permalink( wc_terms_and_conditions_page_id() ) . '">' . __( 'Terms of Service', 'poocommerce-payments' ) . '</a>' :
			__( 'Terms of Service', 'poocommerce-payments' );
		$privacy_policy_value = wc_privacy_policy_page_id() ?
			'<a href="' . get_permalink( wc_privacy_policy_page_id() ) . '">' . __( 'Privacy Policy', 'poocommerce-payments' ) . '</a>' :
			__( 'Privacy Policy', 'poocommerce-payments' );

		$replacement_map = [
			'[terms_of_service_link]' => $terms_value,
			'[terms]'                 => $terms_value,
			'[privacy_policy_link]'   => $privacy_policy_value,
			'[privacy_policy]'        => $privacy_policy_value,
		];

		return str_replace( array_keys( $replacement_map ), array_values( $replacement_map ), $custom_message );
	}

	/**
	 * Returns the status of checkout optional/required address fields.
	 *
	 * @return array The status of the checkout fields.
	 */
	private static function get_option_fields_status() {
		// Shortcode checkout options.
		$company                              = get_option( 'poocommerce_checkout_company_field', 'optional' );
		$address_2                            = get_option( 'poocommerce_checkout_address_2_field', 'optional' );
		$phone                                = get_option( 'poocommerce_checkout_phone_field', 'required' );
		$has_terms_and_condition_page         = ! empty( get_option( 'poocommerce_terms_page_id', null ) );
		$terms_and_conditions                 = wp_kses_post( wc_replace_policy_page_link_placeholders( wc_get_terms_and_conditions_checkbox_text() ) );
		$has_privacy_policy_page              = ! empty( get_option( 'wp_page_for_privacy_policy', null ) );
		$custom_below_place_order_button_text = self::get_formatted_custom_terms();
		$below_place_order_button_text        = $custom_below_place_order_button_text;
		$show_terms_checkbox                  = false;

		// Blocks checkout options. To get the blocks checkout options, we need
		// to parse the checkout page content because the options are stored
		// in the blocks HTML as a JSON.
		$checkout_page_id = get_option( 'poocommerce_checkout_page_id' );
		$checkout_page    = get_post( $checkout_page_id );

		/*
		 * Will show the terms checkbox if the terms page is set.
		 * Will show the checkbox even when the text is loaded from the custom field or the policy page field.
		 */
		if ( $has_terms_and_condition_page && $terms_and_conditions ) {
			$show_terms_checkbox = true;
			if ( ! $below_place_order_button_text ) {
				$below_place_order_button_text = $terms_and_conditions;
			}
		}

		if ( ! $below_place_order_button_text && $has_privacy_policy_page ) {
			$show_terms_checkbox           = false;
			$below_place_order_button_text = wp_kses_post( wc_replace_policy_page_link_placeholders( wc_get_privacy_policy_text( 'checkout' ) ) );
		}

		if ( empty( $checkout_page ) ) {
			return [
				'company'        => $company,
				'address_2'      => $address_2,
				'phone'          => $phone,
				'terms_checkbox' => $show_terms_checkbox,
				'custom_terms'   => $below_place_order_button_text,
			];
		}

		$checkout_page_blocks = parse_blocks( $checkout_page->post_content );
		$checkout_block_index = array_search( 'poocommerce/checkout', array_column( $checkout_page_blocks, 'blockName' ), true );

		// If we can find the index, it means the merchant checkout page is using blocks checkout.
		if ( false !== $checkout_block_index ) {
			$below_place_order_button_text = $custom_below_place_order_button_text;
			$company                       = 'optional';
			$address_2                     = 'optional';
			$phone                         = 'optional';

			if ( ! empty( $checkout_page_blocks[ $checkout_block_index ]['attrs'] ) ) {
				$checkout_block_attrs = $checkout_page_blocks[ $checkout_block_index ]['attrs'];

				if ( ! empty( $checkout_block_attrs['requireCompanyField'] ) ) {
					$company = 'required';
				}

				if ( ! empty( $checkout_block_attrs['requirePhoneField'] ) ) {
					$phone = 'required';
				}

				// showCompanyField is undefined by default.
				if ( empty( $checkout_block_attrs['showCompanyField'] ) ) {
					$company = 'hidden';
				}

				if ( isset( $checkout_block_attrs['showApartmentField'] ) && false === $checkout_block_attrs['showApartmentField'] ) {
					$address_2 = 'hidden';
				}

				if ( isset( $checkout_block_attrs['showPhoneField'] ) && false === $checkout_block_attrs['showPhoneField'] ) {
					$phone = 'hidden';
				}
			}

			$fields_block                  = self::get_inner_block( $checkout_page_blocks[ $checkout_block_index ], 'poocommerce/checkout-fields-block' );
			$terms_block                   = self::get_inner_block( $fields_block, 'poocommerce/checkout-terms-block' );
			$show_terms_checkbox           = isset( $terms_block['attrs']['checkbox'] ) && $terms_block['attrs']['checkbox'];
			$below_place_order_button_text = self::get_blocks_terms_and_conditions_text( $terms_block );

		}

		return [
			'company'        => $company,
			'address_2'      => $address_2,
			'phone'          => $phone,
			'terms_checkbox' => $show_terms_checkbox,
			'custom_terms'   => $below_place_order_button_text,
		];
	}

	/**
	 * Gets the blocks terms and conditions text.
	 *
	 * @param array $terms_block the terms block.
	 * @return string
	 */
	private static function get_blocks_terms_and_conditions_text( $terms_block ) {

		if ( isset( $terms_block['attrs']['text'] ) ) {
			return $terms_block['attrs']['text'];
		}

		$privacy_page_link = get_privacy_policy_url();
		$privacy_page_link = $privacy_page_link
			? '<a href="' . $privacy_page_link . '" target="_blank">' . __( 'Privacy Policy', 'poocommerce-payments' ) . '</a>'
			: __( 'Privacy Policy', 'poocommerce-payments' );

		$terms_page_id   = wc_terms_and_conditions_page_id();
		$terms_page_link = '';
		if ( $terms_page_id ) {
			$terms_page_link = get_permalink( $terms_page_id );
		}

		$terms_page_link = $terms_page_link
			? '<a href="' . $terms_page_link . '" target="_blank">' . __( 'Terms and Conditions', 'poocommerce-payments' ) . '</a>'
			: __( 'Terms and Conditions', 'poocommerce-payments' );

		return sprintf(
			/* translators: %1$s terms page link, %2$s privacy page link. */
			__( 'You must accept our %1$s and %2$s to continue with your purchase.', 'poocommerce-payments' ),
			$terms_page_link,
			$privacy_page_link
		);
	}

	/**
	 * Searches for an inner block with the given name.
	 *
	 * @param array  $current_block A block that contains child blocks.
	 * @param string $inner_block_name The name of a child block.
	 * @return array|null
	 */
	private static function get_inner_block( $current_block, $inner_block_name ) {

		if ( ! isset( $current_block['innerBlocks'] ) ) {
			return;
		}

		$inner_block_index = array_search(
			$inner_block_name,
			array_column(
				$current_block['innerBlocks'],
				'blockName'
			),
			true
		);

		if ( ! isset( $current_block['innerBlocks'][ $inner_block_index ] ) ) {
			return;
		}

		return $current_block['innerBlocks'][ $inner_block_index ];
	}
}
