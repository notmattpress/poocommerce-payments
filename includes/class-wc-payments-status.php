<?php
/**
 * WC_Payments_Status class
 *
 * @package PooCommerce\Payments
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Hooks into Woo Status pages to provide extra tooling and information about WCPay.
 */
class WC_Payments_Status {
	/**
	 * Instance of WC_Payment_Gateway_WCPay
	 *
	 * @var WC_Payment_Gateway_WCPay
	 */
	private $gateway;

	/**
	 * Instance of WC_Payments_Http_Interface
	 *
	 * @var WC_Payments_Http_Interface
	 */
	private $http;

	/**
	 * Instance of WC_Payments_Account
	 *
	 * @var WC_Payments_Account
	 */
	private $account;

	/**
	 * WC_Payments_Status constructor.
	 *
	 * @param WC_Payment_Gateway_WCPay   $gateway The main gateway instance.
	 * @param WC_Payments_Http_Interface $http    A class implementing WC_Payments_Http_Interface.
	 * @param WC_Payments_Account        $account The account service.
	 */
	public function __construct( $gateway, $http, $account ) {
		$this->gateway = $gateway;
		$this->http    = $http;
		$this->account = $account;
	}

	/**
	 * Initializes this class's WP hooks.
	 *
	 * @return void
	 */
	public function init_hooks() {
		add_action( 'poocommerce_system_status_report', [ $this, 'render_status_report_section' ], 1 );
		add_filter( 'poocommerce_debug_tools', [ $this, 'debug_tools' ] );
	}

	/**
	 * Get the locations where an express checkout method is enabled.
	 *
	 * @param string $method_id The method identifier (payment_request, woopay, amazon_pay, link).
	 * @return array List of locations where the method is enabled.
	 */
	private function get_express_checkout_method_locations( $method_id ) {
		$locations         = [ 'product', 'cart', 'checkout' ];
		$enabled_locations = [];

		foreach ( $locations as $location ) {
			$enabled_methods = $this->gateway->get_option( "express_checkout_{$location}_methods", [] );
			if ( is_array( $enabled_methods ) && in_array( $method_id, $enabled_methods, true ) ) {
				$enabled_locations[] = $location;
			}
		}

		return $enabled_locations;
	}

	/**
	 * Add WCPay tools to the Woo debug tools.
	 *
	 * @param array $tools List of current available tools.
	 */
	public function debug_tools( $tools ) {
		return array_merge(
			$tools,
			[
				'clear_wcpay_account_cache' => [
					'name'     => sprintf(
						/* translators: %s: WooPayments */
						__( 'Clear %s account cache', 'poocommerce-payments' ),
						'WooPayments'
					),
					'button'   => __( 'Clear', 'poocommerce-payments' ),
					'desc'     => sprintf(
						/* translators: %s: WooPayments */
						__( 'This tool will clear the cached account values used in %s.', 'poocommerce-payments' ),
						'WooPayments'
					),
					'callback' => [ $this->account, 'refresh_account_data' ],
				],
				'delete_wcpay_test_orders'  => [
					'name'     => sprintf(
						/* translators: %s: WooPayments */
						__( 'Delete %s test orders', 'poocommerce-payments' ),
						'WooPayments'
					),
					'button'   => __( 'Delete', 'poocommerce-payments' ),
					'desc'     => sprintf(
						/* translators: %s: WooPayments */
						__( '<strong class="red">Note:</strong> This option deletes all test mode orders placed via %s. Orders placed via other gateways will not be affected. Use with caution, as this action cannot be undone.', 'poocommerce-payments' ),
						'WooPayments'
					),
					'callback' => [ $this, 'delete_test_orders' ],
				],
			]
		);
	}

	/**
	 * Deletes all test orders created with WooPayments.
	 *
	 * Test orders are identified by the '_wcpay_mode' meta key with value 'test'.
	 *
	 * @return string Success or error message.
	 */
	public function delete_test_orders() {
		// Add explicit capability check.
		if ( ! current_user_can( 'manage_poocommerce' ) ) {
			return __( 'You do not have permission to delete orders.', 'poocommerce-payments' );
		}

		try {
			// Get all orders with test mode meta.
			$test_orders = wc_get_orders(
				[
					'limit'      => -1,
					// phpcs:ignore
					'meta_key'   => WC_Payments_Order_Service::WCPAY_MODE_META_KEY,
					// phpcs:ignore
					'meta_value' => 'test',
					'return'     => 'objects',
				]
			);

			if ( empty( $test_orders ) ) {
				return __( 'No test orders found.', 'poocommerce-payments' );
			}

			$deleted_count = 0;
			foreach ( $test_orders as $order ) {
				// Permanently delete the order (skip trash).
				if ( $order->delete( true ) ) {
					++$deleted_count;
				}
			}

			return sprintf(
				/* translators: %d: number of orders deleted */
				_n(
					'%d test order has been permanently deleted.',
					'%d test orders have been permanently deleted.',
					$deleted_count,
					'poocommerce-payments'
				),
				$deleted_count
			);
		} catch ( Exception $e ) {
			return sprintf(
				/* translators: %s: error message */
				__( 'Error deleting test orders: %s', 'poocommerce-payments' ),
				$e->getMessage()
			);
		}
	}

