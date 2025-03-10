<?php
/**
 * Class Get_Setup_Intention_Test
 *
 * @package PooCommerce\Payments\Tests
 */

use PHPUnit\Framework\MockObject\MockObject;
use WCPay\Core\Exceptions\Server\Request\Invalid_Request_Parameter_Exception;
use WCPay\Core\Server\Request\Get_Setup_Intention;

/**
 * WCPay\Core\Server\Get_Intention_Test unit tests.
 */
class Get_Setup_Intention_Test extends WCPAY_UnitTestCase {

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


	public function test_exception_will_throw_if_payment_setup_intent_is_invalid() {
		$this->expectException( Invalid_Request_Parameter_Exception::class );
		$request = new Get_Setup_Intention( $this->mock_api_client, $this->mock_wc_payments_http_client, '1' );
	}
	public function test_get_payment_setup_intent_request_will_be_created() {
		$request = new Get_Setup_Intention( $this->mock_api_client, $this->mock_wc_payments_http_client, 'seti_1' );
		$this->assertSame( WC_Payments_API_Client::SETUP_INTENTS_API . '/seti_1', $request->get_api() );
	}
}
