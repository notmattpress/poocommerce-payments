<?php
/**
 * Class Cancel_Intention_Test
 *
 * @package PooCommerce\Payments\Tests
 */

use PHPUnit\Framework\MockObject\MockObject;
use WCPay\Core\Exceptions\Server\Request\Invalid_Request_Parameter_Exception;
use WCPay\Core\Server\Request\Cancel_Intention;

/**
 * WCPay\Core\Server\Capture_Intention_Test unit tests.
 */
class Cancel_Intention_Test extends WCPAY_UnitTestCase {

	/**
	 * Mock WC_Payments_API_Client.
	 *
	 * @var WC_Payments_API_Client|MockObject
	 */
	private $mock_api_client;
	/**
	 * Mock WC_Payments_API_Client.
	 *
	 * @var WC_Payments_Http_Interface|MockObject
	 */
	private $mock_wc_payments_http_client;


	/**
	 * Set up the unit tests objects.
	 *
	 * @return void
	 */
	public function set_up() {
		parent::set_up();

		$this->mock_api_client              = $this->createMock( WC_Payments_API_Client::class );
		$this->mock_wc_payments_http_client = $this->createMock( WC_Payments_Http_Interface::class );
	}

	public function test_exception_will_throw_if_intent_is_invalid() {
		$this->expectException( Invalid_Request_Parameter_Exception::class );
		$request = new Cancel_Intention( $this->mock_api_client, $this->mock_wc_payments_http_client, '1' );
	}

	public function test_capture_intent_request_will_be_created() {
		$intent_id = 'pi_1';

		$request = new Cancel_Intention( $this->mock_api_client, $this->mock_wc_payments_http_client, $intent_id );

		$this->assertSame( 'POST', $request->get_method() );
		$this->assertSame( WC_Payments_API_Client::INTENTIONS_API . '/' . $intent_id . '/cancel', $request->get_api() );
	}
}