	/**
	 * Renders WCPay information on the status page.
	 */
	public function render_status_report_section() {
		?>
	<table class="wc_status_table widefat" cellspacing="0">
		<thead>
			<tr>
				<th colspan="3" data-export-label="WooPayments">
					<h2>WooPayments</h2>
				</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td data-export-label="Version"><?php esc_html_e( 'Version', 'poocommerce-payments' ); ?>:</td>
				<td class="help">
					<?php
					/* translators: %s: WooPayments */
					echo wc_help_tip( sprintf( esc_html__( 'The current version of the %s extension.', 'poocommerce-payments' ), 'WooPayments' ) ); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.OutputNotEscaped */
					?>
				</td>
				<td><?php echo esc_html( WCPAY_VERSION_NUMBER ); ?></td>
			</tr>
			<tr>
				<td data-export-label="Connected to WPCOM"><?php esc_html_e( 'Connected to WPCOM', 'poocommerce-payments' ); ?>:</td>
				<td class="help">
					<?php
					/* translators: %s: WooPayments */
					echo wc_help_tip( sprintf( esc_html__( 'Can your store connect securely to wordpress.com? Without a proper WPCOM connection %s can\'t function!', 'poocommerce-payments' ), 'WooPayments' ) ); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.OutputNotEscaped */
					?>
				</td>
				<td><?php echo $this->http->is_connected() ? esc_html__( 'Yes', 'poocommerce-payments' ) : '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . esc_html__( 'No', 'poocommerce-payments' ) . '</mark>'; ?></td>
			</tr>
			<?php if ( $this->http->is_connected() ) : ?>
				<tr>
					<td data-export-label="WPCOM Blog ID"><?php esc_html_e( 'WPCOM Blog ID', 'poocommerce-payments' ); ?>:</td>
					<td class="help"><?php echo wc_help_tip( esc_html__( 'The corresponding wordpress.com blog ID for this store.', 'poocommerce-payments' ) ); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.OutputNotEscaped */ ?></td>
					<td><?php echo esc_html( $this->http->is_connected() ? $this->http->get_blog_id() : '-' ); ?></td>
				</tr>
				<tr>
					<td data-export-label="Account ID"><?php esc_html_e( 'Account ID', 'poocommerce-payments' ); ?>:</td>
					<td class="help"><?php echo wc_help_tip( esc_html__( 'The merchant account ID you are currently using to process payments with.', 'poocommerce-payments' ) ); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.OutputNotEscaped */ ?></td>
					<td><?php echo $this->gateway->is_connected() ? esc_html( $this->account->get_stripe_account_id() ?? '-' ) : '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . esc_html__( 'Not connected', 'poocommerce-payments' ) . '</mark>'; ?></td>
				</tr>
				<?php
				// Only display the rest if the payment gateway is connected since many places check for this and we might get inaccurate data.
				if ( $this->gateway->is_connected() ) :
					?>
					<tr>
						<td data-export-label="Payment Gateway"><?php esc_html_e( 'Payment Gateway', 'poocommerce-payments' ); ?>:</td>
						<td class="help"><?php echo wc_help_tip( esc_html__( 'Is the payment gateway ready and enabled for use on your store?', 'poocommerce-payments' ) ); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.OutputNotEscaped */ ?></td>
						<td><?php echo $this->gateway->needs_setup() ? '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . esc_html__( 'Needs setup', 'poocommerce-payments' ) . '</mark>' : ( $this->gateway->is_enabled() ? esc_html__( 'Enabled', 'poocommerce-payments' ) : esc_html__( 'Disabled', 'poocommerce-payments' ) ); ?></td>
					</tr>
					<tr>
						<td data-export-label="Test Mode"><?php esc_html_e( 'Test Mode', 'poocommerce-payments' ); ?>:</td>
						<td class="help"><?php echo wc_help_tip( esc_html__( 'Whether the payment gateway has test payments enabled or not.', 'poocommerce-payments' ) ); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.OutputNotEscaped */ ?></td>
						<td><?php WC_Payments::mode()->is_test() ? esc_html_e( 'Enabled', 'poocommerce-payments' ) : esc_html_e( 'Disabled', 'poocommerce-payments' ); ?></td>
					</tr>
					<tr>
						<td data-export-label="Enabled APMs"><?php esc_html_e( 'Enabled APMs', 'poocommerce-payments' ); ?>:</td>
						<td class="help"><?php echo wc_help_tip( esc_html__( 'What payment methods are enabled for the store.', 'poocommerce-payments' ) ); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.OutputNotEscaped */ ?></td>
						<td><?php echo esc_html( implode( ',', $this->gateway->get_upe_enabled_payment_method_ids() ) ); ?></td>
					</tr>

					<?php if ( ! WC_Payments_Features::is_woopay_express_checkout_enabled() ) : ?>
					<tr>
						<td data-export-label="WooPay"><?php esc_html_e( 'WooPay Express Checkout', 'poocommerce-payments' ); ?>:</td>
						<td class="help">
							<?php
							/* translators: %s: WooPayments */
							echo wc_help_tip( sprintf( esc_html__( 'WooPay is not available, as a %s feature, or the store is not yet eligible.', 'poocommerce-payments' ), 'WooPayments' ) ); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.OutputNotEscaped */
							?>
						</td>
						<td><?php echo ! WC_Payments_Features::is_woopay_eligible() ? esc_html__( 'Not eligible', 'poocommerce-payments' ) : esc_html__( 'Not active', 'poocommerce-payments' ); ?></td>
					</tr>
<?php else : ?>
					<tr>
						<td data-export-label="WooPay"><?php esc_html_e( 'WooPay Express Checkout', 'poocommerce-payments' ); ?>:</td>
						<td class="help"><?php echo wc_help_tip( esc_html__( 'Whether the new WooPay Express Checkout is enabled or not.', 'poocommerce-payments' ) ); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.OutputNotEscaped */ ?></td>
						<td>
						<?php
						$woopay_enabled_locations = $this->get_express_checkout_method_locations( 'woopay' );
						$woopay_enabled_locations = empty( $woopay_enabled_locations ) ? 'no locations enabled' : implode( ',', $woopay_enabled_locations );
						echo esc_html( WC_Payments_Features::is_woopay_enabled() ? __( 'Enabled', 'poocommerce-payments' ) . ' (' . $woopay_enabled_locations . ')' : __( 'Disabled', 'poocommerce-payments' ) );
						?>
						</td>
					</tr>
					<tr>
						<td data-export-label="WooPay Incompatible Extensions"><?php esc_html_e( 'WooPay Incompatible Extensions', 'poocommerce-payments' ); ?>:</td>
						<td class="help"><?php echo wc_help_tip( esc_html__( 'Whether there are extensions active that are have known incompatibilities with the functioning of the new WooPay Express Checkout.', 'poocommerce-payments' ) ); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.OutputNotEscaped */ ?></td>
						<td><?php get_option( \WCPay\WooPay\WooPay_Scheduler::INVALID_EXTENSIONS_FOUND_OPTION_NAME, false ) ? esc_html_e( 'Yes', 'poocommerce-payments' ) : esc_html_e( 'No', 'poocommerce-payments' ); ?></td>
					</tr>
<?php endif; ?>

					<tr>
						<td data-export-label="Apple Pay / Google Pay"><?php esc_html_e( 'Apple Pay / Google Pay Express Checkout', 'poocommerce-payments' ); ?>:</td>
						<td class="help"><?php echo wc_help_tip( esc_html__( 'Whether the store has Payment Request enabled or not.', 'poocommerce-payments' ) ); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.OutputNotEscaped */ ?></td>
						<td>
						<?php
						$payment_request_enabled           = $this->gateway->is_payment_request_enabled();
						$payment_request_enabled_locations = $this->get_express_checkout_method_locations( 'payment_request' );
						$payment_request_enabled_locations = empty( $payment_request_enabled_locations ) ? 'no locations enabled' : implode( ',', $payment_request_enabled_locations );
						echo esc_html( $payment_request_enabled ? __( 'Enabled', 'poocommerce-payments' ) . ' (' . $payment_request_enabled_locations . ')' : __( 'Disabled', 'poocommerce-payments' ) );
						?>
						</td>
					</tr>
					<tr>
						<td data-export-label="Fraud Protection Level"><?php esc_html_e( 'Fraud Protection Level', 'poocommerce-payments' ); ?>:</td>
						<td class="help"><?php echo wc_help_tip( esc_html__( 'The current fraud protection level the payment gateway is using.', 'poocommerce-payments' ) ); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.OutputNotEscaped */ ?></td>
						<td><?php echo esc_html( $this->gateway->get_option( 'current_protection_level' ) ); ?></td>
					</tr>
					<?php if ( $this->gateway->get_option( 'current_protection_level' ) === 'advanced' ) : ?>
					<tr>
						<td data-export-label="Enabled Fraud Filters"><?php esc_html_e( 'Enabled Fraud Filters', 'poocommerce-payments' ); ?>:</td>
						<td class="help"><?php echo wc_help_tip( esc_html__( 'The advanced fraud protection filters currently enabled.', 'poocommerce-payments' ) ); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.OutputNotEscaped */ ?></td>
						<td>
							<?php
							// Process the list.
							$adv_fraud_settings = json_decode( wp_json_encode( $this->gateway->get_option( 'advanced_fraud_protection_settings' ) ), true );
							$list               = array_filter(
								array_map(
									function ( $rule ) {
										if ( empty( $rule['key'] ) ) {
											return null;
										}

										switch ( $rule['key'] ) {
											case 'avs_verification':
												return 'AVS Verification';
											case 'international_ip_address':
												return 'International IP Address';
											case 'ip_address_mismatch':
												return 'IP Address Mismatch';
											case 'address_mismatch':
												return 'Address Mismatch';
											case 'purchase_price_threshold':
												return 'Purchase Price Threshold';
											case 'order_items_threshold':
												return 'Order Items Threshold';
											default:
												// Ignore all others.
												return null;
										}
									},
									$adv_fraud_settings
								)
							);

							echo empty( $list ) ? '-' : esc_html( implode( ',', $list ) );
							?>
						</td>
					</tr>
<?php endif; ?>

					<tr>
						<td data-export-label="Multi-currency"><?php esc_html_e( 'Multi-currency', 'poocommerce-payments' ); ?>:</td>
						<td class="help"><?php echo wc_help_tip( esc_html__( 'Whether the store has the Multi-currency feature enabled or not.', 'poocommerce-payments' ) ); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.OutputNotEscaped */ ?></td>
						<td><?php WC_Payments_Features::is_customer_multi_currency_enabled() ? esc_html_e( 'Enabled', 'poocommerce-payments' ) : esc_html_e( 'Disabled', 'poocommerce-payments' ); ?></td>
					</tr>
					<tr>
						<td data-export-label="Auth and Capture"><?php esc_html_e( 'Auth and Capture', 'poocommerce-payments' ); ?>:</td>
						<td class="help"><?php echo wc_help_tip( esc_html__( 'Whether the store has the Auth & Capture feature enabled or not.', 'poocommerce-payments' ) ); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.OutputNotEscaped */ ?></td>
						<td>
						<?php
							$manual_capture_enabled = 'yes' === $this->gateway->get_option( 'manual_capture' );
							echo $manual_capture_enabled ? esc_html__( 'Enabled', 'poocommerce-payments' ) : esc_html__( 'Disabled', 'poocommerce-payments' );
						?>
						</td>
					</tr>
					<tr>
						<td data-export-label="Documents"><?php esc_html_e( 'Documents', 'poocommerce-payments' ); ?>:</td>
						<td class="help"><?php echo wc_help_tip( esc_html__( 'Whether the tax documents section is enabled or not.', 'poocommerce-payments' ) ); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.OutputNotEscaped */ ?></td>
						<td><?php WC_Payments_Features::is_documents_section_enabled() ? esc_html_e( 'Enabled', 'poocommerce-payments' ) : esc_html_e( 'Disabled', 'poocommerce-payments' ); ?></td>
					</tr>
<?php endif; // Gateway connected. ?>
<?php endif; // Connected to WPCOM. ?>
			<tr>
				<td data-export-label="Logging"><?php esc_html_e( 'Logging', 'poocommerce-payments' ); ?>:</td>
				<td class="help"><?php echo wc_help_tip( esc_html__( 'Whether debug logging is enabled and working or not.', 'poocommerce-payments' ) ); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.OutputNotEscaped */ ?></td>
				<td><?php \WCPay\Logger::can_log() ? esc_html_e( 'Enabled', 'poocommerce-payments' ) : esc_html_e( 'Disabled', 'poocommerce-payments' ); ?></td>
			</tr>
		</tbody>
	</table>
		<?php
	}
}
