<?php
/**
 * Compatibility_Service class
 *
 * @package PooCommerce\Payments
 */

namespace WCPay;

use WC_Payments;
use WC_Payments_API_Client;
use WCPay\Exceptions\API_Exception;

defined( 'ABSPATH' ) || exit; // block direct access.

/**
 * Class to send compatibility data to the server.
 */
class Compatibility_Service {
	const UPDATE_COMPATIBILITY_DATA = 'wcpay_update_compatibility_data';

	/**
	 * Client for making requests to the PooCommerce Payments API
	 *
	 * @var WC_Payments_API_Client
	 */
	private $payments_api_client;

	/**
	 * Constructor for Compatibility_Service.
	 *
	 * @param WC_Payments_API_Client $payments_api_client PooCommerce Payments API client.
	 */
	public function __construct( WC_Payments_API_Client $payments_api_client ) {
		$this->payments_api_client = $payments_api_client;
	}

	/**
	 * Initializes this class's WP hooks.
	 *
	 * @return void
	 */
	public function init_hooks() {
		add_action( 'poocommerce_payments_account_refreshed', [ $this, 'update_compatibility_data' ] );
		add_action( 'after_switch_theme', [ $this, 'update_compatibility_data' ] );
		add_filter( 'wc_payments_get_onboarding_data_args', [ $this, 'add_compatibility_onboarding_data' ] );
	}

	/**
	 * Schedules the sending of the compatibility data to send only the last update in T minutes.
	 *
	 * @return void
	 */
	public function update_compatibility_data() {
		// This will delete the previous compatibility requests in the last two minutes, and only send the last update to the server, ensuring there's only one update in two minutes.
		WC_Payments::get_action_scheduler_service()->schedule_job( time() + 2 * MINUTE_IN_SECONDS, self::UPDATE_COMPATIBILITY_DATA );
	}

	/**
	 * Gets the data we need to confirm compatibility and sends it to the server.
	 *
	 * @return  void
	 */
	public function update_compatibility_data_hook() {
		$this->payments_api_client->update_compatibility_data( $this->get_compatibility_data() );
	}

	/**
	 * Adds the compatibility data to the onboarding args.
	 *
	 * @param array $args The args being sent when onboarding.
	 *
	 * @return array
	 */
	public function add_compatibility_onboarding_data( $args ): array {
		$args['compatibility_data'] = $this->get_compatibility_data();
		return $args;
	}

	/**
	 * Gets the compatibility data.
	 *
	 * @return array
	 */
	private function get_compatibility_data(): array {
		$active_plugins        = get_option( 'active_plugins', [] );
		$post_types_count      = $this->get_post_types_count();
		$wc_permalinks         = get_option( 'poocommerce_permalinks', [] );
		$wc_shop_permalink     = $this->get_permalink_for_page_id( 'shop' );
		$wc_cart_permalink     = $this->get_permalink_for_page_id( 'cart' );
		$wc_checkout_permalink = $this->get_permalink_for_page_id( 'checkout' );

		return [
			'woopayments_version'    => WCPAY_VERSION_NUMBER,
			'poocommerce_version'    => WC_VERSION,
			'poocommerce_permalinks' => $wc_permalinks,
			'poocommerce_shop'       => $wc_shop_permalink,
			'poocommerce_cart'       => $wc_cart_permalink,
			'poocommerce_checkout'   => $wc_checkout_permalink,
			'blog_theme'             => get_stylesheet(),
			'active_plugins'         => $active_plugins,
			'post_types_count'       => $post_types_count,
		];
	}

	/**
	 * Gets the count of public posts for each post type.
	 *
	 * @return array<\WP_Post_Type|string, int>
	 */
	private function get_post_types_count(): array {
		$post_types = get_post_types(
			[
				'public' => true,
			]
		);

		$post_types_count = [];

		foreach ( $post_types as $post_type ) {
			$post_types_count[ $post_type ] = (int) wp_count_posts( $post_type )->publish;
		}

		return $post_types_count;
	}

	/**
	 * Gets the permalink for a page ID.
	 *
	 * @param string $page_id The page ID to get the permalink for.
	 *
	 * @return string The permalink for the page ID, or 'Not set' if the permalink is not available.
	 */
	private function get_permalink_for_page_id( string $page_id ): string {
		$permalink = get_permalink( wc_get_page_id( $page_id ) );

		return $permalink ? $permalink : 'Not set';
	}
}
