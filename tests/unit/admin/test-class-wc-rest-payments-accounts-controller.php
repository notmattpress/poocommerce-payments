<?php
/**
 * Class WC_REST_Payments_Accounts_Controller_Test
 *
 * @package PooCommerce\Payments\Tests
 */

use PHPUnit\Framework\MockObject\MockObject;
use WCPay\Constants\Country_Code;
use WCPay\Core\Server\Request\Get_Account;
use WCPay\Core\Server\Response;
use WCPay\Exceptions\API_Exception;

/**
 * WC_REST_Payments_Accounts_Controller unit tests.
 */
class WC_REST_Payments_Accounts_Controller_Test extends WCPAY_UnitTestCase {
	/**
	 * Controller under test.
	 *
	 * @var WC_REST_Payments_Accounts_Controller
	 */
	private $controller;

	/**
	 * @var WC_Payments_API_Client|MockObject
	 */
	private $mock_api_client;

	/**
	 * @var WC_Payments_API_Client
	 */
	private $original_api_client;

	public function set_up() {
		parent::set_up();

		// Set the user so that we can pass the authentication.
		wp_set_current_user( 1 );
		WC_Payments::mode()->test();

		$this->mock_api_client = $this->createMock( WC_Payments_API_Client::class );
		$this->controller      = new WC_REST_Payments_Accounts_Controller( $this->mock_api_client );

		// Inject the mocked client into service (happens in WCPay int, so reflection here).
		$account_service     = WC_Payments::get_account_service();
		$property_reflection = ( new ReflectionClass( $account_service ) )->getProperty( 'payments_api_client' );
		$property_reflection->setAccessible( true );
		$this->original_api_client = $property_reflection->getValue( $account_service );
		$property_reflection->setValue( $account_service, $this->mock_api_client );

		// Clear the account cache before each test.
		$account_service->clear_cache();
	}

	public function tear_down() {
		parent::tear_down();

		WC_Payments::mode()->live();
		WC_Payments::get_gateway()->update_option( 'test_mode', 'no' );

		// Restore the original client.
		$account_service     = WC_Payments::get_account_service();
		$property_reflection = ( new ReflectionClass( $account_service ) )->getProperty( 'payments_api_client' );
		$property_reflection->setAccessible( true );
		$property_reflection->setValue( $account_service, $this->original_api_client );
	}

	public function test_get_account_data_with_connected_account() {
		$this->mock_api_client
			->expects( $this->atLeastOnce() )
			->method( 'is_server_connected' )
			->willReturn( true );

		$this->mock_wcpay_request( Get_Account::class )
			->expects( $this->once() )
			->method( 'format_response' )
			->willReturn(
				// We are providing only some of fields, needed for the assertions we are relying to.
				new Response(
					[
						'is_live'          => true,
						'country'          => Country_Code::GERMANY,
						'status'           => 'complete',
						'store_currencies' => [ 'default' => 'EUR' ],
					]
				)
			);

		$response      = $this->controller->get_account_data( new WP_REST_Request( 'GET' ) );
		$response_data = $response->get_data();

		$this->assertSame( 200, $response->status );
		$this->assertTrue( $response_data['test_mode'] );
		$this->assertSame( 'complete', $response_data['status'] );
		$this->assertSame( Country_Code::GERMANY, $response_data['country'] );
		$this->assertSame( 'EUR', $response_data['store_currencies']['default'] );
	}

	public function test_get_account_data_without_connected_account_and_enabled_onboarding() {
		$this->mock_api_client
			->expects( $this->atLeastOnce() )
			->method( 'is_server_connected' )
			->willReturn( true );

		$this->mock_wcpay_request( Get_Account::class )
			->expects( $this->once() )
			->method( 'format_response' )
			->willReturn(
				// Indicates that server connection is ok, but no connected accounts available.
				new Response( [] )
			);

		$response      = $this->controller->get_account_data( new WP_REST_Request( 'GET' ) );
		$response_data = $response->get_data();

		$this->assertSame( 200, $response->status );
		$this->assertTrue( $response_data['test_mode'] );
		$this->assertSame( 'NOACCOUNT', $response_data['status'] );
		// The default country and currency have changed in WC 5.3, hence multiple options in assertions.
		$this->assertContains( $response_data['country'], [ Country_Code::UNITED_STATES, Country_Code::UNITED_KINGDOM ] );
		$this->assertContains( $response_data['store_currencies']['default'], [ 'USD', 'GBP' ] );
	}

	public function test_get_account_data_without_connected_account_and_disabled_onboarding() {
		$this->mock_api_client
			->expects( $this->atLeastOnce() )
			->method( 'is_server_connected' )
			->willReturn( true );

		$this->mock_wcpay_request( Get_Account::class )
			->expects( $this->once() )
			->method( 'format_response' )
			->willThrowException(
				new API_Exception( 'On-boarding unavailable.', 'wcpay_on_boarding_disabled', 401 )
			);

		$response      = $this->controller->get_account_data( new WP_REST_Request( 'GET' ) );
		$response_data = $response->get_data();

		$this->assertSame( 200, $response->status );
		$this->assertTrue( $response_data['test_mode'] );
		$this->assertSame( 'ONBOARDING_DISABLED', $response_data['status'] );
		// The default country and currency have changed in WC 5.3, hence multiple options in assertions.
		$this->assertContains( $response_data['country'], [ Country_Code::UNITED_STATES, Country_Code::UNITED_KINGDOM ] );
		$this->assertContains( $response_data['store_currencies']['default'], [ 'USD', 'GBP' ] );
	}

	public function test_get_account_data_with_card_eligible_present_true() {
		$this->mock_api_client
			->expects( $this->atLeastOnce() )
			->method( 'is_server_connected' )
			->willReturn( true );

		$this->mock_wcpay_request( Get_Account::class )
			->expects( $this->once() )
			->method( 'format_response' )
			->willReturn(
				new Response(
					[
						'is_live'               => true,
						'card_present_eligible' => true,
					]
				)
			);

		$response      = $this->controller->get_account_data( new WP_REST_Request( 'GET' ) );
		$response_data = $response->get_data();

		$this->assertSame( 200, $response->status );
		$this->assertTrue( $response_data['test_mode'] );
		$this->assertFalse( $response_data['card_present_eligible'] );
	}
}
