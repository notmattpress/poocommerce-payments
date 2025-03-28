<?php
/**
 * Class WC_Payment_Gateway_WCPay_Test
 *
 * @package PooCommerce\Payments\Tests
 */

use PHPUnit\Framework\MockObject\MockObject;
use WCPay\Core\Server\Request\Create_And_Confirm_Intention;
use WCPay\Core\Server\Request\Create_And_Confirm_Setup_Intention;
use WCPay\Core\Server\Request\Get_Charge;
use WCPay\Constants\Order_Status;
use WCPay\Constants\Intent_Status;
use WCPay\Duplicate_Payment_Prevention_Service;
use WCPay\Exceptions\API_Exception;
use WCPay\Exceptions\Connection_Exception;
use WCPay\Session_Rate_Limiter;
use WCPay\Constants\Payment_Method;
use WCPay\Duplicates_Detection_Service;
use WCPay\Payment_Methods\CC_Payment_Method;

// Need to use WC_Mock_Data_Store.
require_once __DIR__ . '/helpers/class-wc-mock-wc-data-store.php';

/**
 * WC_Payment_Gateway_WCPay unit tests.
 */
class WC_Payment_Gateway_WCPay_Process_Payment_Test extends WCPAY_UnitTestCase {
	const CUSTOMER_ID = 'cus_mock';

	/**
	 * Original WCPay gateway.
	 *
	 * @var WC_Payment_Gateway_WCPay
	 */
	private $wcpay_gateway;

	/**
	 * System under test.
	 *
	 * @var WC_Payment_Gateway_WCPay|MockObject
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
	 * Mock WC_Payments_Order_Service.
	 *
	 * @var WC_Payments_Order_Service|MockObject
	 */
	private $mock_order_service;

	/**
	 * Mock WC_Payments_Account.
	 *
	 * @var WC_Payments_Account|MockObject
	 */
	private $mock_wcpay_account;

	/**
	 * Mock Duplicate_Payment_Prevention_Service
	 *
	 * @var Duplicate_Payment_Prevention_Service|MockObject
	 */
	private $mock_dpps;

	/**
	 * Mocked value of return_url.
	 * The value is used in the set up and tests, so it's set as a private
	 * variable for easy reference.
	 *
	 * @var string
	 */
	private $return_url = 'test_url';

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
			->setMethods( [ 'create_and_confirm_setup_intent', 'get_payment_method', 'is_server_connected', 'get_charge' ] )
			->getMock();

		// Arrange: Mock WC_Payments_Account instance to use later.
		$this->mock_wcpay_account = $this->createMock( WC_Payments_Account::class );
		$this->mock_wcpay_account
			->method( 'get_account_default_currency' )
			->willReturn( 'USD' );

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

		$this->mock_rate_limiter = $this->createMock( Session_Rate_Limiter::class );

		$this->mock_order_service = $this->createMock( WC_Payments_Order_Service::class );

