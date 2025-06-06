<?php
/**
 * Class WC_Payments_Webhook_Processing_Service_Test
 *
 * @package PooCommerce\Payments\Tests
 */

use PHPUnit\Framework\MockObject\MockObject;
use WCPay\Constants\Order_Status;
use WCPay\Constants\Intent_Status;
use WCPay\Constants\Payment_Method;
use WCPay\Constants\Refund_Status;
use WCPay\Constants\Refund_Failure_Reason;
use WCPay\Database_Cache;
use WCPay\Exceptions\Invalid_Payment_Method_Exception;
use WCPay\Exceptions\Invalid_Webhook_Data_Exception;
use WCPay\Exceptions\Order_Not_Found_Exception;
use WCPay\Exceptions\Rest_Request_Exception;

// Need to use WC_Mock_Data_Store.
require_once __DIR__ . '/helpers/class-wc-mock-wc-data-store.php';

/**
 * WC_Payments_Webhook_Processing_Service unit tests.
 */
class WC_Payments_Webhook_Processing_Service_Test extends WCPAY_UnitTestCase {

	/**
	 * System under test.
	 *
	 * @var WC_Payments_Webhook_Processing_Service
	 */
	private $webhook_processing_service;

	/**
	 * @var WC_Payments_DB&MockObject
	 */
	private $mock_db_wrapper;

	/**
	 * @var WC_Payments_Remote_Note_Service&MockObject
	 */
	private $mock_remote_note_service;

	/**
	 * @var WC_Payments_Order_Service&MockObject
	 */
	private $order_service;

	/**
	 * receipt_service
	 *
	 * @var WC_Payments_In_Person_Payments_Receipts_Service&MockObject
	 */
	private $mock_receipt_service;

	/**
	 * mock_wcpay_gateway
	 *
	 * @var WC_Payment_Gateway_WCPay&MockObject
	 */
	private $mock_wcpay_gateway;

	/**
	 * Mock customer service
	 *
	 * @var WC_Payments_Customer_Service&MockObject
	 */
	private $mock_customer_service;

	/**
	 * Mock database cache
	 *
	 * @var Database_Cache&MockObject
	 */
	private $mock_database_cache;

	/**
	 * @var array
	 */
	private $event_body;

	/**
	 * @var WC_Order&MockObject
	 */
	private $mock_order;

	/**
	 * @var WC_Payments_API_Client&MockObject
	 */
	private $mock_api_client;

	/**
	 * Pre-test setup
	 */
	public function set_up() {
		parent::set_up();

		/** @var WC_Payments_API_Client|MockObject $mock_api_client */
		$this->mock_api_client = $this->getMockBuilder( WC_Payments_API_Client::class )
			->disableOriginalConstructor()
			->getMock();

		$this->order_service = $this->getMockBuilder( 'WC_Payments_Order_Service' )
			->setConstructorArgs( [ $this->createMock( WC_Payments_API_Client::class ) ] )
			->onlyMethods(
				[
					'get_wcpay_refund_id_for_order',
					'add_note_and_metadata_for_created_refund',
					'create_refund_for_order',
					'mark_terminal_payment_failed',
					'handle_insufficient_balance_for_refund',
					'handle_failed_refund',
				]
			)
			->getMock();

		$this->mock_db_wrapper = $this->getMockBuilder( WC_Payments_DB::class )
			->disableOriginalConstructor()
			->onlyMethods( [ 'order_from_charge_id', 'order_from_intent_id', 'order_from_order_id' ] )
			->getMock();

		$this->mock_remote_note_service = $this->createMock( WC_Payments_Remote_Note_Service::class );

		$this->mock_receipt_service = $this->createMock( WC_Payments_In_Person_Payments_Receipts_Service::class );

		$this->mock_wcpay_gateway = $this->createMock( WC_Payment_Gateway_WCPay::class );

		$this->mock_customer_service = $this->createMock( WC_Payments_Customer_Service::class );

		$this->mock_database_cache = $this->createMock( Database_Cache::class );

		$this->webhook_processing_service = new WC_Payments_Webhook_Processing_Service(
			$this->mock_api_client,
			$this->mock_db_wrapper,
			$this->createMock( WC_Payments_Account::class ),
			$this->mock_remote_note_service,
			$this->order_service,
			$this->mock_receipt_service,
			$this->mock_wcpay_gateway,
			$this->mock_customer_service,
			$this->mock_database_cache
		);

		// Build the event body data.
		$event_object = [];

		$event_data           = [];
		$event_data['object'] = $event_object;

		$this->event_body         = [ 'id' => uniqid( 'evt_' ) ];
		$this->event_body['data'] = $event_data;

		$this->mock_order = $this->createMock( WC_Order::class );
		$this->mock_order
			->expects( $this->any() )
			->method( 'get_id' )
			->willReturn( 1234 );
		WC_Payments::mode()->live();
	}

	/**
	 * Test processing a webhook that requires no action.
	 */
	public function test_noop_webhook() {
		// Setup test request data.
		$this->event_body['type']     = 'unknown.webhook.event';
		$this->event_body['livemode'] = true;

		// Run the test.
		$result = $this->webhook_processing_service->process( $this->event_body );

		// This is to ensure that process is still gone through without any issue.
		$this->assertNull( $result );
	}

