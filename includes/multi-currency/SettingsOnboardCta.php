<?php
/**
 * PooCommerce Payments Multi-Currency Settings
 *
 * @package PooCommerce\Admin
 */

namespace WCPay\MultiCurrency;

use WCPay\MultiCurrency\Interfaces\MultiCurrencyAccountInterface;

defined( 'ABSPATH' ) || exit;

/**
 * MultiCurrency settings placeholder containing a CTA to connect the account.
 */
class SettingsOnboardCta extends \WC_Settings_Page {
	/**
	 * Link to the Multi-Currency documentation page.
	 *
	 * @var string
	 */
	const LEARN_MORE_URL = 'https://poocommerce.com/document/woopayments/currencies/multi-currency-setup/';

	/**
	 * MultiCurrency instance.
	 *
	 * @var MultiCurrency
	 */
	private $multi_currency;

	/**
	 * Instance of MultiCurrencyAccountInterface.
	 *
	 * @var MultiCurrencyAccountInterface
	 */
	private $payments_account;

	/**
	 * Constructor.
	 *
	 * @param MultiCurrency                 $multi_currency The MultiCurrency instance.
	 * @param MultiCurrencyAccountInterface $payments_account Payments Account instance.
	 */
	public function __construct( MultiCurrency $multi_currency, MultiCurrencyAccountInterface $payments_account ) {
		$this->multi_currency   = $multi_currency;
		$this->payments_account = $payments_account;
		$this->id               = $this->multi_currency->id;
		$this->label            = _x( 'Multi-currency', 'Settings tab label', 'poocommerce-payments' );

		parent::__construct();
	}

	/**
	 * Initializes this class' WP hooks.
	 *
	 * @return void
	 */
	public function init_hooks() {
		add_action( 'poocommerce_admin_field_wcpay_currencies_settings_onboarding_cta', [ $this, 'currencies_settings_onboarding_cta' ] );
	}

	/**
	 * Output the call to action button if needing to onboard.
	 */
	public function currencies_settings_onboarding_cta() {
		$href = $this->payments_account->get_provider_onboarding_page_url();
		?>
			<div>
				<p>
					<?php
						printf(
							/* translators: %s: WooPayments */
							esc_html__( 'To add new currencies to your store, please finish setting up %s.', 'poocommerce-payments' ),
							'WooPayments'
						);
					?>
				</p>
				<a href="<?php echo esc_url( $href ); ?>" id="wcpay_enabled_currencies_onboarding_cta" type="button" class="button-primary">
					<?php esc_html_e( 'Get started', 'poocommerce-payments' ); ?>
				</a>
			</div>
		<?php
	}

	/**
	 * Get settings array.
	 *
	 * @param string $current_section Section being shown.
	 * @return array
	 */
	public function get_settings( $current_section = '' ) {
		// Hide the save button because there are no settings to save.
		global $hide_save_button;
		$hide_save_button = true;

		return [
			[
				'title' => __( 'Enabled currencies', 'poocommerce-payments' ),
				'desc'  => sprintf(
					/* translators: %s: url to documentation. */
					__( 'Accept payments in multiple currencies. Prices are converted based on exchange rates and rounding rules. <a href="%s">Learn more</a>', 'poocommerce-payments' ),
					self::LEARN_MORE_URL
				),
				'type'  => 'title',
				'id'    => $this->id . '_enabled_currencies',
			],
			[
				'type' => 'wcpay_currencies_settings_onboarding_cta',
			],
			[
				'type' => 'sectionend',
				'id'   => $this->id . '_enabled_currencies',
			],
		];
	}
}
