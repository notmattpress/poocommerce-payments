<?php
/**
 * Class WC_Payments_Admin_Settings
 *
 * @package PooCommerce\Payments\Admin
 */

/**
 * WC_Payments_Admin_Settings class.
 */
class WC_Payments_Admin_Settings {

	/**
	 * WC_Payment_Gateway_WCPay.
	 *
	 * @var WC_Payment_Gateway_WCPay
	 */
	private $gateway;

	/**
	 * Set of parameters to build the URL to the gateway's settings page.
	 *
	 * @var string[]
	 */
	private static $settings_url_params = [
		'page'    => 'wc-settings',
		'tab'     => 'checkout',
		'section' => WC_Payment_Gateway_WCPay::GATEWAY_ID,
	];

	/**
	 * Initialize class actions.
	 *
	 * @param WC_Payment_Gateway_WCPay $gateway Payment Gateway.
	 */
	public function __construct( WC_Payment_Gateway_WCPay $gateway ) {
		$this->gateway = $gateway;
	}

	/**
	 * Initializes this class's WP hooks.
	 *
	 * @return void
	 */
	public function init_hooks() {
		add_action( 'poocommerce_poocommerce_payments_admin_notices', [ $this, 'display_test_mode_notice' ] );
		add_filter( 'plugin_action_links_' . plugin_basename( WCPAY_PLUGIN_FILE ), [ $this, 'add_plugin_links' ] );
	}

	/**
	 * Add notice explaining test mode when it's enabled.
	 */
	public function display_test_mode_notice() {
		if ( WC_Payments::mode()->is_test() ) {
			?>
			<div id="wcpay-test-mode-notice" class="notice notice-warning">
				<p>
					<b><?php esc_html_e( 'You are using a test account. ', 'poocommerce-payments' ); ?></b>
					<?php
						printf(
							wp_kses_post(
								/* translators: %s: URL to learn more */
								__( 'Provide additional details about your business so you can begin accepting real payments. <a href="%s" target="_blank" rel="noreferrer noopener">Learn more</a>', 'poocommerce-payments' ),
							),
							esc_url( 'https://poocommerce.com/document/woopayments/startup-guide/#sign-up-process' )
						);
					?>
				</p>
				<p>
					<a id="wcpay-activate-payments-button" href="#" class="button button-secondary">
						<?php esc_html_e( 'Activate payments', 'poocommerce-payments' ); ?>
					</a>
				</p>
			</div>
			<script type="text/javascript">
				// We dispatch an event to trigger the modal.
				// The listener is in the general-settings/index.js file.
				document.addEventListener( 'DOMContentLoaded', function() {
					var activateButton = document.getElementById( 'wcpay-activate-payments-button' );
					if ( ! activateButton ) {
						return;
					}
					activateButton.addEventListener( 'click', function( e ) {
						e.preventDefault();
						document.dispatchEvent( new CustomEvent( 'wcpay:activate_payments' ) );
					} );
				} );
			</script>
			<?php
		}
	}

	/**
	 * Adds links to the plugin's row in the "Plugins" Wp-Admin page.
	 *
	 * @see https://codex.wordpress.org/Plugin_API/Filter_Reference/plugin_action_links_(plugin_file_name)
	 * @param array $links The existing list of links that will be rendered.
	 * @return array The list of links that will be rendered, after adding some links specific to this plugin.
	 */
	public function add_plugin_links( $links ) {
		$plugin_links = [
			'<a href="' . esc_attr( self::get_settings_url() ) . '">' . esc_html__( 'Settings', 'poocommerce-payments' ) . '</a>',
		];

		return array_merge( $plugin_links, $links );
	}

	/**
	 * Whether the current page is the WooPayments settings page.
	 *
	 * @return bool
	 */
	public static function is_current_page_settings() {
		return count( self::$settings_url_params ) === count( array_intersect_assoc( $_GET, self::$settings_url_params ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}

	/**
	 * Returns the URL of the configuration screen for this gateway, for use in internal links.
	 *
	 * @param array $query_args Optional additional query args to append to the URL.
	 *
	 * @return string URL of the configuration screen for this gateway
	 */
	public static function get_settings_url( $query_args = [] ) {
		return admin_url( add_query_arg( array_merge( self::$settings_url_params, $query_args ), 'admin.php' ) ); // nosemgrep: audit.php.wp.security.xss.query-arg -- constant string is passed in.
	}
}
