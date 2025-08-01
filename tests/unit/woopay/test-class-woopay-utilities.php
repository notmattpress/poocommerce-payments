<?php
/**
 * Class WooPay_Utilities_Test
 *
 * @package PooCommerce\Payments\Tests
 */

use WCPay\WooPay\WooPay_Utilities;
use WCPay\WooPay\WooPay_Session;

/**
 * WooPay_Utilities unit tests.
 */
class WooPay_Utilities_Test extends WCPAY_UnitTestCase {
	public function set_up() {
		parent::set_up();
		$this->gateway_mock = $this->createMock( WC_Payment_Gateway_WCPay::class );

		// Mock the main class's cache service.
		$this->_cache     = WC_Payments::get_database_cache();
		$this->mock_cache = $this->createMock( WCPay\Database_Cache::class );
		WC_Payments::set_database_cache( $this->mock_cache );
	}

	public function tear_down() {
		// Restore the cache service in the main class.
		WC_Payments::set_database_cache( $this->_cache );

		parent::tear_down();
	}

	/**
	 * Data provider for test_should_enable_woopay.
	 *
	 * @return array
	 */
	public function should_enable_woopay_data_provider() {
		return [
			[ true, 'yes', true ],
			[ true, 'no', false ],
			[ false, 'yes', false ],
			[ false, 'no', false ],
		];
	}

	/**
	 * WooPay is available if feature flags are enabled.
	 *
	 * @dataProvider should_enable_woopay_data_provider
	 * @return void
	 */
	public function test_should_enable_woopay( $woopay_eligible, $gateway_woopay_enabled, $expected ) {
		$this->set_is_woopay_eligible( $woopay_eligible );

		$this->gateway_mock->expects( $this->once() )
			->method( 'get_option' )
			->with( 'platform_checkout', 'no' )
			->willReturn( $gateway_woopay_enabled );

		$woopay_utilities = new WooPay_Utilities();
		$actual           = $woopay_utilities->should_enable_woopay( $this->gateway_mock );
		$this->assertSame( $expected, $actual );
	}

	/**
	 * Data provider for test_is_country_available.
	 *
	 * @see test-data/ip_geolocation.json
	 *
	 * @return array
	 */
	public function is_country_available_data_provider() {
		return [
			[ '206.71.50.230', true ], // US.
			[ '187.34.8.193', false ], // BR.
		];
	}

	/**
	 * WooPay is available if feature flags are enabled.
	 *
	 * @dataProvider is_country_available_data_provider
	 * @return void
	 */
	public function test_is_country_available( $ip_address, $expected ) {
		$_SERVER['REMOTE_ADDR'] = $ip_address;

		WC_Payments::mode()->live();

		$woopay_utilities = new WooPay_Utilities();
		$actual           = $woopay_utilities->is_country_available();
		$this->assertSame( $expected, $actual );
	}

	public function test_is_country_available_in_test_mode_return_true() {
		WC_Payments::mode()->test();

		$woopay_utilities = new WooPay_Utilities();
		$actual           = $woopay_utilities->is_country_available();
		$this->assertSame( true, $actual );
	}

	/**
	 * WooPay button is available in cart and checkout while logged out.
	 *
	 * @return void
	 */
	public function test_should_enable_woopay_on_guest_checkout_logged_out() {
		add_filter( 'poocommerce_is_checkout', '__return_true' );
		wp_set_current_user( 0 );

		$woopay_utilities = new WooPay_Utilities();

		$this->assertTrue( $woopay_utilities->should_enable_woopay_on_guest_checkout() );
		$this->clean_up_should_enable_woopay_tests();
	}

	/**
	 * WooPay button is available in cart and checkout while logged in.
	 *
	 * @return void
	 */
	public function test_should_enable_woopay_on_guest_checkout_logged_in_on_cart_or_checkout() {
		add_filter( 'poocommerce_is_checkout', '__return_true' );
		wp_set_current_user( 1 );

		$woopay_utilities = new WooPay_Utilities();

		$this->assertTrue( $woopay_utilities->should_enable_woopay_on_guest_checkout() );
		$this->clean_up_should_enable_woopay_tests();
	}

	/**
	 * WooPay button is NOT available in cart and checkout while logged out and has subscription.
	 *
	 * @return void
	 */
	public function test_should_enable_woopay_on_guest_checkout_logged_out_has_subscription() {
		add_filter( 'poocommerce_is_checkout', '__return_true' );
		wp_set_current_user( 0 );
		WC_Subscriptions_Cart::set_cart_contains_subscription( true );

		$woopay_utilities = new WooPay_Utilities();

		$this->assertFalse( $woopay_utilities->should_enable_woopay_on_guest_checkout() );
		$this->clean_up_should_enable_woopay_tests();
	}

