<?php
/**
 * Class WC_REST_Payments_Tos_Controller_Test
 *
 * @package PooCommerce\Payments\Tests
 */

use PHPUnit\Framework\MockObject\MockObject;
use WCPay\Compatibility_Service;
use WCPay\Core\Server\Request\Add_Account_Tos_Agreement;
use WCPay\Database_Cache;
use WCPay\Duplicate_Payment_Prevention_Service;
use WCPay\Duplicates_Detection_Service;
use WCPay\Payment_Methods\CC_Payment_Method;
use WCPay\Session_Rate_Limiter;

/**
 * WC_REST_Payments_Tos_Controller unit tests.
 */
class WC_REST_Payments_Tos_Controller_Test extends WCPAY_UnitTestCase {

	/**
	 * The system under test.
	 *
	 * @var WC_REST_Payments_Tos_Controller
	 */
	private $controller;

	/**
	 * Gateway.
	 *
	 * @var WC_Payment_Gateway_WCPay
	 */
	private $gateway;


	/**
	 * @var WP_REST_Request
	 */
	private $request;

	/**
	 * Pre-test setup
	 */
	public function set_up() {
		parent::set_up();

		// Set the user so that we can pass the authentication.
		wp_set_current_user( 1 );

		/** @var WC_Payments_API_Client|MockObject $mock_api_client */
		$mock_api_client = $this->getMockBuilder( WC_Payments_API_Client::class )
			->disableOriginalConstructor()
			->getMock();

		$mock_rate_limiter = $this->getMockBuilder( Session_Rate_Limiter::class )
			->disableOriginalConstructor()
			->getMock();

		$mock_wcpay_account                = $this->createMock( WC_Payments_Account::class );
		$mock_fraud_service                = $this->createMock( WC_Payments_Fraud_Service::class );
		$mock_db_cache                     = $this->createMock( Database_Cache::class );
		$mock_session_service              = $this->createMock( WC_Payments_Session_Service::class );
		$order_service                     = new WC_Payments_Order_Service( $this->createMock( WC_Payments_API_Client::class ) );
		$customer_service                  = new WC_Payments_Customer_Service( $mock_api_client, $mock_wcpay_account, $mock_db_cache, $mock_session_service, $order_service );
		$token_service                     = new WC_Payments_Token_Service( $mock_api_client, $customer_service );
		$mock_compatibility_service        = $this->createMock( Compatibility_Service::class );
		$action_scheduler_service          = new WC_Payments_Action_Scheduler_Service( $mock_api_client, $order_service, $mock_compatibility_service );
		$mock_dpps                         = $this->createMock( Duplicate_Payment_Prevention_Service::class );
		$mock_payment_method               = $this->createMock( CC_Payment_Method::class );
		$mock_duplicates_detection_service = $this->createMock( Duplicates_Detection_Service::class );

		$this->gateway    = new WC_Payment_Gateway_WCPay(
			$mock_api_client,
			$mock_wcpay_account,
			$customer_service,
			$token_service,
			$action_scheduler_service,
			$mock_payment_method,
			[ 'card' => $mock_payment_method ],
			$order_service,
			$mock_dpps,
			$this->createMock( WC_Payments_Localization_Service::class ),
			$mock_fraud_service,
			$mock_duplicates_detection_service,
			$mock_rate_limiter
		);
		$this->controller = new WC_REST_Payments_Tos_Controller( $mock_api_client, $this->gateway, $mock_wcpay_account );

		// Setup a test request.
		$this->request = new WP_REST_Request(
			'POST',
			'/wc/v3/payments/tos'
		);

		$this->request->set_header( 'Content-Type', 'application/json' );
	}

	public function test_gateway_disabled_on_tos_declined() {
		$this->gateway->enable();
		$this->request->set_body( wp_json_encode( [ 'accept' => false ] ) );

		// Run the test.
		$response = $this->controller->handle_tos( $this->request );

		// Check the response.
		$response_data = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( [ 'result' => 'success' ], $response_data );
		$this->assertEquals( 'no', $this->gateway->get_option( 'enabled' ) );
	}

	public function test_gateway_enabled_on_tos_accepted() {
		$this->gateway->disable();
		$this->request->set_body( wp_json_encode( [ 'accept' => true ] ) );
		$this->mock_wcpay_request( Add_Account_Tos_Agreement::class, 1 );

		// Run the test.
		$response = $this->controller->handle_tos( $this->request );

		// Check the response.
		$response_data = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( [ 'result' => 'success' ], $response_data );
		$this->assertEquals( 'yes', $this->gateway->get_option( 'enabled' ) );
	}

	public function test_accept_argument_is_required() {
		$this->request->set_body( wp_json_encode( [ 'key' => 'value' ] ) );

		// Run the test.
		$response = $this->controller->handle_tos( $this->request );

		// Check the response.
		$response_data = $response->get_data();

		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( [ 'result' => 'bad_request' ], $response_data );
	}

	public function test_remove_stripe_connect_track_should_delete_option() {
		add_option( '_wcpay_onboarding_stripe_connected', [ 'props' => true ] );

		// Run the test.
		$this->controller->remove_stripe_connect_track( $this->request );

		$this->assertFalse( get_option( '_wcpay_onboarding_stripe_connected', false ) );
	}
}
