<?php
/**
 * Class WCPay_Multi_Currency_PooCommercePointsAndRewards_Tests
 *
 * @package PooCommerce\Payments\Tests
 */

use WCPay\MultiCurrency\Compatibility\PooCommercePointsAndRewards;
use WCPay\MultiCurrency\MultiCurrency;
use WCPay\MultiCurrency\Utils;
use WCPay\MultiCurrency\Currency;

/**
 * WCPay\MultiCurrency\Compatibility\PooCommercePointsAndRewards unit tests.
 */
class WCPay_Multi_Currency_PooCommercePointsAndRewards_Tests extends WCPAY_UnitTestCase {

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
	 * WCPay\MultiCurrency\Compatibility\PooCommercePointsAndRewards instance.
	 *
	 * @var WCPay\MultiCurrency\Compatibility\PooCommercePointsAndRewards
	 */
	private $wc_points_rewards;

	/**
	 * WC_Payments_Localization_Service.
	 *
	 * @var WC_Payments_Localization_Service
	 */
	private $localization_service;

	/**
	 * Pre-test setup
	 */
	public function set_up() {
		parent::set_up();

		$this->mock_multi_currency  = $this->createMock( MultiCurrency::class );
		$this->mock_utils           = $this->createMock( Utils::class );
		$this->localization_service = new WC_Payments_Localization_Service();

		$this->wc_points_rewards = new PooCommercePointsAndRewards( $this->mock_multi_currency, $this->mock_utils );
	}

	/**
	 * @dataProvider filters_provider
	 */
	public function test_registers_poocommerce_filters_properly( $filter, $function_name ) {
		$priority = has_filter( $filter, [ $this->wc_points_rewards, $function_name ] );
		$this->assertGreaterThan(
			10,
			$priority,
			"Filter '$filter' was not registered with '$function_name' with a priority higher than the default."
		);
	}

	public function filters_provider() {
		return [
			[ 'option_wc_points_rewards_earn_points_ratio', 'convert_points_ratio' ],
			[ 'option_wc_points_rewards_redeem_points_ratio', 'convert_points_ratio' ],
		];
	}

	public function test_get_selected_currency_called_only_once() {
		$this->mock_multi_currency
			->expects( $this->once() )
			->method( 'get_selected_currency' );

		$this->wc_points_rewards->convert_points_ratio();
		$this->wc_points_rewards->convert_points_ratio();
	}


	public function test_convert_points_ratio_skip_on_select_and_default_currency_match() {
		$ratio = '';

		$this->mock_multi_currency
			->expects( $this->once() )
			->method( 'get_selected_currency' );

		$this->mock_utils
			->expects( $this->never() )
			->method( 'is_call_in_backtrace' );

		$this->assertEquals( $ratio, $this->wc_points_rewards->convert_points_ratio( $ratio ) );
	}

	public function test_convert_points_ratio_skip_on_discount_backtrace() {
		$ratio = '';

		$this->mock_multi_currency
			->expects( $this->once() )
			->method( 'get_selected_currency' )
			->willReturn( new Currency( $this->localization_service, 'EUR' ) );

		$this->mock_utils
			->expects( $this->once() )
			->method( 'is_call_in_backtrace' )
			->with( [ 'WC_Points_Rewards_Discount->get_discount_data' ] )
			->willReturn( true );

		$this->assertEquals( $ratio, $this->wc_points_rewards->convert_points_ratio( $ratio ) );
	}

	/**
	 * @dataProvider points_ratio_provider
	 */
	public function test_convert_points_ratio( $rate, $ratio, $converted_ratio ) {
		$this->mock_multi_currency
			->expects( $this->once() )
			->method( 'get_selected_currency' )
			->willReturn( new Currency( $this->localization_service, 'EUR', $rate ) );

		$this->mock_utils
			->expects( $this->once() )
			->method( 'is_call_in_backtrace' )
			->willReturn( false );

		$this->assertEquals( $converted_ratio, $this->wc_points_rewards->convert_points_ratio( $ratio ) );
	}

	public function points_ratio_provider() {
		return [
			[ 0, '', '0:0' ],
			[ 0, '1', '1:0' ],
			[ 0.5, '1:1', '1:0.5' ],
			[ 2, '1:1.23', '1:2.46' ],
			[ 20, '1:10', '1:200' ],
		];
	}
}
