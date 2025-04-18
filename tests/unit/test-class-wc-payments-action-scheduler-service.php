<?php
/**
 * Class WC_Payments_Action_Scheduler_Service_Test
 *
 * @package PooCommerce\Payments\Tests
 */

use PHPUnit\Framework\MockObject\MockObject;
use WCPay\Compatibility_Service;
use WCPay\Exceptions\API_Exception;

/**
 * WC_Payments_Action_Scheduler_Service unit tests.
 */
class WC_Payments_Action_Scheduler_Service_Test extends WCPAY_UnitTestCase {
	/**
	 * System under test.
	 *
	 * @var WC_Payments_Action_Scheduler_Service
	 */
	private $action_scheduler_service;

	/**
	 * Mock WC_Payments_API_Client.
	 *
	 * @var WC_Payments_API_Client|MockObject
	 */
	private $mock_api_client;

	/**
	 * Mock WC_Payments_Order_Service.
	 *
	 * @var WC_Payments_Order_Service|PHPUnit_Framework_MockObject_MockObject
	 */
	private $mock_order_service;

	/**
	 * Mock Compatibility_Service.
	 *
	 * @var Compatibility_Service|MockObject
	 */
	private $mock_compatibility_service;

	/**
	 * Pre-test setup
	 */
	public function set_up() {
		parent::set_up();

		$this->mock_api_client            = $this->createMock( WC_Payments_API_Client::class );
		$this->mock_order_service         = $this->createMock( WC_Payments_Order_Service::class );
		$this->mock_compatibility_service = $this->createMock( Compatibility_Service::class );

		$this->action_scheduler_service = new WC_Payments_Action_Scheduler_Service( $this->mock_api_client, $this->mock_order_service, $this->mock_compatibility_service );
	}

	public function test_update_compatibility_data_hook_registered() {
		$this->assertEquals( 10, has_action( Compatibility_Service::UPDATE_COMPATIBILITY_DATA, [ $this->mock_compatibility_service, 'update_compatibility_data_hook' ] ) );
	}

	public function test_track_new_order_action() {
		$order = WC_Helper_Order::create_order();
		$order->add_meta_data( '_payment_method_id', 'pm_131535132531', true );
		$order->add_meta_data( '_stripe_customer_id', 'cu_123', true );
		$order->add_meta_data( '_wcpay_mode', WC_Payments::mode()->is_test() ? 'test' : 'prod', true );
		$order->save_meta_data();

		$this->mock_order_service
			->method( 'get_payment_method_id_for_order' )
			->willReturn( 'pm_131535132531' );
		$this->mock_order_service
			->method( 'get_customer_id_for_order' )
			->willReturn( 'cu_123' );

		$this->mock_api_client->expects( $this->once() )
			->method( 'track_order' )
			->with( $this->get_order_data_mock( $order->get_id() ), false )
			->willReturn( [ 'result' => 'success' ] );

		$this->assertTrue( $this->action_scheduler_service->track_new_order_action( $order->get_id() ) );
	}

	public function test_track_new_order_action_with_no_payment_method() {
		$order = WC_Helper_Order::create_order();
		$order->delete_meta_data( '_payment_method_id' );
		$order->save_meta_data();
		$this->mock_order_service
			->method( 'get_payment_method_id_for_order' )
			->willReturn( '' );

		$this->assertFalse( $this->action_scheduler_service->track_new_order_action( $order ) );
	}

	public function test_track_new_order_action_with_invalid_order_id() {
		$this->assertFalse( $this->action_scheduler_service->track_new_order_action( -4 ) );
	}

	public function test_track_new_order_action_with_invalid_input() {
		$order = WC_Helper_Order::create_order();

		$this->assertFalse( $this->action_scheduler_service->track_new_order_action( $order->get_data() ) );
	}

	public function test_track_update_order_action() {
		$order = WC_Helper_Order::create_order();
		$order->add_meta_data( '_payment_method_id', 'pm_131535132531', true );
		$order->add_meta_data( '_stripe_customer_id', 'cu_123', true );
		$order->add_meta_data( '_wcpay_mode', WC_Payments::mode()->is_test() ? 'test' : 'prod', true );
		$order->save_meta_data();

		$this->mock_order_service
			->method( 'get_payment_method_id_for_order' )
			->willReturn( 'pm_131535132531' );
		$this->mock_order_service
			->method( 'get_customer_id_for_order' )
			->willReturn( 'cu_123' );

		$this->mock_api_client->expects( $this->once() )
			->method( 'track_order' )
			->with( $this->get_order_data_mock( $order->get_id() ), true )
			->willReturn( [ 'result' => 'success' ] );

		$this->assertTrue( $this->action_scheduler_service->track_update_order_action( $order->get_id() ) );
	}

	public function test_track_update_order_action_will_not_track_order_if_env_is_changed() {
		$order = WC_Helper_Order::create_order();
		$order->add_meta_data( '_payment_method_id', 'pm_13153513253', true );
		$order->add_meta_data( '_stripe_customer_id', 'cu_123', true );
		$order->add_meta_data( '_wcpay_mode', 'foo', true ); // Random value so we are sure that env will be changed.
		$order->save_meta_data();

		$this->mock_api_client->expects( $this->never() )
			->method( 'track_order' );

		$this->action_scheduler_service->track_update_order_action( $order->get_id() );
	}

	public function test_track_update_order_action_with_no_payment_method() {
		$order = WC_Helper_Order::create_order();
		$order->delete_meta_data( '_payment_method_id' );
		$order->save_meta_data();

		$this->assertFalse( $this->action_scheduler_service->track_update_order_action( $order ) );
	}

	public function test_track_update_order_action_with_invalid_order_id() {
		$this->assertFalse( $this->action_scheduler_service->track_update_order_action( -4 ) );
	}

	public function test_track_update_order_action_with_invalid_input() {
		$order = WC_Helper_Order::create_order();

		$this->assertFalse( $this->action_scheduler_service->track_update_order_action( $order->get_data() ) );
	}

	/**
	 * Get a mock of the order data expected to be passed into the `track_order` function.
	 *
	 * @return array
	 */
	private function get_order_data_mock( $order_id ) {
		$order = wc_get_order( $order_id );

		return array_merge(
			$order->get_data(),
			[
				'_payment_method_id'  => $order->get_meta( '_payment_method_id' ),
				'_stripe_customer_id' => $order->get_meta( '_stripe_customer_id' ),
				'_wcpay_mode'         => WC_Payments::mode()->is_test() ? 'test' : 'prod',
			]
		);
	}
}
