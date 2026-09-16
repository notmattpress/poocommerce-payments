<?php
/**
 * Class WCPay_Multi_Currency_PooCommerceFedEx_Tests
 *
 * @package PooCommerce\Payments\Tests
 */

use WCPay\MultiCurrency\Compatibility\PooCommerceFedEx;
use WCPay\MultiCurrency\MultiCurrency;
use WCPay\MultiCurrency\Utils;

/**
 * WCPay\MultiCurrency\Compatibility\PooCommerceFedEx unit tests.
 */
class WCPay_Multi_Currency_PooCommerceFedEx_Tests extends WCPAY_UnitTestCase {

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
	 * WCPay\MultiCurrency\Compatibility\PooCommerceFedEx instance.
	 *
	 * @var WCPay\MultiCurrency\Compatibility\PooCommerceFedEx
	 */
	private $poocommerce_fedex;

	/**
	 * Calls to check in the backtrace.
	 *
	 * @var array
	 */
	private $poocommerce_fedex_calls = [
		'WC_Shipping_Fedex->set_settings',
		'WC_Shipping_Fedex->per_item_shipping',
		'WC_Shipping_Fedex->box_shipping',
		'WC_Shipping_Fedex->get_fedex_api_request',
		'WC_Shipping_Fedex->get_fedex_requests',
		'WC_Shipping_Fedex->process_result',
	];

	/**
	 * Pre-test setup
	 */
	public function set_up() {
		parent::set_up();

		$this->mock_multi_currency = $this->createMock( MultiCurrency::class );
		$this->mock_utils          = $this->createMock( Utils::class );
		$this->poocommerce_fedex   = new PooCommerceFedEx( $this->mock_multi_currency, $this->mock_utils );
	}

	// If true is passed, it should automatically return true.
	public function test_should_return_store_currency_returns_true_if_true_passed() {
		$this->mock_utils->expects( $this->exactly( 0 ) )->method( 'is_call_in_backtrace' );
		$this->assertTrue( $this->poocommerce_fedex->should_return_store_currency( true ) );
	}

	// If the calls are found, it should return true.
	public function test_should_return_store_currency_returns_true_if_calls_found() {
		$this->mock_utils
			->expects( $this->once() )
			->method( 'is_call_in_backtrace' )
			->with( $this->poocommerce_fedex_calls )
			->willReturn( true );

		$this->assertTrue( $this->poocommerce_fedex->should_return_store_currency( false ) );
	}

	// If the calls are not found, it should return false.
	public function test_should_return_store_currency_returns_false_if_no_calls_found() {
		$this->mock_utils
			->expects( $this->once() )
			->method( 'is_call_in_backtrace' )
			->with( $this->poocommerce_fedex_calls )
			->willReturn( false );

		$this->assertFalse( $this->poocommerce_fedex->should_return_store_currency( false ) );
	}

	// If true is passed to should_convert_product_price and no calls are found, it should return true.
	public function test_should_convert_product_price_returns_true_if_true_passed_and_no_calls_found() {
		$this->mock_utils
			->expects( $this->once() )
			->method( 'is_call_in_backtrace' )
			->with( $this->poocommerce_fedex_calls )
			->willReturn( false );

		$this->assertTrue( $this->poocommerce_fedex->should_convert_product_price( true ) );
	}

	// If calls are found, should_convert_product_price should return false even if true was passed.
	public function test_should_convert_product_price_returns_false_if_calls_found() {
		$this->mock_utils
			->expects( $this->once() )
			->method( 'is_call_in_backtrace' )
			->with( $this->poocommerce_fedex_calls )
			->willReturn( true );

		$this->assertFalse( $this->poocommerce_fedex->should_convert_product_price( true ) );
	}
}
