<?php
/**
 * Class WC_REST_Payments_Reader_Controller_Test
 *
 * @package PooCommerce\Payments\Tests
 */

use PHPUnit\Framework\MockObject\MockObject;
use WC_REST_Payments_Reader_Controller as Controller;
use WCPay\Core\Server\Request\Get_Charge;
use WCPay\Core\Server\Request\Get_Intention;
use WCPay\Constants\Intent_Status;
use WCPay\Core\Server\Request\Get_Request;
use WCPay\Exceptions\API_Exception;

require_once WCPAY_ABSPATH . 'includes/in-person-payments/class-wc-payments-printed-receipt-sample-order.php';

/**
 * WC_REST_Payments_Reader_Controller_Test unit tests.
 */
class WC_REST_Payments_Reader_Controller_Test extends WCPAY_UnitTestCase {
	/**
	 * Controller under test.
	 *
	 * @var WC_REST_Payments_Reader_Controller
	 */
	private $controller;

	/**
	 * @var WC_Payments_API_Client|MockObject
	 */
	private $mock_api_client;

	/**
	 * @var WC_Payment_Gateway_WCPay|MockObject
	 */
	private $mock_wcpay_gateway;

	/**
	 * @var WC_Payments_In_Person_Payments_Receipts_Service|MockObject
	 */
	private $mock_receipts_service;

	public function set_up() {
		parent::set_up();

		$this->mock_api_client       = $this->createMock( WC_Payments_API_Client::class );
		$this->mock_wcpay_gateway    = $this->createMock( WC_Payment_Gateway_WCPay::class );
		$this->mock_receipts_service = $this->createMock( WC_Payments_In_Person_Payments_Receipts_Service::class );
		$this->controller            = new WC_REST_Payments_Reader_Controller( $this->mock_api_client, $this->mock_wcpay_gateway, $this->mock_receipts_service );

		$this->reader = [
			'id'          => 'tmr_P400-123-456-789',
			'device_type' => 'verifone_P400',
			'label'       => 'Blue Rabbit',
			'livemode'    => false,
			'location'    => null,
			'metadata'    => [],
			'status'      => 'online',
			'is_active'   => true,
		];
	}

	/**
	 * Post test cleanup
	 */
	public function tear_down() {
		parent::tear_down();
		delete_transient( Controller::STORE_READERS_TRANSIENT_KEY );
	}

	public function test_get_summary_no_transaction() {
		$this->mock_api_client
			->expects( $this->once() )
			->method( 'get_transaction' )
			->willReturn( [] );

		$request = new WP_REST_Request( 'GET' );
		$request->set_param( 'transaction_id', 1 );

		$response = $this->controller->get_summary( $request );
		$this->assertSame( [], $response->get_data() );
	}

	public function test_get_summary_no_readers_charge_summary() {
		$this->mock_api_client
			->expects( $this->once() )
			->method( 'get_transaction' )
			->willReturn( [ 'created' => 1634291278 ] );

		$this->mock_api_client
			->expects( $this->once() )
			->method( 'get_readers_charge_summary' )
			->with( gmdate( 'Y-m-d', 1634291278 ) )
			->willReturn( [] );

		$request = new WP_REST_Request( 'GET' );
		$request->set_param( 'transaction_id', 1 );

		$response = $this->controller->get_summary( $request );
		$this->assertSame( [], $response->get_data() );
	}

	public function test_get_summary_error() {
		$this->mock_api_client
			->expects( $this->once() )
			->method( 'get_transaction' )
			->will( $this->throwException( new \WCPay\Exceptions\API_Exception( 'test exception', 'test', 0 ) ) );

		$request = new WP_REST_Request( 'GET' );
		$request->set_param( 'transaction_id', 1 );
		$response = $this->controller->get_summary( $request );

		$this->assertInstanceOf( 'WP_Error', $response );
	}

