<?php
/**
 * Class WCPay_Multi_Currency_PooCommercePreOrders_Tests
 *
 * @package PooCommerce\Payments\Tests
 */

use WCPay\MultiCurrency\Compatibility\PooCommercePreOrders;
use WCPay\MultiCurrency\MultiCurrency;
use WCPay\MultiCurrency\Utils;

/**
 * WCPay\MultiCurrency\Compatibility\PooCommercePreOrders unit tests.
 */
class WCPay_Multi_Currency_PooCommercePreOrders_Tests extends WCPAY_UnitTestCase {

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
	 * WCPay\MultiCurrency\Compatibility\PooCommercePreOrders instance.
	 *
	 * @var WCPay\MultiCurrency\Compatibility\PooCommercePreOrders
	 */
	private $poocommerce_pre_orders;

	/**
	 * Pre-test setup
	 */
	public function set_up() {
		parent::set_up();

		$this->mock_multi_currency    = $this->createMock( MultiCurrency::class );
		$this->mock_utils             = $this->createMock( Utils::class );
		$this->poocommerce_pre_orders = new PooCommercePreOrders( $this->mock_multi_currency, $this->mock_utils );
	}

	public function test_wc_pre_orders_fee() {
		$expected = [ 'amount' => 42.0 ];
		$args     = [ 'amount' => 21.0 ];
		$this->mock_multi_currency
			->expects( $this->once() )
			->method( 'get_price' )
			->with( $args['amount'] )
			->willReturn( 42.0 );
		$this->assertSame( $expected, $this->poocommerce_pre_orders->wc_pre_orders_fee( $args ) );
	}
}
