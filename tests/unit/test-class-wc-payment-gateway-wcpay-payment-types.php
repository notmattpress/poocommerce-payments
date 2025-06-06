<?php
/**
 * Class WC_Payment_Gateway_WCPay_Test
 *
 * @package PooCommerce\Payments\Tests
 */

use PHPUnit\Framework\MockObject\MockObject;
use WCPay\Core\Server\Request\Create_And_Confirm_Intention;
use WCPay\Constants\Payment_Method;
use WCPay\Duplicate_Payment_Prevention_Service;
use WCPay\Duplicates_Detection_Service;
use WCPay\Session_Rate_Limiter;
use WCPay\Fraud_Prevention\Fraud_Prevention_Service;
use WCPay\Payment_Methods\CC_Payment_Method;

/**
 * WC_Payment_Gateway_WCPay unit tests.
 */
class WC_Payment_Gateway_WCPay_Payment_Types extends WCPAY_UnitTestCase {
	/**
	 * Original WCPay gateway.
	 *
	 * @var WC_Payment_Gateway_WCPay
	 */
	private $wcpay_gateway;

	/**
	 * System under test.
	 *
	 * @var WC_Payment_Gateway_WCPay
	 */
	private $mock_wcpay_gateway;

	/**
	 * Mock WC_Payments_Customer_Service.
	 *
	 * @var WC_Payments_Customer_Service|MockObject
	 */
	private $mock_customer_service;

	/**
	 * Mock WC_Payments_Token_Service.
	 *
	 * @var WC_Payments_Token_Service|MockObject
	 */
	private $mock_token_service;

	/**
	 * Mock WC_Payments_Order_Service.
	 *
	 * @var WC_Payments_Order_Service|MockObject
	 */
	private $mock_order_service;

	/**
	 * Mock WC_Payments_API_Client.
	 *
	 * @var WC_Payments_API_Client|MockObject
	 */
	private $mock_api_client;

	/**
	 * Mock WC_Payments_Action_Scheduler_Service.
	 *
	 * @var WC_Payments_Action_Scheduler_Service|MockObject
	 */
	private $mock_action_scheduler_service;

	/**
	 * Mock Session_Rate_Limiter.
	 *
	 * @var Session_Rate_Limiter|MockObject
	 */
	private $mock_rate_limiter;


	/**
	 * Mock WC_Payments_Account.
	 *
	 * @var WC_Payments_Account|MockObject
	 */
	private $mock_wcpay_account;

	/**
	 * Token to be used during the tests.
	 *
	 * @var WC_Payment_Token
	 */
	private $token;

	const USER_ID           = 1;
	const PAYMENT_METHOD_ID = 'pm_mock';

	/**
	 * Pre-test setup
	 */
	public function set_up() {
		parent::set_up();

		// Arrange: Mock WC_Payments_API_Client so we can configure the
		// return value of create_and_confirm_intention().
		// Note that we cannot use createStub here since it's not defined in PHPUnit 6.5.
		$this->mock_api_client = $this->getMockBuilder( 'WC_Payments_API_Client' )
			->disableOriginalConstructor()
			->setMethods( [ 'create_and_confirm_intention', 'get_payment_method', 'is_server_connected' ] )
			->getMock();

		// Arrange: Mock WC_Payments_Account instance to use later.
		$this->mock_wcpay_account = $this->createMock( WC_Payments_Account::class );

		// Arrange: Mock WC_Payments_Customer_Service so its methods aren't called directly.
		$this->mock_customer_service = $this->getMockBuilder( 'WC_Payments_Customer_Service' )
			->disableOriginalConstructor()
			->getMock();

		// Arrange: Mock WC_Payments_Customer_Service so its methods aren't called directly.
		$this->mock_token_service = $this->getMockBuilder( 'WC_Payments_Token_Service' )
			->disableOriginalConstructor()
			->getMock();

		// Arrange: Mock WC_Payments_Action_Scheduler_Service so its methods aren't called directly.
		$this->mock_action_scheduler_service = $this->getMockBuilder( 'WC_Payments_Action_Scheduler_Service' )
			->disableOriginalConstructor()
			->getMock();

		$this->token = WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID );
		$this->mock_token_service
			->expects( $this->any() )
			->method( 'add_payment_method_to_user' )
			->willReturn( $this->token );

		$this->mock_rate_limiter = $this->createMock( Session_Rate_Limiter::class );

		$this->mock_order_service = $this->createMock( WC_Payments_Order_Service::class );

		$mock_dpps           = $this->createMock( Duplicate_Payment_Prevention_Service::class );
		$mock_payment_method = $this->createMock( CC_Payment_Method::class );

		// Arrange: Mock WC_Payment_Gateway_WCPay so that some of its methods can be
		// mocked, and their return values can be used for testing.
		$this->mock_wcpay_gateway = $this->getMockBuilder( 'WC_Payment_Gateway_WCPay' )
			->setConstructorArgs(
				[
					$this->mock_api_client,
					$this->mock_wcpay_account,
					$this->mock_customer_service,
					$this->mock_token_service,
					$this->mock_action_scheduler_service,
					$mock_payment_method,
					[ 'card' => $mock_payment_method ],
					$this->mock_order_service,
					$mock_dpps,
					$this->createMock( WC_Payments_Localization_Service::class ),
					$this->createMock( WC_Payments_Fraud_Service::class ),
					$this->createMock( Duplicates_Detection_Service::class ),
					$this->mock_rate_limiter,
				]
			)
			->setMethods(
				[
					'get_return_url',
					'mark_payment_complete_for_order',
					'get_level3_data_from_order', // To avoid needing to mock the order items.
					'get_payment_method_ids_enabled_at_checkout',
					'get_metadata_from_order',
				]
			)
			->getMock();