	/**
	 * WooPay button is available in cart and checkout while logged in and has subscription.
	 *
	 * @return void
	 */
	public function test_should_enable_woopay_on_guest_checkout_logged_in_has_subscription() {
		add_filter( 'poocommerce_is_checkout', '__return_true' );
		wp_set_current_user( 1 );
		WC_Subscriptions_Cart::set_cart_contains_subscription( true );

		$woopay_utilities = new WooPay_Utilities();

		$this->assertTrue( $woopay_utilities->should_enable_woopay_on_guest_checkout() );
		$this->clean_up_should_enable_woopay_tests();
	}

	/**
	 * WooPay button is NOT available in cart and checkout while logged out and guest checkout is disabled.
	 *
	 * @return void
	 */
	public function test_should_enable_woopay_on_guest_checkout_logged_out_guest_checkout_disabled() {
		add_filter( 'poocommerce_is_checkout', '__return_true' );
		wp_set_current_user( 0 );
		update_option( 'poocommerce_enable_guest_checkout', 'no' );

		$woopay_utilities = new WooPay_Utilities();

		$this->assertFalse( $woopay_utilities->should_enable_woopay_on_guest_checkout() );
		$this->clean_up_should_enable_woopay_tests();
	}

	/**
	 * WooPay user is saved to platform on classic checkout.
	 *
	 * @return void
	 */
	public function test_should_save_platform_customer_in_classic_checkout() {
		$woopay_utilities = new WooPay_Utilities();

		$_POST['save_user_in_woopay'] = 'true';
		$this->assertTrue( $woopay_utilities->should_save_platform_customer() );
		unset( $_POST['save_user_in_woopay'] );
	}

	/**
	 * WooPay should be enabled for guest checkout when user is logged in.
	 *
	 * @return void
	 */
	public function test_should_enable_woopay_on_guest_checkout_logged_in() {
		wp_set_current_user( 1 );

		$woopay_utilities = new WooPay_Utilities();

		$this->assertTrue( $woopay_utilities->should_enable_woopay_on_guest_checkout() );
	}

	/**
	 * WooPay should be enabled for guest checkout when user is not logged in and guest checkout is enabled.
	 *
	 * @return void
	 */
	public function test_should_enable_woopay_on_guest_checkout_logged_out_guest_enabled() {
		wp_set_current_user( 0 );
		add_filter(
			'pre_option_poocommerce_enable_guest_checkout',
			function () {
				return 'yes';
			}
		);

		$woopay_utilities = new WooPay_Utilities();

		$this->assertTrue( $woopay_utilities->should_enable_woopay_on_guest_checkout() );

		remove_all_filters( 'pre_option_poocommerce_enable_guest_checkout' );
	}

	/**
	 * WooPay should be disabled for guest checkout when user is not logged in and guest checkout is disabled.
	 *
	 * @return void
	 */
	public function test_should_enable_woopay_on_guest_checkout_logged_out_guest_disabled() {
		wp_set_current_user( 0 );
		add_filter(
			'pre_option_poocommerce_enable_guest_checkout',
			function () {
				return 'no';
			}
		);

		$woopay_utilities = new WooPay_Utilities();

		$this->assertFalse( $woopay_utilities->should_enable_woopay_on_guest_checkout() );

		remove_all_filters( 'pre_option_poocommerce_enable_guest_checkout' );
	}

	/**
	 * WooPay should be disabled for guest checkout when user is not logged in and cart contains subscription.
	 *
	 * @return void
	 */
	public function test_should_enable_woopay_on_guest_checkout_logged_out_has_subscription_with_enable_guest_checkout_enabled() {
		wp_set_current_user( 0 );
		add_filter(
			'pre_option_poocommerce_enable_guest_checkout',
			function () {
				return 'yes';
			}
		);

		WC_Subscriptions_Cart::set_cart_contains_subscription( true );

		$woopay_utilities = new WooPay_Utilities();

		$this->assertFalse( $woopay_utilities->should_enable_woopay_on_guest_checkout() );

		remove_all_filters( 'pre_option_poocommerce_enable_guest_checkout' );
	}

	private function clean_up_should_enable_woopay_tests() {
		remove_filter( 'poocommerce_is_checkout', '__return_true' );
		wp_set_current_user( 0 );
		WC_Subscriptions_Cart::set_cart_contains_subscription( false );
		update_option( 'poocommerce_enable_guest_checkout', 'yes' );
	}

	/**
	 * Cache account details.
	 *
	 * @param $account
	 */
	private function set_is_woopay_eligible( $is_woopay_eligible ) {
		$this->mock_cache->method( 'get' )->willReturn( [ 'platform_checkout_eligible' => $is_woopay_eligible ] );
	}
}
