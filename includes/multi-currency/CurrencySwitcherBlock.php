<?php
/**
 * PooCommerce Payments Currency Switcher Widget
 *
 * @package PooCommerce\Payments
 */

namespace WCPay\MultiCurrency;

use function http_build_query;
use function urldecode;

defined( 'ABSPATH' ) || exit;

/**
 * Currency Switcher Gutenberg Block.
 */
class CurrencySwitcherBlock {

	/**
	 * Instance of Multi-Currency.
	 *
	 * @var MultiCurrency $multi_currency
	 */
	protected $multi_currency;

	/**
	 * Instance of Compatibility.
	 *
	 * @var Compatibility $compatibility
	 */
	protected $compatibility;

	/**
	 * Constructor.
	 *
	 * @param MultiCurrency $multi_currency Instance of Multi-Currency.
	 * @param Compatibility $compatibility  Instance of Compatibility.
	 */
	public function __construct( MultiCurrency $multi_currency, Compatibility $compatibility ) {
		$this->multi_currency = $multi_currency;
		$this->compatibility  = $compatibility;
	}

	/**
	 * Initializes this class' WP hooks.
	 *
	 * @return void
	 */
	public function init_hooks() {
		add_action( 'init', [ $this, 'init_block_widget' ] );
	}

	/**
	 * Initialize the block currency switcher widget.
	 *
	 * @return void
	 */
	public function init_block_widget() {
		// Automatically load dependencies and version.
		$this->multi_currency->register_script_with_dependencies( 'poocommerce-payments/multi-currency-switcher', 'dist/multi-currency-switcher-block', [ 'wp-components' ] );

		register_block_type(
			'poocommerce-payments/multi-currency-switcher',
			[
				'api_version'     => '3',
				'editor_script'   => 'poocommerce-payments/multi-currency-switcher',
				'render_callback' => [ $this, 'render_block_widget' ],
				'attributes'      => [
					'symbol'          => [
						'type'    => 'boolean',
						'default' => true,
					],
					'flag'            => [
						'type'    => 'boolean',
						'default' => false,
					],
					'fontSize'        => [
						'type'    => 'integer',
						'default' => 14,
					],
					'fontLineHeight'  => [
						'type'    => 'number',
						'default' => 1.5,
					],
					'fontColor'       => [
						'type'    => 'string',
						'default' => '#000000',
					],
					'border'          => [
						'type'    => 'boolean',
						'default' => true,
					],
					'borderRadius'    => [
						'type'    => 'integer',
						'default' => 3,
					],
					'borderColor'     => [
						'type'    => 'string',
						'default' => '#000000',
					],
					'backgroundColor' => [
						'type'    => 'string',
						'default' => 'transparent',
					],
				],
			]
		);
	}

	/**
	 * Render the content of the block widget. Called by the render_callback callback.
	 * Normally, this could be all done on the JS side, however we need to use a dynamic
	 * block here because the currencies enabled on a site could change, and this would not update
	 * properly on the Gutenberg block, because it is cached.
	 *
	 * @param array $block_attributes The attributes (settings) applicable to this block. We expect this will contain
	 * the widget title, and whether or not we should render both flags and symbols.
	 *
	 * @return string The content to be displayed inside the block widget.
	 */
	public function render_block_widget( $block_attributes ): string {
		if ( $this->compatibility->should_disable_currency_switching() ) {
			return '';
		}

		$enabled_currencies = $this->multi_currency->get_enabled_currencies();

		if ( 1 === count( $enabled_currencies ) ) {
			return '';
		}

		$with_symbol = $block_attributes['symbol'] ?? true;
		$with_flag   = $block_attributes['flag'] ?? false;

		$styles        = $this->get_widget_styles( $block_attributes );
		$div_styles    = $this->implode_styles_array( $styles['div'] );
		$select_styles = $this->implode_styles_array( $styles['select'] );

		$widget_content  = '<form>';
		$widget_content .= $this->get_get_params();
		$widget_content .= '<div class="currency-switcher-holder" style="' . esc_attr( $div_styles ) . '">';
		$widget_content .= '<select name="currency" onchange="this.form.submit()" style="' . esc_attr( $select_styles ) . '">';

		foreach ( $enabled_currencies as $currency ) {
			$widget_content .= $this->render_currency_option( $currency, $with_symbol, $with_flag );
		}

		$widget_content .= '</select></div></form>';

		// Silence XSS warning because we are manually constructing the content and escaping everything above.
		// nosemgrep: audit.php.wp.security.xss.block-attr -- reason: we are manually constructing the content and escaping everything above.
		return $widget_content;
	}