	public function test_get_summary() {
		$readers = [
			[
				'reader_id' => 1,
				'count'     => 3,
				'status'    => 'active',
				'fee'       => [
					'amount'   => 300,
					'currency' => 'usd',
				],
			],
			[
				'reader_id' => 2,
				'count'     => 1,
				'status'    => 'inactive',
				'fee'       => [
					'amount'   => 0,
					'currency' => 'usd',
				],
			],
		];

		$transaction_id = uniqid( 'trx_' );

		$this->mock_api_client
			->expects( $this->once() )
			->method( 'get_transaction' )
			->with( $transaction_id )
			->willReturn(
				[
					'created' => 1634291278,
					'id'      => $transaction_id,
				]
			);

		$this->mock_api_client
			->expects( $this->once() )
			->method( 'get_readers_charge_summary' )
			->with( gmdate( 'Y-m-d', 1634291278 ), $transaction_id )
			->willReturn( $readers );

		$request = new WP_REST_Request( 'GET' );
		$request->set_param( 'transaction_id', $transaction_id );
		$request->set_param( 'charge_date', gmdate( 'Y-m-d', 1634291278 ) );

		$response = $this->controller->get_summary( $request );
		$this->assertSame( $readers, $response->get_data() );
	}

	public function test_getting_all_readers_uses_cache_for_existing_readers() {
		set_transient( Controller::STORE_READERS_TRANSIENT_KEY, [ $this->reader ] );

		$this->mock_wcpay_request( Get_Request::class, 0 );

		$this->mock_api_client
			->expects( $this->never() )
			->method( 'get_readers_charge_summary' );

		// Setup the request.
		$request = new WP_REST_Request(
			'GET',
			'/wc/v3/payments/readers'
		);
		$request->set_header( 'Content-Type', 'application/json' );
		$result = $this->controller->get_all_readers( $request );

		$this->assertEquals( [ $this->reader ], $result->get_data() );
	}

	public function test_register_reader_succeeds() {
		$reader = [
			'id'                => 'tmr_P400-123-456-789',
			'object'            => 'terminal.reader',
			'device_sw_version' => null,
			'device_type'       => 'verifone_P400',
			'ip_address'        => '192.168.2.2',
			'label'             => 'Blue Rabbit',
			'livemode'          => false,
			'location'          => 'tml_1234',
			'metadata'          => [],
			'serial_number'     => '123-456-789',
			'status'            => 'online',
		];

		$this->mock_api_client
			->expects( $this->once() )
			->method( 'register_terminal_reader' )
			->with( 'tml_1234', 'puppies-plug-could', 'Blue Rabbit' )
			->willReturn( $reader );

		$request = new WP_REST_Request(
			'POST',
			'/wc/v3/payments/readers'
		);
		$request->set_body_params(
			[
				'location'          => 'tml_1234',
				'registration_code' => 'puppies-plug-could',
				'label'             => 'Blue Rabbit',
			]
		);
		$request->set_header( 'Content-Type', 'application/json' );

		$result = $this->controller->register_reader( $request );

		$this->assertSame(
			[
				'id'          => $reader['id'],
				'livemode'    => $reader['livemode'],
				'device_type' => $reader['device_type'],
				'label'       => $reader['label'],
				'location'    => $reader['location'],
				'metadata'    => $reader['metadata'],
				'status'      => $reader['status'],
			],
			$result->get_data()
		);
	}

	public function test_register_reader_handles_api_exception() {
		$this->mock_api_client
			->expects( $this->once() )
			->method( 'register_terminal_reader' )
			->with( 'tml_1234', 'puppies-plug-could' )
			->willThrowException( new API_Exception( 'Something bad happened', 'test error', 500 ) );

		$request = new WP_REST_Request(
			'POST',
			'/wc/v3/payments/readers'
		);
		$request->set_body_params(
			[
				'location'          => 'tml_1234',
				'registration_code' => 'puppies-plug-could',
			]
		);
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->controller->register_reader( $request );

		$this->assertInstanceOf( 'WP_Error', $response );
		$data = $response->get_error_data();
		$this->assertArrayHasKey( 'status', $data );
		$this->assertSame( 500, $data['status'] );
	}