		$this->mock_wcpay_gateway
			->expects( $this->any() )
			->method( 'get_payment_method_ids_enabled_at_checkout' )
			->willReturn( [ Payment_Method::CARD ] );

		$this->wcpay_gateway = WC_Payments::get_gateway();
		WC_Payments::set_gateway( $this->mock_wcpay_gateway );
		// Arrange: Define a $_POST array which includes the payment method,
		// so that get_payment_method_from_request() does not throw error.
		$_POST = [
			'wcpay-payment-method' => 'pm_mock',
			'payment_method'       => WC_Payment_Gateway_WCPay::GATEWAY_ID,
		];

		// Intent metadata is generated elsewhere, use empty arrays here.
		$this->mock_wcpay_gateway->expects( $this->any() )
			->method( 'get_metadata_from_order' )
			->willReturn( [] );
	}

	/**
	 * Cleanup after each test.
	 */
	public function tear_down() {
		parent::tear_down();
		WC_Payments::set_gateway( $this->wcpay_gateway );
	}

	/**
	 * Cleanup after all tests.
	 */
	public static function tear_down_after_class() {
		WC_Subscriptions::set_wcs_order_contains_subscription( null );
		WC_Subscriptions::set_wcs_get_subscriptions_for_order( null );
		parent::tear_down_after_class();
	}

	private function mock_wcs_order_contains_subscription( $value ) {
		WC_Subscriptions::set_wcs_order_contains_subscription(
			function ( $order ) use ( $value ) {
				return $value;
			}
		);
	}

	private function mock_wcs_get_subscriptions_for_order( $value ) {
		WC_Subscriptions::set_wcs_get_subscriptions_for_order(
			function ( $order ) use ( $value ) {
				return $value;
			}
		);
	}

	private function mock_wcs_get_subscriptions_for_renewal_order( $value ) {
		WC_Subscriptions::set_wcs_get_subscriptions_for_renewal_order(
			function ( $order ) use ( $value ) {
				return $value;
			}
		);
	}

	public function test_single_payment() {
		$order = WC_Helper_Order::create_order();
		$this->mock_wcs_order_contains_subscription( false );
		$this->mock_wcs_get_subscriptions_for_order( [] );

		$intent  = WC_Helper_Intention::create_intention();
		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'set_metadata' )
			->with( [] );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		$mock_fraud_prevention = $this->createMock( Fraud_Prevention_Service::class );
		Fraud_Prevention_Service::set_instance( $mock_fraud_prevention );
		$mock_fraud_prevention
			->expects( $this->once() )
			->method( 'is_enabled' )
			->willReturn( false );

		$this->mock_wcpay_gateway->process_payment( $order->get_id() );
	}

	public function test_initial_subscription_payment() {
		$order        = WC_Helper_Order::create_order();
		$subscription = new WC_Subscription();
		$subscription->set_parent( $order );
		$this->mock_wcs_order_contains_subscription( true );
		$this->mock_wcs_get_subscriptions_for_order( [ $subscription ] );

		$intent  = WC_Helper_Intention::create_intention();
		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'set_metadata' )
			->with( [] );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		$this->mock_wcpay_gateway->process_payment( $order->get_id() );
	}

	public function test_renewal_subscription_payment() {
		$order             = WC_Helper_Order::create_order();
		$mock_subscription = new WC_Subscription();
		$mock_subscription->set_parent( $order );

		$this->mock_wcs_order_contains_subscription( true );
		$this->mock_wcs_get_subscriptions_for_order( [ $mock_subscription ] );
		$this->mock_wcs_get_subscriptions_for_renewal_order( [] );

		$order->add_payment_token( $this->token );

		$intent  = WC_Helper_Intention::create_intention();
		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'set_metadata' )
			->with( [] );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		$this->mock_wcpay_gateway->scheduled_subscription_payment( 100, $order );
	}

	/**
	 * Test the scheduled_subscription_payment method is halted before payment when the renewal order is linked to a WCPay Subscription.
	 */
	public function test_scheduled_subscription_payment_skipped() {
		$order = WC_Helper_Order::create_order();
		$this->mock_wcs_order_contains_subscription( true );
		WC_Subscriptions::set_wcs_get_subscriptions_for_order(
			function ( $parent_order ) use ( $order ) {
				return $order;
			}
		);
		$order->add_payment_token( $this->token );

		// Mock a subscription that is a WCPay Subscription.
		$mock_subscription                 = new WC_Subscription();
		$mock_subscription->payment_method = 'poocommerce_payments';

		$mock_subscription->update_meta_data( '_wcpay_subscription_id', 'test_is_wcpay_subscription' );
		$order->update_meta_data( '_wcpay_subscription_id', 'test_is_wcpay_subscription' );

		WC_Subscriptions::set_wcs_get_subscriptions_for_renewal_order(
			function ( $id ) use ( $mock_subscription ) {
				return [ '1' => $mock_subscription ];
			}
		);

		// Make sure the payment is skipped for WCPay Subscriptions.
		$this->mock_api_client
			->expects( $this->never() )
			->method( 'create_and_confirm_intention' );

		$this->mock_wcpay_gateway->scheduled_subscription_payment( 100, $order );
	}
}
