<?php
/**
 * Class WCPay_Multi_Currency_PooCommerceBookings_Tests
 *
 * @package PooCommerce\Payments\Tests
 */

use WCPay\MultiCurrency\Compatibility\PooCommerceBookings;
use WCPay\MultiCurrency\Currency;
use WCPay\MultiCurrency\FrontendCurrencies;
use WCPay\MultiCurrency\MultiCurrency;
use WCPay\MultiCurrency\Utils;

/**
 * WCPay\MultiCurrency\Compatibility\PooCommerceBookings unit tests.
 */
class WCPay_Multi_Currency_PooCommerceBookings_Tests extends WCPAY_UnitTestCase {

	/**
	 * Mock WCPay\MultiCurrency\MultiCurrency.
	 *
	 * @var WCPay\MultiCurrency\MultiCurrency|PHPUnit_Framework_MockObject_MockObject
	 */
	private $mock_multi_currency;

	/**
	 * Mock WCPay\MultiCurrency\Utils.
	 *
	 * @var WCPay\MultiCurrency\Utils|PHPUnit_Framework_MockObject_MockObject
	 */
	private $mock_utils;

	/**
	 * Mock WCPay\MultiCurrency\FrontendCurrencies.
	 *
	 * @var WCPay\MultiCurrency\FrontendCurrencies|PHPUnit_Framework_MockObject_MockObject
	 */
	private $mock_frontend_currencies;

	/**
	 * WCPay\MultiCurrency\Compatibility\PooCommerceBookings instance.
	 *
	 * @var WCPay\MultiCurrency\Compatibility\PooCommerceBookings
	 */
	private $poocommerce_bookings;

	/**
	 * WC_Payments_Localization_Service.
	 *
	 * @var WC_Payments_Localization_Service
	 */
	private $localization_service;

	/**
	 * Mock product.
	 *
	 * @var \WC_Product|PHPUnit_Framework_MockObject_MockObject
	 */
	private $mock_product;

	/**
	 * Pre-test setup
	 */
	public function set_up() {
		parent::set_up();

		$this->mock_multi_currency      = $this->createMock( MultiCurrency::class );
		$this->mock_utils               = $this->createMock( Utils::class );
		$this->mock_frontend_currencies = $this->createMock( FrontendCurrencies::class );
		$this->poocommerce_bookings     = new PooCommerceBookings( $this->mock_multi_currency, $this->mock_utils, $this->mock_frontend_currencies );
		$this->localization_service     = new WC_Payments_Localization_Service();

		$this->mock_product = $this->createMock( \WC_Product::class );
		$this->mock_product
			->method( 'get_id' )
			->willReturn( 42 );
		$this->mock_product
			->method( 'get_type' )
			->willReturn( 'booking' );
	}

	public function test_get_price_returns_empty_string() {
		$expected = '';
		$this->assertSame( $expected, $this->poocommerce_bookings->get_price( $expected ) );
	}

	public function test_get_price_returns_converted_price() {
		$expected = 42.0;
		$this->mock_multi_currency->method( 'get_price' )->willReturn( $expected );
		$this->assertSame( $expected, $this->poocommerce_bookings->get_price( 12 ) );
	}

	public function test_get_resource_prices_returns_non_array_directly() {
		$expected = 'Not an array.';
		$this->assertSame( $expected, $this->poocommerce_bookings->get_resource_prices( $expected ) );
	}

	public function test_get_resource_prices_returns_converted_prices() {
		$expected = [ 42.0, '' ];
		$prices   = [ 12, '' ];
		$this->mock_multi_currency
			->expects( $this->once() )
			->method( 'get_price' )
			->with( 12 )
			->willReturn( 42.0 );

		$this->assertSame( $expected, $this->poocommerce_bookings->get_resource_prices( $prices ) );
	}

	// If false is passed, it should automatically return false.
	public function test_should_convert_product_price_returns_false_if_false_passed() {
		$this->mock_utils->expects( $this->exactly( 0 ) )->method( 'is_call_in_backtrace' );
		$this->assertFalse( $this->poocommerce_bookings->should_convert_product_price( false, $this->mock_product ) );
	}

	// If the get_price_html call is found, it should return false.
	public function test_should_convert_product_price_returns_false_if_display_calls_found() {
		$expected_calls = [ 'WC_Product_Booking->get_price_html' ];
		$this->mock_utils
			->expects( $this->exactly( 1 ) )
			->method( 'is_call_in_backtrace' )
			->with( $expected_calls )
			->willReturn( true );
		$this->assertFalse( $this->poocommerce_bookings->should_convert_product_price( true, $this->mock_product ) );
	}

	// If no calls are found, it should return true.
	public function test_should_convert_product_price_returns_true_if_no_calls_found() {
		$expected_calls = [ 'WC_Product_Booking->get_price_html' ];
		$this->mock_utils
			->expects( $this->exactly( 1 ) )
			->method( 'is_call_in_backtrace' )
			->with( $expected_calls )
			->willReturn( false );
		$this->assertTrue( $this->poocommerce_bookings->should_convert_product_price( true, $this->mock_product ) );
	}

	public function test_filter_wc_price_args_returns_expected_results() {
		$defaults = [
			'currency'           => '',
			'decimal_separator'  => '',
			'thousand_separator' => '',
			'decimals'           => 0,
			'price_format'       => '',
		];
		$expected = [
			'currency'           => 'CAD',
			'decimal_separator'  => '.',
			'thousand_separator' => ',',
			'decimals'           => 2,
			'price_format'       => '%1$s%2$s',
		];

		$this->mock_multi_currency->method( 'get_selected_currency' )->willReturn( new Currency( $this->localization_service, $expected['currency'] ) );
		$this->mock_frontend_currencies->method( 'get_price_decimal_separator' )->willReturn( $expected['decimal_separator'] );
		$this->mock_frontend_currencies->method( 'get_price_thousand_separator' )->willReturn( $expected['thousand_separator'] );
		$this->mock_frontend_currencies->method( 'get_price_decimals' )->willReturn( $expected['decimals'] );
		$this->mock_frontend_currencies->method( 'get_poocommerce_price_format' )->willReturn( $expected['price_format'] );

		$this->assertSame( $expected, $this->poocommerce_bookings->filter_wc_price_args( $defaults ) );
	}
}