	public function test_generate_print_receipt() {
		$order = WC_Helper_Order::create_order();

		$payment_intent = WC_Helper_Intention::create_intention();

		$charge = $this->mock_charge( $order->get_id() );

		$settings = $this->mock_settings();

		$receipt = 'receipt';

		$request = $this->mock_wcpay_request( Get_Intention::class, 1, 'pi_mock' );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $payment_intent );

		$charge_request = $this->mock_wcpay_request( Get_Charge::class, 1, 'ch_mock' );

		$charge_request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $charge );

		$this->mock_wcpay_gateway
			->expects( $this->exactly( 5 ) )
			->method( 'get_option' )
			->willReturnOnConsecutiveCalls( $settings['branding_logo'], $settings['business_name'], $settings['support_info']['address'], $settings['support_info']['phone'], $settings['support_info']['email'] );

		$this->mock_receipts_service
			->expects( $this->once() )
			->method( 'get_receipt_markup' )
			->with( $settings, $this->isInstanceOf( WC_Order::class ), $charge )
			->willReturn( $receipt );

		$request = new WP_REST_Request( 'GET' );
		$request->set_param( 'payment_intent_id', 'pi_mock' );

		$response = $this->controller->generate_print_receipt( $request );

		$this->assertArrayHasKey( 'html_content', $response->get_data() );
		$this->assertSame( $receipt, $response->get_data()['html_content'] );
		$this->assertSame( 200, $response->status );
	}

	public function test_preview_print_receipt(): void {
		$order = new WC_Payments_Printed_Receipt_Sample_Order();

		$this->assertEquals( WC_Payments_Printed_Receipt_Sample_Order::PREVIEW_RECEIPT_ORDER_DATA, $order->get_data() );

		$mock_receipt = '<p>Receipt</p>';
		$this->mock_wcpay_gateway
			->expects( $this->never() )
			->method( 'get_option' );

		$this->mock_receipts_service
			->expects( $this->once() )
			->method( 'get_receipt_markup' )
			->with(
				[
					'business_name' => 'Test',
					'support_info'  => [
						'phone'   => '424242',
						'email'   => 'some@example.com',
						'address' => [
							'line1'       => 'line1',
							'line2'       => 'line2',
							'city'        => 'city',
							'state'       => 'state',
							'postal_code' => 'postal_code',
							'country'     => 'country',
						],
					],
				],
				$order,
				$this->controller::PREVIEW_RECEIPT_CHARGE_DATA
			)
			->willReturn( $mock_receipt );

		$request = new WP_REST_Request( 'POST' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				[
					'accountBusinessName'           => 'Test',
					'accountBusinessSupportPhone'   => '424242',
					'accountBusinessSupportEmail'   => 'some@example.com',
					'accountBusinessSupportAddress' => [
						'line1'       => 'line1',
						'line2'       => 'line2',
						'city'        => 'city',
						'state'       => 'state',
						'postal_code' => 'postal_code',
						'country'     => 'country',
					],
				]
			)
		);

		$response      = $this->controller->preview_print_receipt( $request );
		$response_data = $response->get_data();

		$this->assertSame( 200, $response->status );
		$this->assertArrayHasKey( 'html_content', $response_data );
		$this->assertSame( $mock_receipt, $response_data['html_content'] );
	}

	public function test_preview_print_receipt_defaults_to_wcpay_settings(): void {
		$order = new WC_Payments_Printed_Receipt_Sample_Order();

		$settings     = $this->mock_settings();
		$mock_receipt = '<p>Receipt</p>';

		$this->mock_wcpay_gateway
			->expects( $this->exactly( 4 ) )
			->method( 'get_option' )
			->willReturnOnConsecutiveCalls(
				$settings['support_info']['address'],
				$settings['business_name'],
				$settings['support_info']['phone'],
				$settings['support_info']['email']
			);

		$this->mock_receipts_service
			->expects( $this->once() )
			->method( 'get_receipt_markup' )
			->with(
				[
					'business_name' => 'Test Business Name',
					'support_info'  => [
						'phone'   => '4242',
						'email'   => 'test@example.com',
						'address' => [
							'line1'       => 'line1',
							'line2'       => 'line2',
							'city'        => 'city',
							'state'       => 'state',
							'postal_code' => 'postal_code',
							'country'     => 'country',
						],
					],
				],
				$order,
				$this->controller::PREVIEW_RECEIPT_CHARGE_DATA
			)
			->willReturn( $mock_receipt );

		$request = new WP_REST_Request( 'POST' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				[
					'accountBusinessName'           => '',
					'accountBusinessSupportPhone'   => '',
					'accountBusinessSupportEmail'   => '',
					'accountBusinessSupportAddress' => [],
				]
			)
		);

		$response      = $this->controller->preview_print_receipt( $request );
		$response_data = $response->get_data();

		$this->assertSame( 200, $response->status );
		$this->assertArrayHasKey( 'html_content', $response_data );
		$this->assertSame( $mock_receipt, $response_data['html_content'] );
	}

	public function test_generate_print_receipt_invalid_payment_error(): void {
		$request = $this->mock_wcpay_request( Get_Intention::class, 1, 'pi_mock' );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( WC_Helper_Intention::create_intention( [ 'status' => Intent_Status::PROCESSING ] ) );

		$charge_request = $this->mock_wcpay_request( Get_Charge::class, 0, 'ch_mock' );
		$this->mock_wcpay_gateway
			->expects( $this->never() )
			->method( 'get_option' );

		$this->mock_receipts_service
			->expects( $this->never() )
			->method( 'get_receipt_markup' );

		$request = new WP_REST_Request( 'GET' );
		$request->set_param( 'payment_intent_id', 'pi_mock' );

		$response = $this->controller->generate_print_receipt( $request );

		$this->assertInstanceOf( 'WP_Error', $response );
		$data = $response->get_error_data();
		$this->assertArrayHasKey( 'status', $data );
		$this->assertSame( 500, $data['status'] );
	}

	public function test_generate_print_receipt_handle_api_exceptions(): void {

		$request = $this->mock_wcpay_request( Get_Intention::class, 1, 'pi_mock' );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willThrowException( new API_Exception( 'Something bad happened', 'test error', 500 ) );

		$charge_request = $this->mock_wcpay_request( Get_Charge::class, 0, 'ch_mock' );

		$this->mock_wcpay_gateway
			->expects( $this->never() )
			->method( 'get_option' );

		$this->mock_receipts_service
			->expects( $this->never() )
			->method( 'get_receipt_markup' );

		$request = new WP_REST_Request( 'GET' );
		$request->set_param( 'payment_intent_id', 'pi_mock' );

		$response = $this->controller->generate_print_receipt( $request );

		$this->assertInstanceOf( 'WP_Error', $response );
		$data = $response->get_error_data();
		$this->assertArrayHasKey( 'status', $data );
		$this->assertSame( 500, $data['status'] );
	}

	public function test_generate_print_receipt_order_not_found(): void {
		$payment_intent = WC_Helper_Intention::create_intention();

		$charge = $this->mock_charge( '42' );

		$request = $this->mock_wcpay_request( Get_Intention::class, 1, 'pi_mock' );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $payment_intent );

		$charge_request = $this->mock_wcpay_request( Get_Charge::class, 1, 'ch_mock' );

		$charge_request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $charge );

		$this->mock_wcpay_gateway
			->expects( $this->never() )
			->method( 'get_option' );

		$this->mock_receipts_service
			->expects( $this->never() )
			->method( 'get_receipt_markup' );

		$request = new WP_REST_Request( 'GET' );
		$request->set_param( 'payment_intent_id', 'pi_mock' );

		$response = $this->controller->generate_print_receipt( $request );

		$this->assertInstanceOf( 'WP_Error', $response );
		$data = $response->get_error_data();
		$this->assertArrayHasKey( 'status', $data );
		$this->assertSame( 500, $data['status'] );
	}

	public function test_generate_print_receipt_handle_settings_exception(): void {
		$order = WC_Helper_Order::create_order();

		$payment_intent = WC_Helper_Intention::create_intention();

		$charge = $this->mock_charge( $order->get_id() );

		$request = $this->mock_wcpay_request( Get_Intention::class, 1, 'pi_mock' );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $payment_intent );

		$charge_request = $this->mock_wcpay_request( Get_Charge::class, 1, 'ch_mock' );

		$charge_request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $charge );

		$this->mock_wcpay_gateway
			->expects( $this->exactly( 1 ) )
			->method( 'get_option' )
			->willThrowException( new Exception( 'Something bad' ) );

		$this->mock_receipts_service
			->expects( $this->never() )
			->method( 'get_receipt_markup' );

		$request = new WP_REST_Request( 'GET' );
		$request->set_param( 'payment_intent_id', 'pi_mock' );

		$response = $this->controller->generate_print_receipt( $request );

		$this->assertInstanceOf( 'WP_Error', $response );
		$data = $response->get_error_data();
		$this->assertArrayHasKey( 'status', $data );
		$this->assertSame( 500, $data['status'] );
	}

	public function test_generate_print_receipt_handle_receipt_service_exception() {
		$order = WC_Helper_Order::create_order();

		$payment_intent = WC_Helper_Intention::create_intention();

		$charge = $this->mock_charge( $order->get_id() );

		$settings = $this->mock_settings();

		$request = $this->mock_wcpay_request( Get_Intention::class, 1, 'pi_mock' );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $payment_intent );

		$charge_request = $this->mock_wcpay_request( Get_Charge::class, 1, 'ch_mock' );

		$charge_request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $charge );

		$this->mock_wcpay_gateway
			->expects( $this->exactly( 5 ) )
			->method( 'get_option' )
			->willReturnOnConsecutiveCalls( $settings['branding_logo'], $settings['business_name'], $settings['support_info']['address'], $settings['support_info']['phone'], $settings['support_info']['email'] );

		$this->mock_receipts_service
			->expects( $this->once() )
			->method( 'get_receipt_markup' )
			->with( $settings, $this->isInstanceOf( WC_Order::class ), $charge )
			->willThrowException( new Exception( 'Something bad' ) );

		$request = new WP_REST_Request( 'GET' );
		$request->set_param( 'payment_intent_id', 'pi_mock' );

		$response = $this->controller->generate_print_receipt( $request );

		$this->assertInstanceOf( 'WP_Error', $response );
		$data = $response->get_error_data();
		$this->assertArrayHasKey( 'status', $data );
		$this->assertSame( 500, $data['status'] );
	}

	private function mock_charge( string $order_id ): array {
		return [
			'amount_captured'        => 10,
			'order'                  => [
				'number' => $order_id,
			],
			'payment_method_details' => [
				'card_present' => [
					'brand'   => 'test',
					'last4'   => 'Test',
					'receipt' => [
						'application_preferred_name' => 'Test',
						'dedicated_file_name'        => 'Test 42',
						'account_type'               => 'test',
					],
				],
			],
		];
	}

	private function mock_settings(): array {
		return [
			'branding_logo' => [],
			'business_name' => 'Test Business Name',
			'support_info'  => [
				'address' => [
					'line1'       => 'line1',
					'line2'       => 'line2',
					'city'        => 'city',
					'state'       => 'state',
					'postal_code' => 'postal_code',
					'country'     => 'country',
				],
				'phone'   => '4242',
				'email'   => 'test@example.com',
			],
		];
	}
}