		$this->mock_dpps     = $this->createMock( Duplicate_Payment_Prevention_Service::class );
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
					$this->mock_dpps,
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
					'should_use_stripe_platform_on_checkout_page',
					'get_payment_method_ids_enabled_at_checkout',
					'get_metadata_from_order',
				]
			)
			->getMock();

		// Arrange: Set the return value of get_return_url() so it can be used in a test later.
		$this->mock_wcpay_gateway
			->expects( $this->any() )
			->method( 'get_return_url' )
			->will(
				$this->returnValue( $this->return_url )
			);

			$this->mock_wcpay_gateway
				->expects( $this->any() )
				->method( 'get_payment_method_ids_enabled_at_checkout' )
				->willReturn( [ Payment_Method::CARD ] );

		// Plenty of methods require metadata, but it will be tested elsewhere.
		$this->mock_wcpay_gateway
			->expects( $this->any() )
			->method( 'get_metadata_from_order' )
			->willReturn( [] );

		$this->wcpay_gateway = WC_Payments::get_gateway();
		WC_Payments::set_gateway( $this->mock_wcpay_gateway );

		// Arrange: Define a $_POST array which includes the payment method,
		// so that get_payment_method_from_request() does not throw error.
		$_POST = [
			'wcpay-payment-method' => 'pm_mock',
			'payment_method'       => WC_Payment_Gateway_WCPay::GATEWAY_ID,
		];
	}

	/**
	 * Cleanup after each test.
	 *
	 * @return void
	 */
	public function tear_down() {
		WC_Payments::set_gateway( $this->wcpay_gateway );
		WC()->session->set( 'wc_notices', [] );

		parent::tear_down();
	}

	/**
	 * Test processing payment with the status 'succeeded'.
	 */
	public function test_intent_status_success() {
		// Arrange: Reusable data.
		$intent_id   = 'pi_mock';
		$charge_id   = 'ch_mock';
		$customer_id = 'cus_mock';
		$status      = Intent_Status::SUCCEEDED;
		$order_id    = 123;
		$total       = 12.23;

		// Arrange: Create an order to test with.
		$mock_order = $this->createMock( 'WC_Order' );

		// Arrange: Set a good return value for the order's data store.
		$mock_order
			->method( 'get_data_store' )
			->willReturn( new \WC_Mock_WC_Data_Store() );

		// Arrange: Set a good return value for order ID.
		$mock_order
			->method( 'get_id' )
			->willReturn( $order_id );

		// Arrange: Set a good return value for order total.
		$mock_order
			->method( 'get_total' )
			->willReturn( $total );

		// Arrange: Set a WP_User object as a return value of order's get_user.
		$mock_order
			->method( 'get_user' )
			->willReturn( wp_get_current_user() );

		// Arrange: Set a good return value for customer ID.
		$this->mock_customer_service->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->willReturn( $customer_id );

		// Arrange: Create a mock cart.
		$mock_cart = $this->createMock( 'WC_Cart' );

		// Arrange: Return a successful response from create_and_confirm_intention().
		$intent = WC_Helper_Intention::create_intention();

		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		// Assert: Order has correct charge id meta data.
		// Assert: Order has correct intention status meta data.
		// Assert: Order has correct intent ID.
		// This test is a little brittle because we don't really care about the order
		// in which the different calls are made, but it's not possible to write it
		// otherwise for now.
		// There's an issue open for that here:
		// https://github.com/sebastianbergmann/phpunit/issues/4026.
		$mock_order
			->expects( $this->exactly( 2 ) )
			->method( 'update_meta_data' )
			->withConsecutive(
				[ '_wcpay_mode', WC_Payments::mode()->is_test() ? 'test' : 'prod' ],
				[ '_wcpay_multi_currency_stripe_exchange_rate', 0.86 ]
			);

		// Assert: The Order_Service is called correctly.

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'set_customer_id_for_order' )
			->with( $mock_order, $customer_id );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'set_payment_method_id_for_order' )
			->with( $mock_order, 'pm_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'attach_intent_info_to_order' )
			->with( $mock_order, $intent );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'update_order_status_from_intent' )
			->with( $mock_order, $intent );

		// Assert: empty_cart() was called.
		$mock_cart
			->expects( $this->once() )
			->method( 'empty_cart' );
		$charge_request = $this->mock_wcpay_request( Get_Charge::class, 1, 'ch_mock' );

		$charge_request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( [ 'balance_transaction' => [ 'exchange_rate' => 0.86 ] ] );

		// Act: process a successful payment.
		$payment_information = WCPay\Payment_Information::from_payment_request( $_POST, $mock_order, null, null, null, 'card' ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$result              = $this->mock_wcpay_gateway->process_payment_for_order( $mock_cart, $payment_information );

		// Assert: Returning correct array.
		$this->assertEquals( 'success', $result['result'] );
		$this->assertEquals( $this->return_url, $result['redirect'] );
	}

	/**
	 * Test processing payment with the status 'succeeded'.
	 */
	public function test_intent_status_success_logged_out_user() {
		// Arrange: Reusable data.
		$order_id = 123;
		$total    = 12.23;

		// Arrange: Create an order to test with.
		$mock_order = $this->createMock( 'WC_Order' );

		// Arrange: Set a good return value for the order's data store.
		$mock_order
			->method( 'get_data_store' )
			->willReturn( new \WC_Mock_WC_Data_Store() );

		// Arrange: Set a good return value for order ID.
		$mock_order
			->method( 'get_id' )
			->willReturn( $order_id );

		// Arrange: Set a good return value for order total.
		$mock_order
			->method( 'get_total' )
			->willReturn( $total );

		// Arrange: Set false as a return value of order's get_user.
		$mock_order
			->method( 'get_user' )
			->willReturn( false );

		// Arrange: Create a mock cart.
		$mock_cart = $this->createMock( 'WC_Cart' );

		// Arrange: Return a successful response from create_and_confirm_intention().
		$intent = WC_Helper_Intention::create_intention();

		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		// Assert: customer_service should still be called with a WP_User object (representing a logged-out user).
		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'create_customer_for_user' )
			->with( $this->isInstanceOf( WP_User::class ) );

		$charge_request = $this->mock_wcpay_request( Get_Charge::class, 1, 'ch_mock' );

		$charge_request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( [ 'balance_transaction' => [ 'exchange_rate' => 0.86 ] ] );

		// Act: process a successful payment.
		$payment_information = WCPay\Payment_Information::from_payment_request( $_POST, $mock_order, null, null, null, 'card' ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$result              = $this->mock_wcpay_gateway->process_payment_for_order( $mock_cart, $payment_information );

		// Assert: Returning correct array.
		$this->assertEquals( 'success', $result['result'] );
		$this->assertEquals( $this->return_url, $result['redirect'] );
	}

	/**
	 * Test processing payment with the status "requires_capture".
	 */
	public function test_intent_status_requires_capture() {
		// Arrange: Reusable data.
		$intent_id   = 'pi_mock';
		$charge_id   = 'ch_mock';
		$customer_id = 'cus_mock';
		$status      = Intent_Status::REQUIRES_CAPTURE;
		$order_id    = 123;
		$total       = 12.23;

		// Arrange: Create an order to test with.
		$mock_order = $this->createMock( 'WC_Order' );

		// Arrange: Set a good return value for order ID.
		$mock_order
			->method( 'get_id' )
			->willReturn( $order_id );

		// Arrange: Set a good return value for order total.
		$mock_order
			->method( 'get_total' )
			->willReturn( $total );

		// Arrange: Set a WP_User object as a return value of order's get_user.
		$mock_order
			->method( 'get_user' )
			->willReturn( wp_get_current_user() );

		// Arrange: Set a good return value for customer ID.
		$this->mock_customer_service->expects( $this->once() )
			->method( 'create_customer_for_user' )
			->willReturn( $customer_id );

		// Arrange: Create a mock cart.
		$mock_cart = $this->createMock( 'WC_Cart' );

		// Arrange: Return a 'requires_capture' response from create_and_confirm_intention().
		$intent = WC_Helper_Intention::create_intention( [ 'status' => $status ] );

		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		// Assert: Order has correct charge id meta data.
		// Assert: Order has correct intention status meta data.
		// Assert: Order has correct intent ID.
		// This test is a little brittle because we don't really care about the order
		// in which the different calls are made, but it's not possible to write it
		// otherwise for now.
		// There's an issue open for that here:
		// https://github.com/sebastianbergmann/phpunit/issues/4026.
		$mock_order
			->expects( $this->exactly( 2 ) )
			->method( 'update_meta_data' )
			->withConsecutive(
				[ '_wcpay_mode', WC_Payments::mode()->is_test() ? 'test' : 'prod' ],
				[ '_wcpay_multi_currency_stripe_exchange_rate', 0.86 ]
			);

		// Assert: The Order_Service is called correctly.
		$this->mock_order_service
			->expects( $this->once() )
			->method( 'set_customer_id_for_order' )
			->with( $mock_order, $customer_id );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'set_payment_method_id_for_order' )
			->with( $mock_order, 'pm_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'attach_intent_info_to_order' )
			->with( $mock_order, $intent );

		// Assert: The Order_Service is called correctly.
		$this->mock_order_service
			->expects( $this->once() )
			->method( 'update_order_status_from_intent' )
			->with( $mock_order, $intent );

		// Assert: empty_cart() was called.
		$mock_cart
			->expects( $this->once() )
			->method( 'empty_cart' );

		$charge_request = $this->mock_wcpay_request( Get_Charge::class, 1, 'ch_mock' );

		$charge_request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( [ 'balance_transaction' => [ 'exchange_rate' => 0.86 ] ] );

		// Act: process payment.
		$payment_information = WCPay\Payment_Information::from_payment_request( $_POST, $mock_order, WCPay\Constants\Payment_Type::SINGLE(), WCPay\Constants\Payment_Initiated_By::CUSTOMER(), WCPay\Constants\Payment_Capture_Type::MANUAL(), 'card' ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$result              = $this->mock_wcpay_gateway->process_payment_for_order( $mock_cart, $payment_information );

		// Assert: Returning correct array.
		$this->assertEquals( 'success', $result['result'] );
		$this->assertEquals( $this->return_url, $result['redirect'] );
	}

	public function test_error_notice_added_on_failure() {
		// Arrange: Reusable data.
		$error_message = 'Error: No such customer: 123.';

		// Arrange: Create an order to test with.
		$order = WC_Helper_Order::create_order();
		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->willReturn( 'cus_mock' );
		$payment_information = WCPay\Payment_Information::from_payment_request( $_POST, $order, WCPay\Constants\Payment_Type::SINGLE(), WCPay\Constants\Payment_Initiated_By::CUSTOMER(), WCPay\Constants\Payment_Capture_Type::AUTOMATIC(), 'card' ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

		// Arrange: Throw an exception in create_and_confirm_intention.
		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );
		$request->expects( $this->once() )
			->method( 'format_response' )
			->will(
				$this->throwException(
					new API_Exception(
						$error_message,
						'resource_missing',
						400
					)
				)
			);

		// Act: process payment.
		$result = $this->mock_wcpay_gateway->process_payment( $order->get_id(), false );

		$this->assertEquals( 'fail', $result['result'] );
		$error_notices = WC()->session->get( 'wc_notices' );
		$this->assertNotEmpty( $error_notices );
		$this->assertEquals( $error_message, $error_notices['error'][0]['notice'] );

		$result_order = wc_get_order( $order->get_id() );

		// Assert: Order status was updated.
		$this->assertEquals( Order_Status::FAILED, $result_order->get_status() );

		// Assert: Order transaction ID was not set.
		$this->assertEquals( '', $result_order->get_transaction_id() );

		// Assert: Order meta was not updated with charge ID, intention status, or intent ID.
		$this->assertEquals( '', $result_order->get_meta( '_intent_id' ) );
		$this->assertEquals( '', $result_order->get_meta( '_charge_id' ) );
		$this->assertEquals( '', $result_order->get_meta( '_intention_status' ) );

		// Assert: No order note was added, besides the status change and failed transaction details.
		$notes = wc_get_order_notes( [ 'order_id' => $result_order->get_id() ] );
		$this->assertCount( 2, $notes );
		$this->assertEquals( 'Order status changed from Pending payment to Failed.', $notes[1]->content );
		$this->assertStringContainsString( 'A payment of &#36;50.00 failed to complete with the following message: Error: No such customer: 123.', strip_tags( $notes[0]->content, '' ) );
	}

	public function test_failure_result_returned_if_phone_number_is_invalid() {
		$order = WC_Helper_Order::create_order();
		$order->set_billing_phone( '+1123456789123456789123' );
		$order->save();
		$result = $this->mock_wcpay_gateway->process_payment( $order->get_id() );
		$this->assertEquals( 'fail', $result['result'] );
	}

	public function test_connection_exception_thrown() {
		// Arrange: Reusable data.
		$error_message = 'Test error.';
		$error_notice  = 'There was an error while processing this request. If you continue to see this notice, please contact the admin.';

		// Arrange: Create an order to test with.
		$order = WC_Helper_Order::create_order();

		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->willReturn( 'cus_mock' );

		// Arrange: Throw an exception in create_and_confirm_intention.
		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->will(
				$this->throwException(
					new Connection_Exception(
						$error_message,
						'wcpay_http_request_failed',
						400
					)
				)
			);

		// Act: process payment.
		$result = $this->mock_wcpay_gateway->process_payment( $order->get_id(), false );

		$this->assertEquals( 'fail', $result['result'] );
		$error_notices = WC()->session->get( 'wc_notices' );
		$this->assertNotEmpty( $error_notices );
		$this->assertEquals( $error_notice, $error_notices['error'][0]['notice'] );

		$result_order = wc_get_order( $order->get_id() );

		// Assert: Order status was updated.
		$this->assertEquals( Order_Status::FAILED, $result_order->get_status() );

		// Assert: No order note was added, besides the status change and failed transaction details.
		$notes = wc_get_order_notes( [ 'order_id' => $result_order->get_id() ] );
		$this->assertCount( 2, $notes );
		$this->assertEquals( 'Order status changed from Pending payment to Failed.', $notes[1]->content );
		$this->assertStringContainsString( 'A payment of &#36;50.00 failed to complete with the following message: Test error.', strip_tags( $notes[0]->content, '' ) );
	}

	/**
	 * Tests that the rawte limiter is bumped for certain error codes
	 *
	 * @dataProvider rate_limiter_error_code_provider
	 */
	public function test_failed_transaction_rate_limiter_bumped( $error_message, $error_code ) {
		$order = WC_Helper_Order::create_order();

		$this->mock_rate_limiter
			->expects( $this->once() )
			->method( 'bump' );

		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->willReturn( 'cus_mock' );

		// Arrange: Throw an exception in create_and_confirm_intention.
		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->will(
				$this->throwException(
					new API_Exception(
						$error_message,
						$error_code,
						400,
						'card_error'
					)
				)
			);

		// Act: process payment.
		$this->mock_wcpay_gateway->process_payment( $order->get_id() );

		$error_notices = WC()->session->get( 'wc_notices' );
		$this->assertNotEmpty( $error_notices );
		$this->assertEquals( $error_message, $error_notices['error'][0]['notice'] );
	}

	public function rate_limiter_error_code_provider() {
		return [
			'Card declined'    => [ 'Your card was declined.', 'card_declined' ],
			'Incorrect number' => [ 'Your card number is incorrect.', 'incorrect_number' ],
			'Incorrect CVC'    => [ 'Your card security code is incorrect.', 'incorrect_cvc' ],
		];
	}

	public function test_failed_transaction_rate_limiter_is_limited() {
		// Arrange: Create an order to test with.
		$order = WC_Helper_Order::create_order();

		// Arrange: Rate limiter is limited.
		$this->mock_rate_limiter
			->expects( $this->once() )
			->method( 'is_limited' )
			->willReturn( true );

		// Act: process payment.
		$this->mock_wcpay_gateway->process_payment( $order->get_id(), false );
		$result_order = wc_get_order( $order->get_id() );

		// Assert: Order status was updated.
		$this->assertEquals( Order_Status::FAILED, $result_order->get_status() );

		// Assert: No order note was added, besides the status change and failed transaction details.
		$notes = wc_get_order_notes( [ 'order_id' => $result_order->get_id() ] );
		$this->assertCount( 2, $notes );
		$this->assertEquals( 'Order status changed from Pending payment to Failed.', $notes[1]->content );
		$this->assertStringContainsString( 'A payment of &#36;50.00 failed to complete because of too many failed transactions. A rate limiter was enabled for the user to prevent more attempts temporarily.', strip_tags( $notes[0]->content, '' ) );
	}

	/**
	 * Tests that a draft order is updated to "pending" when the $_POST 'is-woopay-preflight-check' is present.
	 */
	public function test_draft_order_is_set_to_pending_for_woopay_preflight_check_request() {
		$_POST['is-woopay-preflight-check'] = true;

		// Arrange: Create an order to test with.
		$order_data = [
			'status' => 'draft',
			'total'  => '100',
		];

		$order = wc_create_order( $order_data );

		// Act: process payment.
		$result = $this->mock_wcpay_gateway->process_payment( $order->get_id(), false );

		// Assert: Order status was updated.
		$this->assertEquals( 'pending', $order->get_status() );
	}

	/**
	 * Tests that poocommerce_order_status_pending action is not called when the $_POST 'is-woopay-preflight-check' is present.
	 */
	public function test_woopay_preflight_request_does_not_call_poocommerce_order_status_pending() {
		// Arrange: Add poocommerce_order_status_pending action to check if it's called.
		$results = [
			'has_called_poocommerce_order_status_pending' => false,
		];
		add_action(
			'poocommerce_order_status_pending',
			function () use ( &$results ) {
				$results['has_called_poocommerce_order_status_pending'] = true;
			}
		);

		// Arrange: Add filter to change default order status to 'wc-checkout-draft'.
		// Needed to avoid a default order status of 'pending'.
		add_filter(
			'poocommerce_default_order_status',
			function () {
				return 'wc-checkout-draft';
			}
		);

		// Arrange: Create a request to simulate a woopay preflight request.
		$_POST['is-woopay-preflight-check'] = true;
		$request                            = new WP_REST_Request( 'POST', '' );
		$request->set_body_params(
			[
				'payment_data' => [
					[
						'key'   => 'is-woopay-preflight-check',
						'value' => true,
					],
				],
			]
		);
		apply_filters( 'rest_request_before_callbacks', [], [], $request );

		// Arrange: Create an order to test with.
		$order_data = [
			'status' => 'wc-checkout-draft',
			'total'  => '100',
		];
		$order      = wc_create_order( $order_data );

		// Act: process payment.
		$this->mock_wcpay_gateway->process_payment( $order->get_id() );

		// Assert: poocommerce_order_status_pending was not called.
		$this->assertFalse( $results['has_called_poocommerce_order_status_pending'] );

		remove_all_actions( 'poocommerce_order_status_pending' );
		remove_all_filters( 'poocommerce_default_order_status' );
	}

	/**
	 * Tests that a success response and no redirect is returned when the $_POST 'is-woopay-preflight-check' is present.
	 */
	public function test_successful_result_no_redirect_for_woopay_preflight_check_request() {
		$_POST['is-woopay-preflight-check'] = true;

		// Arrange: Create an order to test with.
		$order_data = [
			'status' => 'draft',
			'total'  => '100',
		];

		$order = wc_create_order( $order_data );

		// Act: process payment.
		$response = $this->mock_wcpay_gateway->process_payment( $order->get_id(), false );

		// Assert: No payment was processed.
		$this->assertEquals( $response['result'], 'success' );
		$this->assertEmpty( $response['redirect'] );
	}

	public function test_bad_request_exception_thrown() {
		$error_message = 'Test error.';
		$error_notice  = 'We\'re not able to process this request. Please refresh the page and try again.';

		$order = WC_Helper_Order::create_order();
		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->willReturn( 'cus_mock' );

		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->will(
				$this->throwException(
					new API_Exception(
						$error_message,
						'wcpay_bad_request',
						400
					)
				)
			);

		// Act: process payment.
		$this->mock_wcpay_gateway->process_payment( $order->get_id(), false );
		$result_order = wc_get_order( $order->get_id() );

		// Assert: Order status was updated.
		$this->assertEquals( Order_Status::FAILED, $result_order->get_status() );

		// Assert: No order note was added, besides the status change and failed transaction details.
		$notes = wc_get_order_notes( [ 'order_id' => $result_order->get_id() ] );
		$this->assertCount( 2, $notes );
		$this->assertEquals( 'Order status changed from Pending payment to Failed.', $notes[1]->content );
		$this->assertStringContainsString( "A payment of &#36;50.00 failed to complete with the following message: $error_message", strip_tags( $notes[0]->content, '' ) );

		// Assert: A PooCommerce notice was added.
		$error_notices = WC()->session->get( 'wc_notices' );
		$this->assertNotEmpty( $error_notices );
		$this->assertEquals( $error_notice, $error_notices['error'][0]['notice'] );
	}

	public function test_incorrect_zip_exception_thrown() {
		$error_message = 'Test error.';
		$error_note    = 'We couldn’t verify the postal code in the billing address. If the issue persists, suggest the customer to reach out to the card issuing bank.';

		$order = WC_Helper_Order::create_order();

		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->willReturn( 'cus_mock' );

		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->will(
				$this->throwException(
					new API_Exception(
						$error_message,
						'incorrect_zip',
						400,
						'card_error'
					)
				)
			);

		// Act: process payment.
		$this->mock_wcpay_gateway->process_payment( $order->get_id(), false );
		$result_order = wc_get_order( $order->get_id() );

		// Assert: No order note was added, besides the status change and failed transaction details.
		$notes = wc_get_order_notes( [ 'order_id' => $result_order->get_id() ] );

		// Assert: Correct order notes are added.
		$this->assertCount( 2, $notes );
		$this->assertEquals( 'Order status changed from Pending payment to Failed.', $notes[1]->content );
		$this->assertStringContainsString( "A payment of &#36;50.00 failed. $error_note", strip_tags( $notes[0]->content, '' ) );
	}

	/**
	 * Test processing payment with the status "requires_action".
	 * This is the status returned when the payment requires
	 * further authentication with 3DS.
	 */
	public function test_intent_status_requires_action() {
		// Arrange: Reusable data.
		$intent_id   = 'pi_mock';
		$charge_id   = 'ch_mock';
		$customer_id = 'cus_mock';
		$status      = Intent_Status::REQUIRES_ACTION;
		$secret      = 'cs_mock';
		$order_id    = 123;
		$total       = 12.23;

		// Arrange: Create an order to test with.
		$mock_order = $this->createMock( 'WC_Order' );

		// Arrange: Set a good return value for order ID.
		$mock_order
			->method( 'get_id' )
			->willReturn( $order_id );

		// Arrange: Set a good return value for order total.
		$mock_order
			->method( 'get_total' )
			->willReturn( $total );

		// Arrange: Set a WP_User object as a return value of order's get_user.
		$mock_order
			->method( 'get_user' )
			->willReturn( wp_get_current_user() );

		// Arrange: Set a good return value for customer ID.
		$this->mock_customer_service->expects( $this->once() )
			->method( 'create_customer_for_user' )
			->willReturn( $customer_id );

		// Arrange: Create a mock cart.
		$mock_cart = $this->createMock( 'WC_Cart' );

		// Arrange: Return a 'requires_action' response from create_and_confirm_intention().
		$intent = WC_Helper_Intention::create_intention( [ 'status' => $status ] );

		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		// Assert: Order has correct charge id meta data.
		// Assert: Order has correct intention status meta data.
		// Assert: Order has correct intent ID.
		// This test is a little brittle because we don't really care about the order
		// in which the different calls are made, but it's not possible to write it
		// otherwise for now.
		// There's an issue open for that here:
		// https://github.com/sebastianbergmann/phpunit/issues/4026.
		$mock_order
			->expects( $this->exactly( 2 ) )
			->method( 'update_meta_data' )
			->withConsecutive(
				[ '_wcpay_mode', WC_Payments::mode()->is_test() ? 'test' : 'prod' ],
				[ '_wcpay_multi_currency_stripe_exchange_rate', 0.86 ]
			);

		// Assert: The Order_Service is called correctly.
		$this->mock_order_service
			->expects( $this->once() )
			->method( 'set_customer_id_for_order' )
			->with( $mock_order, $customer_id );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'set_payment_method_id_for_order' )
			->with( $mock_order, 'pm_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'attach_intent_info_to_order' )
			->with( $mock_order, $intent );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'update_order_status_from_intent' )
			->with( $mock_order, $intent );

		// Assert: empty_cart() was not called.
		$mock_cart
			->expects( $this->never() )
			->method( 'empty_cart' );

		$charge_request = $this->mock_wcpay_request( Get_Charge::class, 1, 'ch_mock' );

		$charge_request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( [ 'balance_transaction' => [ 'exchange_rate' => 0.86 ] ] );

		// Act: process payment.
		$payment_information = WCPay\Payment_Information::from_payment_request( $_POST, $mock_order, null, null, null, 'card' ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$result              = $this->mock_wcpay_gateway->process_payment_for_order( $mock_cart, $payment_information );

		// Assert: Returning correct array.
		$this->assertEquals( 'success', $result['result'] );
		$this->assertEquals(
			'#wcpay-confirm-pi:' . $order_id . ':' . $secret . ':' . wp_create_nonce( 'wcpay_update_order_status_nonce' ),
			$result['redirect']
		);
	}

	/**
	 * Test processing offline payment with the status "requires_action".
	 * This is the status returned when the shopper needs to complete
	 * the payment offsite.
	 */
	public function test_intent_status_requires_action_offine_payment() {
		// Arrange: Reusable data.
		$intent_id   = 'pi_mock';
		$charge_id   = 'ch_mock';
		$customer_id = 'cus_mock';
		$status      = Intent_Status::REQUIRES_ACTION;
		$secret      = 'cs_mock';
		$order_id    = 123;
		$total       = 12.23;

		// Arrange: Create an order to test with.
		$mock_order = $this->createMock( 'WC_Order' );

		// Arrange: Set a good return value for order ID.
		$mock_order
			->method( 'get_id' )
			->willReturn( $order_id );

		// Arrange: Set a good return value for order total.
		$mock_order
			->method( 'get_total' )
			->willReturn( $total );

		// Arrange: Set a WP_User object as a return value of order's get_user.
		$mock_order
			->method( 'get_user' )
			->willReturn( wp_get_current_user() );

		// Arrange: Set a good return value for customer ID.
		$this->mock_customer_service->expects( $this->once() )
			->method( 'create_customer_for_user' )
			->willReturn( $customer_id );

		// Arrange: Create a mock cart.
		$mock_cart = $this->createMock( 'WC_Cart' );

		// Arrange: Return a 'requires_action' response from create_and_confirm_intention().
		$intent = WC_Helper_Intention::create_intention( [ 'status' => $status ] );

		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		// Assert: Order has correct charge id meta data.
		// Assert: Order has correct intention status meta data.
		// Assert: Order has correct intent ID.
		// This test is a little brittle because we don't really care about the order
		// in which the different calls are made, but it's not possible to write it
		// otherwise for now.
		// There's an issue open for that here:
		// https://github.com/sebastianbergmann/phpunit/issues/4026.
		$mock_order
			->expects( $this->exactly( 2 ) )
			->method( 'update_meta_data' )
			->withConsecutive(
				[ '_wcpay_mode', WC_Payments::mode()->is_test() ? 'test' : 'prod' ],
				[ '_wcpay_multi_currency_stripe_exchange_rate', 0.86 ]
			);

		// Assert: The Order_Service is called correctly.
		$this->mock_order_service
			->expects( $this->once() )
			->method( 'set_customer_id_for_order' )
			->with( $mock_order, $customer_id );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'set_payment_method_id_for_order' )
			->with( $mock_order, 'pm_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'attach_intent_info_to_order' )
			->with( $mock_order, $intent );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'update_order_status_from_intent' )
			->with( $mock_order, $intent );

		// Assert: empty_cart() was called (just like status success).
		$mock_cart
			->expects( $this->once() )
			->method( 'empty_cart' );

		$charge_request = $this->mock_wcpay_request( Get_Charge::class, 1, 'ch_mock' );

		$charge_request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( [ 'balance_transaction' => [ 'exchange_rate' => 0.86 ] ] );

		// Act: process payment.
		$payment_information_mock = $this->getMockBuilder( 'WCPay\Payment_Information' )
			->setConstructorArgs( [ 'pm_mock', $mock_order, null, null, null, null, null, '', 'card' ] )
			->setMethods( [ 'is_offline_payment_method' ] )
			->getMock();
		$payment_information_mock->method( 'is_offline_payment_method' )
			->willReturn( true );

		$result = $this->mock_wcpay_gateway->process_payment_for_order( $mock_cart, $payment_information_mock );

		// Assert: Returning correct array.
		$this->assertEquals( 'success', $result['result'] );
		$this->assertEquals( $this->return_url, $result['redirect'] );
	}

	/**
	 * Test processing free order with the status "requires_action".
	 * This is the status returned when the saved card setup requires
	 * further authentication with 3DS.
	 */
	public function test_setup_intent_status_requires_action() {
		// Arrange: Reusable data.
		$intent_id   = 'pi_mock';
		$customer_id = 'cus_mock';
		$status      = Intent_Status::REQUIRES_ACTION;
		$secret      = 'cs_mock';
		$order_id    = 123;
		$total       = 0;
		$currency    = 'USD';

		// Arrange: Create an order to test with.
		$mock_order = $this->createMock( 'WC_Order' );

		// Arrange: Set a good return value for order ID.
		$mock_order
			->method( 'get_id' )
			->willReturn( $order_id );

		// Arrange: Set a good return value for order total.
		$mock_order
			->method( 'get_total' )
			->willReturn( $total );

		// Arrange: Set currency for order total.
		$mock_order
			->method( 'get_currency' )
			->willReturn( $currency );

		// Arrange: Set a WP_User object as a return value of order's get_user.
		$mock_order
			->method( 'get_user' )
			->willReturn( wp_get_current_user() );

		// Arrange: Set a good return value for customer ID.
		$this->mock_customer_service->expects( $this->once() )
			->method( 'create_customer_for_user' )
			->willReturn( $customer_id );

		// Arrange: Create a mock cart.
		$mock_cart = $this->createMock( 'WC_Cart' );

		// Arrange: Return a 'requires_action' response from create_and_confirm_setup_intent().
		$intent  = WC_Helper_Intention::create_setup_intention(
			[
				'id'            => $intent_id,
				'status'        => $status,
				'client_secret' => $secret,
				'next_action'   => [],
			]
		);
		$request = $this->mock_wcpay_request( Create_And_Confirm_Setup_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

				// Assert: Order has correct charge id meta data.
		// Assert: Order has correct intention status meta data.
		// Assert: Order has correct intent ID.
		$mock_order
			->expects( $this->once() )
			->method( 'update_meta_data' )
			->with(
				'_wcpay_mode',
				WC_Payments::mode()->is_test() ? 'test' : 'prod'
			);

		// Assert: The Order_Service is called correctly.
		$this->mock_order_service
			->expects( $this->once() )
			->method( 'set_customer_id_for_order' )
			->with( $mock_order, $customer_id );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'set_payment_method_id_for_order' )
			->with( $mock_order, 'pm_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'attach_intent_info_to_order' )
			->with( $mock_order, $intent );

		// Assert: Order status was not updated.
		$mock_order
			->expects( $this->never() )
			->method( 'set_status' );

		// Assert: No order note added because payment not needed.
		$mock_order
			->expects( $this->never() )
			->method( 'add_order_note' );

		// Assert: empty_cart() was not called.
		$mock_cart
			->expects( $this->never() )
			->method( 'empty_cart' );

		// Act: prepare payment information.
		$payment_information = WCPay\Payment_Information::from_payment_request( $_POST, $mock_order, null, null, null, 'card' ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$payment_information->must_save_payment_method_to_store();

		// Act: process payment.
		$result = $this->mock_wcpay_gateway->process_payment_for_order( $mock_cart, $payment_information );

		// Assert: Returning correct array.
		$this->assertEquals( 'success', $result['result'] );
		$this->assertEquals(
			'#wcpay-confirm-si:' . $order_id . ':' . $secret . ':' . wp_create_nonce( 'wcpay_update_order_status_nonce' ),
			$result['redirect']
		);
	}

	public function test_saved_card_at_checkout() {
		$order = WC_Helper_Order::create_order();

		$intent = WC_Helper_Intention::create_intention();

		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->willReturn( 'cus_mock' );

		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		$this->mock_token_service
			->expects( $this->once() )
			->method( 'add_payment_method_to_user' )
			->with( $intent->get_payment_method_id(), $order->get_user() )
			->will( $this->returnValue( new WC_Payment_Token_CC() ) );

		$_POST['wc-poocommerce_payments-new-payment-method'] = 'true';

		$this->mock_wcpay_gateway->process_payment( $order->get_id() );
	}

	public function test_not_saved_card_at_checkout() {
		$order = WC_Helper_Order::create_order();

		$intent = WC_Helper_Intention::create_intention();

		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->willReturn( 'cus_mock' );

		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		$this->mock_token_service
			->expects( $this->never() )
			->method( 'add_payment_method_to_user' );

		$result = $this->mock_wcpay_gateway->process_payment( $order->get_id() );
	}

	public function test_does_not_update_new_payment_method() {
		$order = WC_Helper_Order::create_order();

		$intent = WC_Helper_Intention::create_intention();

		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->willReturn( 'cus_mock' );

		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		$this->mock_customer_service
			->expects( $this->never() )
			->method( 'update_payment_method_with_billing_details_from_order' );

		$this->mock_wcpay_gateway->process_payment( $order->get_id() );
	}

	public function test_updates_payment_method_billing_details() {
		$_POST = $this->setup_saved_payment_method();

		$order = WC_Helper_Order::create_order();

		$order_id = $order->get_id();

		$intent = WC_Helper_Intention::create_intention();

		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		$this->mock_action_scheduler_service
			->expects( $this->never() )
			->method( 'schedule_job' );

		$this->mock_wcpay_gateway->process_payment( $order_id );
	}

	public function test_updates_customer_with_order_data() {
		$customer_id = 'cus_mock';

		// Arrange: Create an order to test with.
		$mock_order = $this->createMock( 'WC_Order' );

		// Arrange: Set a good return value for order ID.
		$mock_order
			->method( 'get_id' )
			->willReturn( 123 );

		// Arrange: Set a WP_User object as a return value of order's get_user.
		$mock_order
			->method( 'get_user' )
			->willReturn( wp_get_current_user() );

		// Arrange: Set a good return value for order total.
		$mock_order
			->method( 'get_total' )
			->willReturn( 0 );

		// Arrange: WC_Payments_Customer_Service returns a valid customer ID.
		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->willReturn( $customer_id );

		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'update_customer_for_user' )
			->willReturn( self::CUSTOMER_ID );

		// Arrange: Create a mock cart.
		$mock_cart = $this->createMock( 'WC_Cart' );

		$payment_information = WCPay\Payment_Information::from_payment_request( $_POST, $mock_order, null, null, null, 'card' ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

		// Act: process a successful payment.
		$this->mock_wcpay_gateway->process_payment_for_order( $mock_cart, $payment_information );
	}

	public function test_process_payment_check_session_order_redirect_to_previous_order() {
		// Mock response from the session order check.
		$response = [
			'mock_param' => 1,
		];

		// Arrange the order is being processed.
		$current_order    = WC_Helper_Order::create_order();
		$current_order_id = $current_order->get_id();

		// Arrange the DPPS to return the response.
		$this->mock_dpps->expects( $this->once() )
			->method( 'check_against_session_processing_order' )
			->with( wc_get_order( $current_order_id ) )
			->willReturn( $response );

		// Assert: no call to the server to confirm the payment.
		$this->mock_wcpay_request( Create_And_Confirm_Intention::class, 0 );

		// Act: process the order but redirect to the previous/session paid order.
		$result = $this->mock_wcpay_gateway->process_payment( $current_order_id );

		// Assert: the result of check_against_session_processing_order.
		$this->assertSame( $response, $result );
	}

	public function test_process_payment_check_session_with_failed_intent_then_order_id_saved_to_session() {
		// Arrange the order is being processed.
		$current_order    = WC_Helper_Order::create_order();
		$current_order_id = $current_order->get_id();

		// Arrange a failed intention.
		$intent = WC_Helper_Intention::create_intention( [ 'status' => 'failed' ] );

		// Assert.
		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );
		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		$this->mock_dpps->expects( $this->once() )
			->method( 'check_against_session_processing_order' )
			->with( wc_get_order( $current_order_id ) )
			->willReturn( null );

		$this->mock_dpps->expects( $this->once() )
			->method( 'maybe_update_session_processing_order' )
			->with( $current_order_id );

		// Act: process the order but redirect to the previous/session paid order.
		$this->mock_wcpay_gateway->process_payment( $current_order_id );
	}

	public function test_process_payment_check_session_and_continue_processing() {
		// Arrange the order is being processed.
		$current_order    = WC_Helper_Order::create_order();
		$current_order_id = $current_order->get_id();

		// Arrange a successful intention.
		$intent = WC_Helper_Intention::create_intention();

		// Arrange null returns from the DPPS.
		$this->mock_dpps->expects( $this->once() )
			->method( 'check_against_session_processing_order' )
			->with( wc_get_order( $current_order_id ) )
			->willReturn( null );

		$this->mock_dpps->expects( $this->once() )
			->method( 'remove_session_processing_order' )
			->with( $current_order_id );

		// Assert: the payment process continues.
		$this->mock_wcpay_request( Create_And_Confirm_Intention::class )
			->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		// Act.
		$this->mock_wcpay_gateway->process_payment( $current_order_id );
	}

	/**
	 * The attached PaymentIntent has invalid info (status or order_id) with the order, so payment_process continues.
	 */
	public function test_check_payment_intent_attached_to_order_succeeded_with_invalid_data_continue_process_payment() {
		// Arrange order.
		$order    = WC_Helper_Order::create_order();
		$order_id = $order->get_id();

		$this->mock_dpps->expects( $this->once() )
			->method( 'check_payment_intent_attached_to_order_succeeded' )
			->with( wc_get_order( $order_id ) )
			->willReturn( null );

		// Assert: the payment process continues.
		$this->mock_wcpay_request( Create_And_Confirm_Intention::class )
			->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( WC_Helper_Intention::create_intention() );

		// Act: process the order.
		$this->mock_wcpay_gateway->process_payment( $order_id );
	}

	public function test_check_payment_intent_attached_to_order_succeeded_return_redirection() {
		$response = [ 'dummy_redirect' => 1 ];

		// Arrange order.
		$order    = WC_Helper_Order::create_order();
		$order_id = $order->get_id();

		// Arrange: The service will return a response.
		$this->mock_dpps->expects( $this->once() )
			->method( 'check_payment_intent_attached_to_order_succeeded' )
			->with( wc_get_order( $order_id ) )
			->willReturn( $response );

		// Assert: no more call to the server to create and confirm a new intention.
		$this->mock_wcpay_request( Create_And_Confirm_Intention::class, 0 );

		// Act: process the order but redirect to the order.
		$result = $this->mock_wcpay_gateway->process_payment( $order_id );

		// Assert: the result of check_intent_attached_to_order_succeeded.
		$this->assertSame( $response, $result );
	}

	public function test_save_payment_method_to_platform_for_classic_checkout() {
		$order = WC_Helper_Order::create_order();

		$intent = WC_Helper_Intention::create_intention();

		$_POST['save_user_in_woopay'] = 'true';

		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->willReturn( 'cus_mock' );

		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );
		$this->mock_wcpay_gateway->process_payment( $order->get_id() );
	}

	public function test_process_payment_using_platform_payment_method_adds_platform_payment_method_flag_to_request() {
		// Arrange: Create an order to test with.
		$mock_order = $this->createMock( 'WC_Order' );

		// Arrange: Set a good return value for the order's data store.
		$mock_order
			->method( 'get_data_store' )
			->willReturn( new \WC_Mock_WC_Data_Store() );

		// Arrange: Set a good return value for order ID.
		$mock_order
			->method( 'get_id' )
			->willReturn( 123 );

		// Arrange: Set a good return value for order total.
		$mock_order
			->method( 'get_total' )
			->willReturn( 100 );

		$mock_order
			->method( 'get_order_number' )
			->willReturn( 'order_number' );

		// Arrange: Set a WP_User object as a return value of order's get_user.
		$mock_order
			->method( 'get_user' )
			->willReturn( wp_get_current_user() );

		// Arrange: Create a mock cart.
		$mock_cart = $this->createMock( 'WC_Cart' );

		// Arrange: Payment method was created with platform.
		$this->mock_wcpay_gateway
			->expects( $this->any() )
			->method( 'should_use_stripe_platform_on_checkout_page' )
			->willReturn( true );

		$_POST['wcpay-is-platform-payment-method'] = 1;

		// Arrange: Return a successful response from create_and_confirm_intention().
		$intent = WC_Helper_Intention::create_intention();

		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->willReturn( 'cus_mock' );

		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		$charge_request = $this->mock_wcpay_request( Get_Charge::class, 1, 'ch_mock' );

		$charge_request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( [ 'id' => 'ch_mock' ] );

		$payment_information = WCPay\Payment_Information::from_payment_request( $_POST, $mock_order, null, null, null, 'card' ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

		// Act: process a successful payment.
		$result = $this->mock_wcpay_gateway->process_payment_for_order( $mock_cart, $payment_information );

		// Assert: Returning correct array.
		$this->assertEquals( 'success', $result['result'] );
	}

	public function test_process_payment_for_subscription_in_woopay_adds_subscription_flag_to_request() {

		$customer = 'cus_12345';

		// Arrange: Create an order to test with.
		$order = WC_Helper_Order::create_order();

		// This meta is added to the order by WooPay.
		$order->add_meta_data( '_woopay_has_subscription', '1' );

		// Arrange: Create a mock cart.
		$mock_cart = $this->createMock( 'WC_Cart' );

		// Arrange: Return a successful response from create_and_confirm_intention().
		$intent = WC_Helper_Intention::create_intention();
		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->will( $this->returnValue( $customer ) );
		// Assert: API is called with additional flag.
		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'set_amount' )
			->with( 5000 )
			->willReturn( $request );

		$request->expects( $this->once() )
			->method( 'set_payment_method' )
			->with( 'pm_mock' )
			->willReturn( $request );

		$request->expects( $this->once() )
			->method( 'set_customer' )
			->with( $customer )
			->willReturn( $request );

		$request->expects( $this->once() )
			->method( 'set_capture_method' )
			->with( false )
			->willReturn( $request );

		$request->expects( $this->once() )
			->method( 'set_metadata' )
			->with( [] )
			->willReturn( $request );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );
		$payment_information = WCPay\Payment_Information::from_payment_request( $_POST, $order, null, null, null, 'card' ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

		// Act: process a successful payment.
		$result = $this->mock_wcpay_gateway->process_payment_for_order( $mock_cart, $payment_information );

		// Assert: Returning correct array.
		$this->assertEquals( 'success', $result['result'] );
	}

	public function test_process_payment_from_woopay_adds_meta_to_oder() {
		// Arrange: Set request value to mimic a payment through WooPay.
		$_POST['is_woopay'] = true;

		// Arrange: Create an order to test with.
		$mock_order = $this->createMock( 'WC_Order' );

		// Arrange: Set a good return value for the order's data store.
		$mock_order
			->method( 'get_data_store' )
			->willReturn( new \WC_Mock_WC_Data_Store() );

		// Arrange: Set a good return value for order ID.
		$mock_order
			->method( 'get_id' )
			->willReturn( 123 );

		// Arrange: Set a good return value for order total.
		$mock_order
			->method( 'get_total' )
			->willReturn( 100 );

		// Arrange: Set a WP_User object as a return value of order's get_user.
		$mock_order
			->method( 'get_user' )
			->willReturn( wp_get_current_user() );

		$mock_order
			->method( 'get_order_number' )
			->willReturn( 'order_number_1' );

		// Arrange: Create a mock cart.
		$mock_cart = $this->createMock( 'WC_Cart' );

		// Assert: Order gets the 'is_woopay' meta data added.
		$mock_order
			->expects( $this->any() )
			->method( 'add_meta_data' )
			->with( 'is_woopay', true );

		// Arrange: Return a successful response from create_and_confirm_intention().
		$intent = WC_Helper_Intention::create_intention();

		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->willReturn( 'cus_mock' );

		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->will( $this->returnValue( 'cus_12345' ) );
		// Assert: API is called with additional flag.
		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );
		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		$charge_request = $this->mock_wcpay_request( Get_Charge::class, 1, 'ch_mock' );

		$charge_request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( [ 'id' => 'ch_mock' ] );
		$payment_information = WCPay\Payment_Information::from_payment_request( $_POST, $mock_order, null, null, null, 'card' ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

		// Act: process a successful payment.
		$result = $this->mock_wcpay_gateway->process_payment_for_order( $mock_cart, $payment_information );

		// Assert: Returning correct array.
		$this->assertEquals( 'success', $result['result'] );
	}

	public function test_process_payment_for_subscription_from_woopay_does_not_save_token_if_exists() {
		$subscription_payment_method_id = 'pm_subscription_mock';

		// Arrange: Set request value to mimic a payment through WooPay.
		$_POST['is_woopay'] = true;

		// Arrange: Create an order to test with.
		$order = WC_Helper_Order::create_order();

		// Arrange: Make the order contain a subscription.
		$this->mock_wcs_order_contains_subscription( true );

		// Arrange: Create a mock cart.
		$mock_cart = $this->createMock( 'WC_Cart' );

		// Arrange: Add a payment method to the user.
		$token = WC_Helper_Token::create_token( $subscription_payment_method_id, $order->get_user_id() );

		// Arrange: Make the payment method selected in WooPay to be the same one the user has stored.
		$intent = WC_Helper_Intention::create_intention( [ 'payment_method_id' => $subscription_payment_method_id ] );

		// Arrange: Return a successful response from create_and_confirm_intention().
		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->willReturn( 'cus_mock' );

		// Arrange: Throw an exception in create_and_confirm_intention.
		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		$payment_information = WCPay\Payment_Information::from_payment_request( $_POST, $order, null, null, null, 'card' ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$payment_information->must_save_payment_method_to_store();

		// Assert: The payment method is not added to the user.
		$this->mock_token_service
			->expects( $this->never() )
			->method( 'add_payment_method_to_user' );

		// Act: process a successful payment.
		$result = $this->mock_wcpay_gateway->process_payment_for_order( $mock_cart, $payment_information );

		// Assert: Returning correct array.
		$this->assertEquals( 'success', $result['result'] );
	}

	public function test_process_payment_for_subscription_from_woopay_save_token_if_does_not_exist() {

		// Arrange: Set request value to mimic a payment through WooPay.
		$_POST['is_woopay'] = true;

		// Arrange: Create an order to test with.
		$order = WC_Helper_Order::create_order();

		// Arrange: Make the order contain a subscription.
		$this->mock_wcs_order_contains_subscription( true );
		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->willReturn( 'cus_mock' );

		// Arrange: Create a mock cart.
		$mock_cart = $this->createMock( 'WC_Cart' );

		// Arrange: Add a payment method to the user.
		$token = WC_Helper_Token::create_token( 'pm_existing_mock', $order->get_user_id() );

		// Arrange: Make the payment method selected in WooPay to be different from the onethe user has stored.
		$intent = WC_Helper_Intention::create_intention( [ 'payment_method_id' => 'pm_new_mock' ] );

		// Arrange: Return a successful response from create_and_confirm_intention().
		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $intent );

		$payment_information = WCPay\Payment_Information::from_payment_request( $_POST, $order, null, null, null, 'card' ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$payment_information->must_save_payment_method_to_store();

		// Assert: The payment method is added to the user.
		$this->mock_token_service
			->expects( $this->once() )
			->method( 'add_payment_method_to_user' )
			->with( $intent->get_payment_method_id(), $order->get_user() )
			->will( $this->returnValue( new WC_Payment_Token_CC() ) );

		// Act: process a successful payment.
		$result = $this->mock_wcpay_gateway->process_payment_for_order( $mock_cart, $payment_information );

		// Assert: Returning correct array.
		$this->assertEquals( 'success', $result['result'] );
	}

	private function mock_wcs_order_contains_subscription( $value ) {
		WC_Subscriptions::set_wcs_order_contains_subscription(
			function ( $order ) use ( $value ) {
				return $value;
			}
		);
	}

	private function setup_saved_payment_method() {
		$token = WC_Helper_Token::create_token( 'pm_mock' );

		return [
			'payment_method' => WC_Payment_Gateway_WCPay::GATEWAY_ID,
			'wc-' . WC_Payment_Gateway_WCPay::GATEWAY_ID . '-payment-token' => (string) $token->get_id(),
		];
	}
}