	/**
	 * Create an <option> element with provided currency. With symbol and flag if requested.
	 *
	 * @param Currency $currency    Currency to use for <option> element.
	 * @param boolean  $with_symbol Whether to show the currency symbol.
	 * @param boolean  $with_flag   Whether to show the currency flag.
	 *
	 * @return string Display HTML of currency <option>, as a string.
	 */
	private function render_currency_option( Currency $currency, bool $with_symbol, bool $with_flag ): string {
		$code        = $currency->get_code();
		$same_symbol = html_entity_decode( $currency->get_symbol() ) === $code;
		$text        = $code;
		$selected    = $this->multi_currency->get_selected_currency()->code === $code ? 'selected' : '';

		if ( $with_symbol && ! $same_symbol ) {
			$text = $currency->get_symbol() . ' ' . $text;
		}
		if ( $with_flag ) {
			$text = $currency->get_flag() . ' ' . $text;
		}

		return '<option value="' . esc_attr( $code ) . '" ' . $selected . '>' . esc_html( $text ) . '</option>';
	}

	/**
	 * Given an array of styling rules, output them as a string containing valid CSS.
	 *
	 * @param array $styles An array of CSS styles.
	 *
	 * @return string
	 */
	private function implode_styles_array( array $styles ): string {
		$return_str = '';
		foreach ( $styles as $key => $value ) {
			$return_str .= $key . ': ' . $value . '; ';
		}

		return $return_str;
	}

	/**
	 * Generate the styles that need to be applied to the widget based on the block attributes.
	 *
	 * @param array $block_attributes The block attributes.
	 *
	 * @return array
	 */
	private function get_widget_styles( array $block_attributes ): array {
		return [
			'div'    => [
				'line-height' => $block_attributes['fontLineHeight'] ?? 1.2,
			],
			'select' => [
				'padding'          => '2px',
				'border'           => ! empty( $block_attributes['border'] ) ? '1px solid' : '0px solid',
				'border-radius'    => isset( $block_attributes['borderRadius'] ) ? $block_attributes['borderRadius'] . 'px' : '3px',
				'border-color'     => $block_attributes['borderColor'] ?? '#000000',
				'font-size'        => isset( $block_attributes['fontSize'] ) ? $block_attributes['fontSize'] . 'px' : '11px',
				'color'            => $block_attributes['fontColor'] ?? '#000000',
				'background-color' => $block_attributes['backgroundColor'] ?? '#000000',
			],
		];
	}

	/**
	 * Get hidden inputs for every $_GET param.
	 * This prevents the switcher form to remove them on submit.
	 *
	 * @return string|null
	 */
	private function get_get_params() {
		if ( empty( $_GET ) ) { // phpcs:disable WordPress.Security.NonceVerification
			return null;
		}

		$params = explode( '&', urldecode( http_build_query( $_GET ) ) );
		$return = '';
		foreach ( $params as $param ) {
			$name_value = explode( '=', $param );
			$name       = $name_value[0];
			$value      = $name_value[1];
			if ( 'currency' === $name ) {
				continue;
			}
			$return .= sprintf( '<input type="hidden" name="%s" value="%s" />', esc_attr( $name ), esc_attr( $value ) );
		}
		return $return;
	}
}