	/**
	 * Test a webhook with no type property.
	 */
	public function test_webhook_with_no_type_property() {

		$this->expectException( Invalid_Webhook_Data_Exception::class );
		$this->expectExceptionMessage( 'type not found in array' );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Test a webhook with a test event for a gateway with live mode.
	 */
	public function test_webhook_with_test_event_and_live_gateway() {
		$this->event_body['type']     = 'wcpay.notification';
		$this->event_body['livemode'] = false;
		$this->event_body['data']     = [
			'title'   => 'test',
			'content' => 'hello',
		];

		$this->mock_remote_note_service
			->expects( $this->never() )
			->method( 'put_note' )
			->with(
				[
					'title'   => 'test',
					'content' => 'hello',
				]
			);

		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Test a webhook with a live event for a gateway in test mode.
	 */
	public function test_webhook_with_live_event_and_test_gateway() {
		$this->event_body['type']     = 'wcpay.notification';
		$this->event_body['livemode'] = true;
		$this->event_body['data']     = [
			'title'   => 'test',
			'content' => 'hello',
		];

		WC_Payments::mode()->test();

		$this->mock_remote_note_service
			->expects( $this->never() )
			->method( 'put_note' )
			->with(
				[
					'title'   => 'test',
					'content' => 'hello',
				]
			);

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Test a webhook with no object property.
	 */
	public function test_webhook_with_no_object_property() {
		// Setup test request data.
		$this->event_body['type']     = 'charge.refund.updated';
		$this->event_body['livemode'] = true;
		unset( $this->event_body['data']['object'] );

		$this->expectException( Invalid_Webhook_Data_Exception::class );
		$this->expectExceptionMessage( 'object not found in array' );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Test a webhook with no data property.
	 */
	public function test_webhook_with_no_data_property() {
		// Setup test request data.
		$this->event_body['type']     = 'charge.refund.updated';
		$this->event_body['livemode'] = true;
		unset( $this->event_body['data'] );

		$this->expectException( Invalid_Webhook_Data_Exception::class );
		$this->expectExceptionMessage( 'data not found in array' );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Test a failed refund without matched WC Refunds.
	 */
	public function test_failed_refund_update_webhook_without_matched_wc_refund() {
		// Setup test request data.
		$this->event_body['type']           = 'charge.refund.updated';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'status'   => 'failed',
			'charge'   => 'test_charge_id',
			'id'       => 'test_refund_id',
			'amount'   => 999,
			'currency' => 'gbp',
		];

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->with( 'test_charge_id' )
			->willReturn( $this->mock_order );

		$this->order_service
			->expects( $this->once() )
			->method( 'handle_failed_refund' )
			->with( $this->mock_order, 'test_refund_id', 999, 'gbp', null );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Test a failed refund with matched WC Refunds.
	 */
	public function test_failed_refund_update_webhook_with_matched_wc_refund() {
		// Setup test request data.
		$this->event_body['type']           = 'charge.refund.updated';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'status'   => 'failed',
			'charge'   => 'test_charge_id',
			'id'       => 'test_refund_id',
			'amount'   => 999,
			'currency' => 'usd',
		];

		$mock_refund_1 = $this->createMock( WC_Order_Refund::class );
		$mock_refund_2 = $this->createMock( WC_Order_Refund::class );
		$this->order_service
			->expects( $this->exactly( 2 ) )
			->method( 'get_wcpay_refund_id_for_order' )
			->withConsecutive(
				[ $mock_refund_1 ],
				[ $mock_refund_2 ]
			)->willReturnOnConsecutiveCalls(
				'another_test_refund_id',
				'test_refund_id'
			);

		$this->mock_order->method( 'get_refunds' )->willReturn(
			[
				$mock_refund_1,
				$mock_refund_2,
			]
		);

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->with( 'test_charge_id' )
			->willReturn( $this->mock_order );

		$this->order_service
			->expects( $this->once() )
			->method( 'handle_failed_refund' )
			->with( $this->mock_order, 'test_refund_id', 999, 'usd', $mock_refund_2 );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Test a refund update with status `cancelled`
	 */
	public function test_cancelled_refund_update_webhook_with_matched_wc_refund() {
		// Setup test request data.
		$this->event_body['type']           = 'charge.refund.updated';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'status'   => Refund_Status::CANCELED,
			'charge'   => 'test_charge_id',
			'id'       => 'test_refund_id',
			'amount'   => 999,
			'currency' => 'usd',
		];

		$mock_refund_1 = $this->createMock( WC_Order_Refund::class );
		$mock_refund_2 = $this->createMock( WC_Order_Refund::class );
		$this->order_service
			->expects( $this->exactly( 2 ) )
			->method( 'get_wcpay_refund_id_for_order' )
			->withConsecutive(
				[ $mock_refund_1 ],
				[ $mock_refund_2 ]
			)->willReturnOnConsecutiveCalls(
				'another_test_refund_id',
				'test_refund_id'
			);

		$this->mock_order->method( 'get_refunds' )->willReturn(
			[
				$mock_refund_1,
				$mock_refund_2,
			]
		);

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->with( 'test_charge_id' )
			->willReturn( $this->mock_order );

		$this->order_service
			->expects( $this->once() )
			->method( 'handle_failed_refund' )
			->with( $this->mock_order, 'test_refund_id', 999, 'usd', $mock_refund_2, true );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Test a failed refund update webhook with insufficient funds.
	 */
	public function test_failed_refund_update_webhook_with_insufficient_funds() {
		// Setup test request data.
		$this->event_body['type']           = 'charge.refund.updated';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'status'         => 'failed',
			'charge'         => 'charge_id',
			'id'             => 'test_refund_id',
			'amount'         => 999,
			'currency'       => 'gbp',
			'failure_reason' => 'insufficient_funds',
		];

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->with( 'charge_id' )
			->willReturn( $this->mock_order );

		$this->order_service
			->expects( $this->once() )
			->method( 'handle_failed_refund' )
			->with( $this->mock_order, 'test_refund_id', 999, 'gbp', null, false, 'insufficient_funds' );

		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Test a refund does not set failed meta.
	 */
	public function test_succeeded_refund_update_webhook_without_matched_wc_refund() {
		// Setup test request data.
		$this->event_body['type']           = 'charge.refund.updated';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'status'   => Refund_Status::SUCCEEDED,
			'charge'   => 'test_charge_id',
			'id'       => 'test_refund_id',
			'amount'   => 999,
			'currency' => 'usd',
		];

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->with( 'test_charge_id' )
			->willReturn( $this->mock_order );

		$this->order_service
			->expects( $this->never() )
			->method( 'add_note_and_metadata_for_created_refund' );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Test a valid failed refund update webhook.
	 */
	public function test_succeeded_refund_update_webhook_with_matched_wc_refund() {
		// Setup test request data.
		$this->event_body['type']           = 'charge.refund.updated';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'status'              => 'succeeded',
			'charge'              => 'test_charge_id',
			'id'                  => 'test_refund_id',
			'amount'              => 999,
			'currency'            => 'usd',
			'balance_transaction' => 'txn_balance_transaction',
		];

		$mock_refund_1 = $this->createMock( WC_Order_Refund::class );
		$mock_refund_2 = $this->createMock( WC_Order_Refund::class );
		$this->order_service
			->expects( $this->exactly( 2 ) )
			->method( 'get_wcpay_refund_id_for_order' )
			->withConsecutive(
				[ $mock_refund_1 ],
				[ $mock_refund_2 ]
			)->willReturnOnConsecutiveCalls(
				'another_test_refund_id',
				'test_refund_id'
			);

		$this->mock_order->method( 'get_refunds' )->willReturn(
			[
				$mock_refund_1,
				$mock_refund_2,
			]
		);

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->with( 'test_charge_id' )
			->willReturn( $this->mock_order );

		$this->order_service
			->expects( $this->once() )
			->method( 'add_note_and_metadata_for_created_refund' )
			->with( $this->mock_order, $mock_refund_2, 'test_refund_id', 'txn_balance_transaction' );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Test a failed refund update webhook with an unknown charge ID.
	 */
	public function test_failed_refund_update_webhook_with_unknown_charge_id() {
		// Setup test request data.
		$this->event_body['type']           = 'charge.refund.updated';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'status'   => 'failed',
			'charge'   => 'unknown_charge_id',
			'id'       => 'test_refund_id',
			'amount'   => 999,
			'currency' => 'gbp',
		];

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->with( 'unknown_charge_id' )
			->willReturn( false );

		$this->expectException( Invalid_Payment_Method_Exception::class );
		$this->expectExceptionMessage( 'Could not find order via charge ID: unknown_charge_id' );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Test an invalid status refund update webhook
	 */
	public function test_invalid_status_refund_update_webhook_throws_exceptions() {
		// Setup test request data.
		$this->event_body['type']           = 'charge.refund.updated';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'status'   => 'invalid_status',
			'charge'   => 'test_charge_id',
			'id'       => 'test_refund_id',
			'amount'   => 999,
			'currency' => 'gbp',
		];

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->with( 'test_charge_id' )
			->willReturn( $this->mock_order );

		$this->expectException( Invalid_Webhook_Data_Exception::class );
		$this->expectExceptionMessage( 'Invalid refund update status: invalid_status' );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Tests that a remote note webhook puts the note in the inbox.
	 */
	public function test_remote_note_puts_note() {
		// Setup test request data.
		$this->event_body['type']     = 'wcpay.notification';
		$this->event_body['livemode'] = true;
		$this->event_body['data']     = [
			'title'   => 'test',
			'content' => 'hello',
		];
		$this->mock_remote_note_service
			->expects( $this->once() )
			->method( 'put_note' )
			->with(
				[
					'title'   => 'test',
					'content' => 'hello',
				]
			);

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Tests that a remote note webhook handles service exceptions.
	 */
	public function test_remote_note_fails_returns_expected_webhook_exception() {
		// Setup test request data.
		$this->event_body['type']     = 'wcpay.notification';
		$this->event_body['livemode'] = true;
		$this->event_body['data']     = [
			'foo' => 'bar',
		];
		$this->mock_remote_note_service
			->expects( $this->once() )
			->method( 'put_note' )
			->willThrowException( new Rest_Request_Exception( 'Invalid note.' ) );

		$this->expectException( Invalid_Webhook_Data_Exception::class );
		$this->expectExceptionMessage( 'Invalid note.' );

		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Tests that an exception thrown in an action will be caught but webhook will still be handled successfully
	 */
	public function test_action_hook_exception_returns_response() {
		add_action(
			'poocommerce_payments_before_webhook_delivery',
			function () {
				throw new Exception( 'Crash before' );
			}
		);

		add_action(
			'poocommerce_payments_after_webhook_delivery',
			function () {
				throw new Exception( 'Crash after' );
			}
		);

		// Setup test request data.
		$this->event_body['type']     = 'wcpay.notification';
		$this->event_body['livemode'] = true;
		$this->event_body['data']     = [
			'title'   => 'test',
			'content' => 'hello',
		];
		$this->mock_remote_note_service
			->expects( $this->once() )
			->method( 'put_note' )
			->with(
				[
					'title'   => 'test',
					'content' => 'hello',
				]
			);

		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Tests that a payment_intent.succeeded event will complete the order.
	 */
	public function test_payment_intent_successful_and_completes_order() {
		$this->event_body['type']           = 'payment_intent.succeeded';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'       => $id            = 'pi_123123123123123', // payment_intent's ID.
			'object'   => 'payment_intent',
			'amount'   => 1500,
			'charges'  => [
				'data' => [
					[
						'id'                     => $charge_id         = 'py_123123123123123',
						'payment_method'         => $payment_method_id = 'pm_foo',
						'payment_method_details' => [
							'type' => 'card',
						],
					],
				],
			],
			'currency' => $currency      = 'eur',
			'status'   => $intent_status = Intent_Status::SUCCEEDED,
			'metadata' => [],
		];

		$this->mock_api_client
			->expects( $this->once() )
			->method( 'deserialize_payment_intention_object_from_array' )
			->with( $this->event_body['data']['object'] )
			->willReturn(
				WC_Helper_Intention::create_intention(
					[
						'status'                 => $intent_status,
						'payment_method_options' => [ 'card' => [ 'request_three_d_secure' => 'automatic' ] ],
					]
				)
			);

		$this->mock_order
			->expects( $this->exactly( 5 ) )
			->method( 'update_meta_data' )
			->withConsecutive(
				[ '_intent_id', $id ],
				[ '_charge_id', $charge_id ],
				[ '_payment_method_id', $payment_method_id ],
				[ WC_Payments_Utils::ORDER_INTENT_CURRENCY_META_KEY, $currency ],
				[ '_intention_status', $intent_status ]
			);

		$this->mock_order
			->expects( $this->exactly( 2 ) )
			->method( 'save' );

			$this->mock_order
				->method( 'get_total' )
				->willReturn( 15.00 );

		$this->mock_order
			->expects( $this->exactly( 2 ) )
			->method( 'has_status' )
			->with(
				[
					Order_Status::PROCESSING,
					Order_Status::COMPLETED,
				]
			)
			->willReturn( false );

		$this->mock_order
			->expects( $this->once() )
			->method( 'payment_complete' );

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_intent_id' )
			->with( 'pi_123123123123123' )
			->willReturn( $this->mock_order );

		$this->mock_order
			->method( 'get_data_store' )
			->willReturn( new \WC_Mock_WC_Data_Store() );

		$this->mock_order
			->method( 'get_meta' )
			->willReturn( '' );

		$this->mock_receipt_service
			->expects( $this->never() )
			->method( 'send_customer_ipp_receipt_email' );

		$this->mock_wcpay_gateway
			->expects( $this->never() )
			->method( 'get_option' );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Tests that a payment_intent.succeeded event will add relevant metadata.
	 */
	public function test_payment_intent_successful_adds_relevant_metadata() {
		$this->event_body['type']           = 'payment_intent.succeeded';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'       => $id            = 'pi_123123123123123', // payment_intent's ID.
			'object'   => 'payment_intent',
			'amount'   => 1500,
			'charges'  => [
				'data' => [
					[
						'id'                     => $charge_id         = 'py_123123123123123',
						'payment_method'         => $payment_method_id = 'pm_foo',
						'payment_method_details' => [
							'type' => 'card',
						],
						'application_fee_amount' => 100,
					],
				],
			],
			'currency' => $currency      = 'eur',
			'status'   => $intent_status = Intent_Status::SUCCEEDED,
			'metadata' => [],
		];

		$this->mock_api_client
			->expects( $this->once() )
			->method( 'deserialize_payment_intention_object_from_array' )
			->with( $this->event_body['data']['object'] )
			->willReturn(
				WC_Helper_Intention::create_intention(
					[
						'status'                 => $intent_status,
						'payment_method_options' => [ 'card' => [ 'request_three_d_secure' => 'automatic' ] ],
					]
				)
			);

		$this->mock_order
			->expects( $this->exactly( 7 ) )
			->method( 'update_meta_data' )
			->withConsecutive(
				[ '_intent_id', $id ],
				[ '_charge_id', $charge_id ],
				[ '_payment_method_id', $payment_method_id ],
				[ WC_Payments_Utils::ORDER_INTENT_CURRENCY_META_KEY, $currency ],
				[ '_wcpay_transaction_fee', 1.0 ],
				[ '_wcpay_net', 14.00 ],
				[ '_intention_status', $intent_status ],
			);

		$this->mock_order
			->expects( $this->exactly( 2 ) )
			->method( 'save' );

			$this->mock_order
				->method( 'get_total' )
				->willReturn( 15.00 );

		$this->mock_order
			->expects( $this->exactly( 2 ) )
			->method( 'has_status' )
			->with(
				[
					Order_Status::PROCESSING,
					Order_Status::COMPLETED,
				]
			)
			->willReturn( false );

		$this->mock_order
			->expects( $this->once() )
			->method( 'payment_complete' );

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_intent_id' )
			->with( 'pi_123123123123123' )
			->willReturn( $this->mock_order );

		$this->mock_order
			->method( 'get_data_store' )
			->willReturn( new \WC_Mock_WC_Data_Store() );

		$this->mock_order
			->method( 'get_meta' )
			->willReturn( '' );

		$this->mock_receipt_service
			->expects( $this->never() )
			->method( 'send_customer_ipp_receipt_email' );

		$this->mock_wcpay_gateway
			->expects( $this->never() )
			->method( 'get_option' );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Tests that a payment_intent.succeeded event will complete the order even if the intent was not properly attached into the order.
	 */
	public function test_payment_intent_successful_and_completes_order_without_intent_id() {
		$this->event_body['type']           = 'payment_intent.succeeded';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'       => $id            = 'pi_123123123123123', // payment_intent's ID.
			'object'   => 'payment_intent',
			'amount'   => 1500,
			'charges'  => [
				'data' => [
					[
						'id'                     => $charge_id         = 'py_123123123123123',
						'payment_method'         => $payment_method_id = 'pm_foo',
						'payment_method_details' => [
							'type' => 'card',
						],
					],
				],
			],
			'currency' => $currency      = 'eur',
			'status'   => $intent_status = Intent_Status::SUCCEEDED,
			'metadata' => [ 'order_id' => 'id_1323' ], // Using order_id inside of the intent metadata to find the order.
		];

		$this->mock_api_client
			->expects( $this->once() )
			->method( 'deserialize_payment_intention_object_from_array' )
			->with( $this->event_body['data']['object'] )
			->willReturn(
				WC_Helper_Intention::create_intention(
					[
						'status'                 => $intent_status,
						'payment_method_options' => [ 'card' => [ 'request_three_d_secure' => 'automatic' ] ],
					]
				)
			);

		$this->mock_order
			->expects( $this->exactly( 5 ) )
			->method( 'update_meta_data' )
			->withConsecutive(
				[ '_intent_id', $id ],
				[ '_charge_id', $charge_id ],
				[ '_payment_method_id', $payment_method_id ],
				[ WC_Payments_Utils::ORDER_INTENT_CURRENCY_META_KEY, $currency ],
				[ '_intention_status', $intent_status ]
			);

		$this->mock_order
			->expects( $this->exactly( 2 ) )
			->method( 'save' );

			$this->mock_order
				->method( 'get_total' )
				->willReturn( 15.00 );

		$this->mock_order
			->expects( $this->exactly( 2 ) )
			->method( 'has_status' )
			->with(
				[
					Order_Status::PROCESSING,
					Order_Status::COMPLETED,
				]
			)
			->willReturn( false );

		$this->mock_order
			->expects( $this->once() )
			->method( 'payment_complete' );

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_intent_id' )
			->with( 'pi_123123123123123' )
			->willReturn( null );

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_order_id' )
			->with( 'id_1323' )
			->willReturn( $this->mock_order );

		$this->mock_order
			->method( 'get_data_store' )
			->willReturn( new \WC_Mock_WC_Data_Store() );

		$this->mock_order
			->method( 'get_meta' )
			->willReturn( '' );

		$this->mock_receipt_service
			->expects( $this->never() )
			->method( 'send_customer_ipp_receipt_email' );

		$this->mock_wcpay_gateway
			->expects( $this->never() )
			->method( 'get_option' );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Tests that a payment_intent.succeeded event will not complete the order
	 * if it is already completed/processed.
	 */
	public function test_payment_intent_successful_when_retrying() {
		$this->event_body['type']           = 'payment_intent.succeeded';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'       => $id            = 'pi_123123123123123', // payment_intent's ID.
			'object'   => 'payment_intent',
			'amount'   => 1500,
			'charges'  => [
				'data' => [
					[
						'id'             => $charge_id         = 'py_123123123123123',
						'payment_method' => $payment_method_id = 'pm_foo',
					],
				],
			],
			'currency' => $currency      = 'eur',
			'status'   => $intent_status = Intent_Status::SUCCEEDED,
			'metadata' => [],
		];

		$this->mock_api_client
			->expects( $this->once() )
			->method( 'deserialize_payment_intention_object_from_array' )
			->with( $this->event_body['data']['object'] )
			->willReturn(
				WC_Helper_Intention::create_intention(
					[
						'status' => $intent_status,
					]
				)
			);

		$this->mock_order
			->expects( $this->exactly( 4 ) )
			->method( 'update_meta_data' )
			->withConsecutive(
				[ '_intent_id', $id ],
				[ '_charge_id', $charge_id ],
				[ '_payment_method_id', $payment_method_id ],
				[ WC_Payments_Utils::ORDER_INTENT_CURRENCY_META_KEY, $currency ]
			);

		$this->mock_order
			->expects( $this->once() )
			->method( 'save' );

		$this->mock_order
			->expects( $this->once() )
			->method( 'has_status' )
			->with(
				[
					Order_Status::PROCESSING,
					Order_Status::COMPLETED,
				]
			)
			->willReturn( true );

		$this->mock_order
			->expects( $this->never() )
			->method( 'payment_complete' );

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_intent_id' )
			->with( 'pi_123123123123123' )
			->willReturn( $this->mock_order );

		$this->mock_order
			->method( 'get_data_store' )
			->willReturn( new \WC_Mock_WC_Data_Store() );

		$this->mock_receipt_service
			->expects( $this->never() )
			->method( 'send_customer_ipp_receipt_email' );

		$this->mock_wcpay_gateway
			->expects( $this->never() )
			->method( 'get_option' );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Tests that a payment_intent.succeeded event will complete the order and
	 * send the card reader receipt to the customer.
	 */
	public function test_payment_intent_successful_and_send_card_reader_receipt() {
		$this->event_body['type']           = 'payment_intent.succeeded';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'       => 'pi_123123123123123', // payment_intent's ID.
			'object'   => 'payment_intent',
			'amount'   => 1500,
			'charges'  => [
				'data' => [
					[
						'id'                     => 'py_123123123123123',
						'payment_method_details' => [
							'type' => 'card_present',
						],
					],
				],
			],
			'currency' => 'eur',
			'status'   => $intent_status    = Intent_Status::SUCCEEDED,
			'metadata' => [],
		];

		$mock_merchant_settings = [
			'business_name' => 'Test Business',
			'support_info'  => [
				'address' => [],
				'phone'   => '42424',
				'email'   => 'some@example.com',
			],
		];

		$this->mock_api_client
			->expects( $this->once() )
			->method( 'deserialize_payment_intention_object_from_array' )
			->with( $this->event_body['data']['object'] )
			->willReturn(
				WC_Helper_Intention::create_intention(
					[
						'status' => $intent_status,
					]
				)
			);

		$this->mock_order
			->expects( $this->exactly( 2 ) )
			->method( 'has_status' )
			->with(
				[
					Order_Status::PROCESSING,
					Order_Status::COMPLETED,
				]
			)
			->willReturn( false );

			$this->mock_order
				->method( 'get_total' )
				->willReturn( 15.00 );

		$this->mock_order
			->expects( $this->once() )
			->method( 'payment_complete' );

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_intent_id' )
			->with( 'pi_123123123123123' )
			->willReturn( $this->mock_order );

		$this->mock_order
			->method( 'get_data_store' )
			->willReturn( new \WC_Mock_WC_Data_Store() );

		$this->mock_order
			->method( 'get_meta' )
			->willReturn( '' );

		$this->mock_receipt_service
			->expects( $this->once() )
			->method( 'send_customer_ipp_receipt_email' )
			->with(
				$this->mock_order,
				$mock_merchant_settings,
				$this->event_body['data']['object']['charges']['data'][0]
			);

		$this->mock_wcpay_gateway
			->expects( $this->exactly( 4 ) )
			->method( 'get_option' )
			->withConsecutive(
				[ 'account_business_name' ],
				[ 'account_business_support_address' ],
				[ 'account_business_support_phone' ],
				[ 'account_business_support_email' ]
			)
			->willReturnOnConsecutiveCalls(
				$mock_merchant_settings['business_name'],
				$mock_merchant_settings['support_info']['address'],
				$mock_merchant_settings['support_info']['phone'],
				$mock_merchant_settings['support_info']['email']
			);

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Tests that a payment_intent.succeeded event will save mandate.
	 */
	public function test_payment_intent_successful_and_save_mandate() {
		$this->event_body['type']           = 'payment_intent.succeeded';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'       => $id            = 'pi_123123123123123', // payment_intent's ID.
			'object'   => 'payment_intent',
			'amount'   => 1500,
			'charges'  => [
				'data' => [
					[
						'id'                     => $charge_id         = 'py_123123123123123',
						'payment_method'         => $payment_method_id = 'pm_foo',
						'payment_method_details' => [
							'card' => [
								'mandate' => $mandate_id = 'mandate_123123123',
							],
							'type' => 'card',
						],
					],
				],
			],
			'currency' => $currency      = 'eur',
			'status'   => $intent_status = Intent_Status::SUCCEEDED,
			'metadata' => [],
		];

		$this->mock_api_client
			->expects( $this->once() )
			->method( 'deserialize_payment_intention_object_from_array' )
			->with( $this->event_body['data']['object'] )
			->willReturn(
				WC_Helper_Intention::create_intention(
					[
						'status'                 => $intent_status,
						'payment_method_options' => [ 'card' => [ 'request_three_d_secure' => 'automatic' ] ],
					]
				)
			);

		$this->mock_order
			->expects( $this->exactly( 6 ) )
			->method( 'update_meta_data' )
			->withConsecutive(
				[ '_intent_id', $id ],
				[ '_charge_id', $charge_id ],
				[ '_payment_method_id', $payment_method_id ],
				[ WC_Payments_Utils::ORDER_INTENT_CURRENCY_META_KEY, $currency ],
				[ '_stripe_mandate_id', $mandate_id ],
				[ '_intention_status', $intent_status ]
			);

			$this->mock_order
				->method( 'get_total' )
				->willReturn( 15.00 );

		$this->mock_order
			->expects( $this->exactly( 2 ) )
			->method( 'save' );

		$this->mock_order
			->expects( $this->exactly( 2 ) )
			->method( 'has_status' )
			->with(
				[
					Order_Status::PROCESSING,
					Order_Status::COMPLETED,
				]
			)
			->willReturn( false );

		$this->mock_order
			->expects( $this->once() )
			->method( 'payment_complete' );

		$this->mock_order
			->method( 'get_data_store' )
			->willReturn( new \WC_Mock_WC_Data_Store() );

		$this->mock_order
			->method( 'get_meta' )
			->willReturn( '' );

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_intent_id' )
			->with( 'pi_123123123123123' )
			->willReturn( $this->mock_order );

		$this->mock_receipt_service
			->expects( $this->never() )
			->method( 'send_customer_ipp_receipt_email' );

		$this->mock_wcpay_gateway
			->expects( $this->never() )
			->method( 'get_option' );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Tests that a payment_intent.payment_failed event set order status to failed and adds a respective order note.
	 */
	public function test_payment_intent_fails_and_fails_order() {
		$this->event_body['type']           = 'payment_intent.payment_failed';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'                 => 'pi_123123123123123', // Payment_intent's ID.
			'object'             => 'payment_intent',
			'amount'             => 1500,
			'charges'            => [
				'data' => [
					[
						'id'                     => 'py_123123123123123',
						'payment_method'         => 'pm_123123123123123', // Payment method ID.
						'payment_method_details' => [
							'type' => 'us_bank_account',
						],
					],
				],
			],
			'last_payment_error' => [
				'message'        => 'error message',
				'payment_method' => [
					'id'   => 'pm_123123123123123',
					'type' => 'us_bank_account',
				],
			],
			'currency'           => 'usd',
			'status'             => Intent_Status::REQUIRES_PAYMENT_METHOD,
		];

		$this->mock_order
			->expects( $this->once() )
			->method( 'get_meta' )
			->with( '_payment_method_id' )
			->willReturn( 'pm_123123123123123' );

			$this->mock_order
				->method( 'get_total' )
				->willReturn( 15.00 );

		$this->mock_order
			->expects( $this->exactly( 3 ) )
			->method( 'has_status' )
			->withConsecutive(
				[ [ Order_Status::PROCESSING, Order_Status::COMPLETED ] ],
				[ [ Order_Status::PROCESSING, Order_Status::COMPLETED ] ],
				[ [ Order_Status::FAILED ] ]
			)
			->willReturn( false );

		$this->mock_order
			->expects( $this->once() )
			->method( 'add_order_note' )
			->with(
				$this->stringContains(
					'With the following message: <code>error message</code>'
				)
			);

		$this->mock_order
			->expects( $this->once() )
			->method( 'update_status' )
			->with( Order_Status::FAILED );

		$this->mock_order
			->method( 'get_data_store' )
			->willReturn( new \WC_Mock_WC_Data_Store() );

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_intent_id' )
			->with( 'pi_123123123123123' )
			->willReturn( $this->mock_order );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Tests that a payment_intent.payment_failed event without charges set order status to failed and adds a respective order note.
	 */
	public function test_payment_intent_without_charges_fails_and_fails_order() {
		$this->event_body['type']           = 'payment_intent.payment_failed';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'                 => 'pi_123123123123123', // Payment_intent's ID.
			'object'             => 'payment_intent',
			'amount'             => 1500,
			'charges'            => [],
			'last_payment_error' => [
				'code'           => 'card_declined',
				'decline_code'   => 'debit_notification_undelivered',
				'payment_method' => [
					'id'   => 'pm_123123123123123',
					'type' => 'us_bank_account',
				],
			],
			'currency'           => 'usd',
			'status'             => Intent_Status::REQUIRES_PAYMENT_METHOD,
		];

		$this->mock_order
			->expects( $this->once() )
			->method( 'get_meta' )
			->with( '_payment_method_id' )
			->willReturn( 'pm_123123123123123' );

			$this->mock_order
				->method( 'get_total' )
				->willReturn( 15.00 );

		$this->mock_order
			->expects( $this->exactly( 3 ) )
			->method( 'has_status' )
			->withConsecutive(
				[ [ Order_Status::PROCESSING, Order_Status::COMPLETED ] ],
				[ [ Order_Status::PROCESSING, Order_Status::COMPLETED ] ],
				[ [ Order_Status::FAILED ] ]
			)
			->willReturn( false );

		$this->mock_order
			->expects( $this->once() )
			->method( 'add_order_note' )
			->with(
				$this->stringContains(
					"The customer's bank could not send pre-debit notification for the payment"
				)
			);

		$this->mock_order
			->expects( $this->once() )
			->method( 'update_status' )
			->with( Order_Status::FAILED );

		$this->mock_order
			->method( 'get_data_store' )
			->willReturn( new \WC_Mock_WC_Data_Store() );

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_intent_id' )
			->with( 'pi_123123123123123' )
			->willReturn( $this->mock_order );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Tests that a dispute created event adds a respective order note.
	 */
	public function test_dispute_created_order_note() {
		// Setup test request data.
		$this->event_body['type']           = 'charge.dispute.created';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'               => 'test_dispute_id',
			'charge'           => 'test_charge_id',
			'reason'           => 'test_reason',
			'amount'           => 9900,
			'status'           => 'test_status',
			'evidence_details' => [
				'due_by' => 'test_due_by',
			],
		];

		$this->mock_order->method( 'get_currency' )->willReturn( 'USD' );

		$this->mock_order
			->expects( $this->once() )
			->method( 'add_order_note' )
			->with(
				$this->matchesRegularExpression(
					'/Payment has been disputed/'
				)
			);

		$this->mock_order
			->expects( $this->once() )
			->method( 'update_status' )
			->with( Order_Status::ON_HOLD );

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->with( 'test_charge_id' )
			->willReturn( $this->mock_order );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Tests that a dispute closed event adds a respective order note.
	 */
	public function test_dispute_closed_order_note() {
		// Setup test request data.
		$this->event_body['type']           = 'charge.dispute.closed';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'     => 'test_dispute_id',
			'charge' => 'test_charge_id',
			'status' => 'test_status',
		];

		$this->mock_order
			->expects( $this->once() )
			->method( 'add_order_note' )
			->with(
				$this->matchesRegularExpression(
					'/Dispute has been closed with status test_status/'
				)
			);

		$this->mock_order
			->expects( $this->once() )
			->method( 'update_status' )
			->with( Order_Status::COMPLETED );

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->with( 'test_charge_id' )
			->willReturn( $this->mock_order );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Tests that a dispute updated event adds a respective order note.
	 */
	public function test_dispute_updated_order_note() {
		// Setup test request data.
		$this->event_body['type']           = 'charge.dispute.updated';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'     => 'test_dispute_id',
			'charge' => 'test_charge_id',
		];

		$this->mock_order
			->expects( $this->once() )
			->method( 'add_order_note' )
			->with(
				$this->matchesRegularExpression(
					'/Payment dispute has been updated/'
				)
			);

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->with( 'test_charge_id' )
			->willReturn( $this->mock_order );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Tests that a dispute funds withdrawn event adds a respective order note.
	 */
	public function test_dispute_funds_withdrawn_order_note() {
		// Setup test request data.
		$this->event_body['type']           = 'charge.dispute.funds_withdrawn';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'     => 'test_dispute_id',
			'charge' => 'test_charge_id',
		];

		$this->mock_order
			->expects( $this->once() )
			->method( 'add_order_note' )
			->with(
				$this->matchesRegularExpression(
					'/Payment dispute and fees have been deducted from your next payout/'
				)
			);

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->with( 'test_charge_id' )
			->willReturn( $this->mock_order );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Tests that a dispute funds reinstated event adds a respective order note.
	 */
	public function test_dispute_funds_reinstated_order_note() {
		// Setup test request data.
		$this->event_body['type']           = 'charge.dispute.funds_reinstated';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'     => 'test_dispute_id',
			'charge' => 'test_charge_id',
		];

		$this->mock_order
			->expects( $this->once() )
			->method( 'add_order_note' )
			->with(
				$this->matchesRegularExpression(
					'/Payment dispute funds have been reinstated/'
				)
			);

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->with( 'test_charge_id' )
			->willReturn( $this->mock_order );

		// Run the test.
		$this->webhook_processing_service->process( $this->event_body );
	}

	public function test_process_full_refund_succeeded(): void {
		$this->event_body['type']           = 'charge.refunded';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'       => 'test_charge_id',
			'refunds'  => [
				'data' => [
					[
						'id'                  => 'test_refund_id',
						'status'              => Refund_Status::SUCCEEDED,
						'amount'              => 1800,
						'currency'            => 'usd',
						'reason'              => 'requested_by_customer',
						'balance_transaction' => 'txn_123',
					],
				],
			],
			'status'   => 'succeeded',
			'amount'   => 1800,
			'currency' => 'usd',
		];

		$this->mock_order
			->expects( $this->once() )
			->method( 'get_total' )
			->willReturn( 18 );

		$this->mock_order
			->expects( $this->once() )
			->method( 'get_items' )
			->willReturn( [] );

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->with( 'test_charge_id' )
			->willReturn( $this->mock_order );

		$this->order_service
			->expects( $this->never() )
			->method( 'get_wcpay_refund_id_for_order' );

		$mock_refund = $this->createMock( WC_Order_Refund::class );

		$this->order_service
			->expects( $this->once() )
			->method( 'create_refund_for_order' )
			->willReturn( $mock_refund );

		$this->order_service
			->expects( $this->once() )
			->method( 'add_note_and_metadata_for_created_refund' )
			->with( $this->mock_order, $mock_refund, 'test_refund_id', 'txn_123' );

		$this->webhook_processing_service->process( $this->event_body );
	}

	public function test_process_partial_refund_succeeded(): void {
		$this->event_body['type']           = 'charge.refunded';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'       => 'test_charge_id',
			'refunds'  => [
				'data' => [
					[
						'id'                  => 'test_refund_id',
						'status'              => Refund_Status::SUCCEEDED,
						'amount'              => 900,
						'currency'            => 'usd',
						'reason'              => 'requested_by_customer',
						'balance_transaction' => 'txn_123',
					],
				],
			],
			'status'   => 'succeeded',
			'amount'   => 1800,
			'currency' => 'usd',
		];

		$this->mock_order
			->expects( $this->once() )
			->method( 'get_total' )
			->willReturn( 18 );

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->with( 'test_charge_id' )
			->willReturn( $this->mock_order );

		$mock_refund = $this->createMock( WC_Order_Refund::class );

		$this->order_service
			->expects( $this->once() )
			->method( 'create_refund_for_order' )
			->willReturn( $mock_refund );

		$this->order_service
			->expects( $this->once() )
			->method( 'add_note_and_metadata_for_created_refund' )
			->with( $this->mock_order, $mock_refund, 'test_refund_id', 'txn_123' );

		$this->webhook_processing_service->process( $this->event_body );
	}

	public function test_process_refund_ignores_processed_event(): void {
		$this->event_body['type']           = 'charge.refunded';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'       => 'test_charge_id',
			'refunds'  => [
				'data' => [
					[
						'id'                  => 'test_refund_id',
						'amount'              => 1800,
						'currency'            => 'usd',
						'reason'              => 'requested_by_customer',
						'balance_transaction' => 'txn_123',
					],
				],
			],
			'status'   => 'succeeded',
			'amount'   => 1800,
			'currency' => 'usd',
		];

		$this->mock_order
			->expects( $this->never() )
			->method( 'get_total' );

		$this->mock_order
			->expects( $this->never() )
			->method( 'get_items' );

		$this->mock_order
			->expects( $this->once() )
			->method( 'get_refunds' )
			->willReturn(
				[
					$this->createMock( WC_Order_Refund::class ),
				]
			);

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->with( 'test_charge_id' )
			->willReturn( $this->mock_order );

		$this->order_service
			->expects( $this->once() )
			->method( 'get_wcpay_refund_id_for_order' )
			->willReturn( 'test_refund_id' );

		$this->order_service
			->expects( $this->never() )
			->method( 'create_refund_for_order' );

		$this->order_service
			->expects( $this->never() )
			->method( 'add_note_and_metadata_for_created_refund' );

		$this->webhook_processing_service->process( $this->event_body );
	}

	public function test_process_refund_ignores_event(): void {
		$this->event_body['type'] = 'charge.refunded.updated';

		$this->mock_db_wrapper
			->expects( $this->never() )
			->method( 'order_from_charge_id' );

		$this->order_service
			->expects( $this->never() )
			->method( 'add_note_and_metadata_for_created_refund' );

		$this->webhook_processing_service->process( $this->event_body );
	}

	public function test_process_refund_ignores_failed_refund_event(): void {
		$this->event_body['type']           = 'charge.refunded';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'       => 'test_charge_id',
			'refunds'  => [
				'data' => [
					[
						'id'       => 'test_refund_id',
						'amount'   => 1500,
						'currency' => 'usd',
						'reason'   => 'requested_by_customer',
					],
				],
			],
			'status'   => 'failed',
			'amount'   => 1800,
			'currency' => 'usd',
		];

		$this->mock_db_wrapper
			->expects( $this->never() )
			->method( 'order_from_charge_id' );

		$this->order_service
			->expects( $this->never() )
			->method( 'add_note_and_metadata_for_created_refund' );
	}

	public function test_process_refund_throws_when_order_not_found(): void {
		$this->event_body['type']           = 'charge.refunded';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'       => 'test_charge_id',
			'refunds'  => [
				'data' => [
					[
						'id'       => 'test_refund_id',
						'amount'   => 1500,
						'currency' => 'usd',
						'reason'   => 'requested_by_customer',
					],
				],
			],
			'status'   => 'succeeded',
			'amount'   => 1800,
			'currency' => 'usd',
		];

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->willReturn( false );

		$this->expectException( Order_Not_Found_Exception::class );

		$this->webhook_processing_service->process( $this->event_body );
	}

	public function test_process_refund_throws_with_negative_amount(): void {
		$this->event_body['type']           = 'charge.refunded';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'       => 'test_charge_id',
			'refunds'  => [
				'data' => [
					[
						'id'       => 'test_refund_id',
						'amount'   => 1500,
						'currency' => 'usd',
						'reason'   => 'requested_by_customer',
					],
				],
			],
			'status'   => 'succeeded',
			'amount'   => -1800,
			'currency' => 'usd',
		];

		$this->mock_order
			->expects( $this->never() )
			->method( 'get_total' );

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->willReturn( $this->mock_order );

		$this->expectException( Invalid_Webhook_Data_Exception::class );

		$this->webhook_processing_service->process( $this->event_body );
	}

	public function test_process_refund_throws_with_invalid_refunded_amount(): void {
		$this->event_body['type']           = 'charge.refunded';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'id'       => 'test_charge_id',
			'refunds'  => [
				'data' => [
					[
						'id'       => 'test_refund_id',
						'amount'   => 4200,
						'currency' => 'usd',
						'reason'   => 'requested_by_customer',
					],
				],
			],
			'status'   => 'succeeded',
			'amount'   => 1800,
			'currency' => 'usd',
		];

		$this->mock_order
			->expects( $this->once() )
			->method( 'get_total' )
			->willReturn( 18 );

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->willReturn( $this->mock_order );

		$this->expectException( Invalid_Webhook_Data_Exception::class );

		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * @dataProvider provider_mode_mismatch_detection
	 */
	public function test_mode_mismatch_detection( $livemode, $expectation ) {
		$note = [ 'abc1234' ];

		$this->event_body['type'] = 'wcpay.notification';
		$this->event_body['id']   = 'evt_XYZ';
		$this->event_body['data'] = $note;
		if ( ! is_null( $livemode ) ) {
			$this->event_body['livemode'] = $livemode;
		}

		$this->mock_remote_note_service->expects( $expectation )
			->method( 'put_note' )
			->with( $note );

		$this->webhook_processing_service->process( $this->event_body );
	}

	public function provider_mode_mismatch_detection() {
		return [
			'Live mode webhook is processed.' => [ true, $this->once() ],
			'Test mode is not processed.'     => [ false, $this->never() ],
			'No mode proceeds'                => [ null, $this->once() ],
		];
	}

	public function test_process_throws_exception_when_order_not_found_for_successful_intent_id() {
		$this->event_body['type']           = 'payment_intent.succeeded';
		$this->event_body['data']['object'] = [
			'id'       => 'unresolvable_intent_id',
			'currency' => 'usd',
			'metadata' => [],
			'charges'  => [
				'data' => [],
			],
		];

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_intent_id' )
			->with( 'unresolvable_intent_id' )
			->willReturn( null );

		$this->mock_order
			->expects( $this->never() )
			->method( 'save' );

		$this->expectException( WCPay\Exceptions\Invalid_Payment_Method_Exception::class );
		$this->expectExceptionMessage( 'Could not find order via intent ID: unresolvable_intent_id' );

		$this->webhook_processing_service->process( $this->event_body );
	}

	public function test_process_throws_exception_when_refund_found_for_successful_intent_id() {
		$mock_refund                        = $this->createMock( WC_Order_Refund::class );
		$this->event_body['type']           = 'payment_intent.succeeded';
		$this->event_body['data']['object'] = [
			'id'       => 'intent_id',
			'currency' => 'usd',
			'metadata' => [],
			'charges'  => [
				'data' => [],
			],
		];

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_intent_id' )
			->with( 'intent_id' )
			->willReturn( $mock_refund );

		$mock_refund
			->expects( $this->never() )
			->method( 'save' );

		$this->expectException( WCPay\Exceptions\Invalid_Payment_Method_Exception::class );
		$this->expectExceptionMessage( 'Could not find order via intent ID: intent_id' );

		$this->webhook_processing_service->process( $this->event_body );
	}

	public function test_payment_intent_failed_handles_terminal_payment() {
		$this->event_body = [
			'id'       => uniqid( 'evt_' ),
			'type'     => 'payment_intent.payment_failed',
			'livemode' => true,
			'data'     => [
				'object' => [
					'id'                 => 'pi_123',
					'status'             => 'requires_payment_method',
					'created'            => 1706745600,
					'charges'            => [
						'data' => [
							[
								'id'                     => 'ch_123',
								'created'                => 1706745600,
								'payment_method_details' => [ 'type' => 'card_present' ],
							],
						],
					],
					'last_payment_error' => [
						'message'        => 'Card declined',
						'payment_method' => [
							'id'   => 'pm_123',
							'type' => Payment_Method::CARD_PRESENT,
						],
					],
				],
			],
		];

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_intent_id' )
			->willReturn( $this->mock_order );

		$this->order_service
			->expects( $this->once() )
			->method( 'mark_terminal_payment_failed' )
			->with(
				$this->mock_order,
				'pi_123',
				'requires_payment_method',
				'ch_123',
				'With the following message: <code>Card declined</code>'
			);

		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * @dataProvider refund_failure_reason_data_provider
	 */
	public function test_process_webhook_refund_updated_handles_different_failure_reasons( string $failure_reason ): void {
		$this->event_body['type']           = 'charge.refund.updated';
		$this->event_body['livemode']       = true;
		$this->event_body['data']['object'] = [
			'status'         => 'failed',
			'charge'         => 'test_charge_id',
			'id'             => 'test_refund_id',
			'amount'         => 1999,
			'currency'       => 'usd',
			'failure_reason' => $failure_reason,
		];

		$this->mock_db_wrapper
			->expects( $this->once() )
			->method( 'order_from_charge_id' )
			->with( 'test_charge_id' )
			->willReturn( $this->mock_order );

		$this->order_service
			->expects( $this->once() )
			->method( 'handle_failed_refund' )
			->with(
				$this->mock_order,
				'test_refund_id',
				1999,
				'usd',
				null,
				false,
				$failure_reason
			);

		$this->webhook_processing_service->process( $this->event_body );
	}

	/**
	 * Data provider for refund failure reason tests.
	 *
	 * @return array
	 */
	public function refund_failure_reason_data_provider(): array {
		return [
			'insufficient_funds'  => [
				Refund_Failure_Reason::INSUFFICIENT_FUNDS,
				'Insufficient funds to process the refund',
			],
			'declined'            => [
				Refund_Failure_Reason::DECLINED,
				'The refund was declined',
			],
			'expired_card'        => [
				Refund_Failure_Reason::EXPIRED_OR_CANCELED_CARD,
				'The card used for the original payment has expired or been canceled',
			],
			'lost_or_stolen_card' => [
				Refund_Failure_Reason::LOST_OR_STOLEN_CARD,
				'The card used for the original payment was reported as lost or stolen',
			],
			'merchant_request'    => [
				Refund_Failure_Reason::MERCHANT_REQUEST,
				'The refund was canceled at your request',
			],
			'unknown'             => [
				Refund_Failure_Reason::UNKNOWN,
				'An unknown error occurred while processing the refund',
			],
		];
	}
}
