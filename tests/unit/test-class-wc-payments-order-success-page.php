<?php
/**
 * Class WC_Payments_Order_Success_Page_Test
 *
 * @package PooCommerce\Payments\Tests
 */

use WCPay\Payment_Methods\UPE_Payment_Method;

/**
 * WC_Payments_Order_Success_Page unit tests.
 */
class WC_Payments_Order_Success_Page_Test extends WCPAY_UnitTestCase {
	/**
	 * WC_Payments_Order_Success_Page Instance.
	 *
	 * @var WC_Payments_Order_Success_Page
	 */
	private $payments_order_success_page;

	public function set_up() {
		parent::set_up();

		$this->payments_order_success_page = new WC_Payments_Order_Success_Page();
	}

	public function test_show_card_payment_method_name_without_card_brand() {
		$order = WC_Helper_Order::create_order();
		$order->set_payment_method( 'poocommerce_payments' );
		$order->save();

		$payment_method = $this->getMockBuilder( '\WCPay\Payment_Methods\UPE_Payment_Method' )
			->disableOriginalConstructor()
			->getMock();
		$payment_method->method( 'get_title' )->willReturn( 'Credit Card' );

		$result = $this->payments_order_success_page->show_card_payment_method_name( $order, $payment_method );

		$this->assertEquals( 'Credit Card', $result );
	}

	public function test_show_card_payment_method_name_with_brand_and_last4() {
		$order = WC_Helper_Order::create_order();
		$order->add_meta_data( '_card_brand', 'visa' );
		$order->add_meta_data( 'last4', '4242' );
		$order->set_payment_method( 'poocommerce_payments' );
		$order->save();

		$payment_method = $this->getMockBuilder( '\WCPay\Payment_Methods\UPE_Payment_Method' )
			->disableOriginalConstructor()
			->getMock();
		$payment_method->method( 'get_title' )->willReturn( 'Credit Card' );

		$result = $this->payments_order_success_page->show_card_payment_method_name( $order, $payment_method );

		$this->assertStringContainsString( 'wc-payment-gateway-method-logo-wrapper wc-payment-card-logo', $result );
		$this->assertStringContainsString( 'img alt="Credit Card"', $result );
		$this->assertStringContainsString( 'visa.svg', $result );
		$this->assertStringContainsString( '4242', $result );
	}

	public function test_show_card_payment_method_name_with_brand_only() {
		$order = WC_Helper_Order::create_order();
		$order->add_meta_data( '_card_brand', 'mastercard' );
		$order->set_payment_method( 'poocommerce_payments' );
		$order->save();

		$payment_method = $this->getMockBuilder( '\WCPay\Payment_Methods\UPE_Payment_Method' )
			->disableOriginalConstructor()
			->getMock();
		$payment_method->method( 'get_title' )->willReturn( 'Credit Card' );

		$result = $this->payments_order_success_page->show_card_payment_method_name( $order, $payment_method );

		$this->assertStringContainsString( 'wc-payment-gateway-method-logo-wrapper wc-payment-card-logo', $result );
		$this->assertStringContainsString( 'img alt="Credit Card"', $result );
		$this->assertStringContainsString( 'mastercard.svg', $result );
		$this->assertStringNotContainsString( '•••', $result );
	}

	public function test_show_woopay_payment_method_name_empty_order() {
		$method_name = 'Credit card';
		$result      = $this->payments_order_success_page->show_poocommerce_payments_payment_method_name( $method_name, null );

		$this->assertSame( $method_name, $result );
	}

	public function test_show_woopay_payment_method_name_without_woopay_meta() {
		$order = WC_Helper_Order::create_order();
		$order->save();

		$method_name = 'Credit card';
		$result      = $this->payments_order_success_page->show_poocommerce_payments_payment_method_name( $method_name, $order );

		$this->assertSame( $method_name, $result );
	}

	public function test_show_lpm_payment_method_name() {
		$gateway = $this->createMock( WC_Payment_Gateway_WCPay::class );
		$gateway->method( 'get_account_country' )->willReturn( 'SG' );

		$payment_method = $this->createMock( UPE_Payment_Method::class );
		$payment_method->method( 'get_title' )->willReturn( 'GrabPay' );
		$payment_method->method( 'get_id' )->willReturn( 'grabpay' );
		$payment_method->method( 'get_payment_method_icon_for_location' )->willReturn( '/grabpay.svg' );

		$result = $this->payments_order_success_page->show_lpm_payment_method_name( $gateway, $payment_method );

		$this->assertStringContainsString( 'wc-payment-gateway-method-logo-wrapper', $result );
		$this->assertStringContainsString( 'alt="GrabPay"', $result );
		$this->assertStringContainsString( 'title="GrabPay"', $result );
		$this->assertStringContainsString( 'src="/grabpay.svg"', $result );
	}

	public function test_show_lpm_payment_method_name_icon_not_found() {
		$gateway = $this->createMock( WC_Payment_Gateway_WCPay::class );
		$gateway->method( 'get_account_country' )->willReturn( 'SG' );

		$payment_method = $this->createMock( UPE_Payment_Method::class );
		$payment_method->method( 'get_title' )->willReturn( 'GrabPay' );
		$payment_method->method( 'get_id' )->willReturn( 'grabpay' );
		$payment_method->method( 'get_payment_method_icon_for_location' )->willReturn( '' );

		$result = $this->payments_order_success_page->show_lpm_payment_method_name( $gateway, $payment_method, true );

		$this->assertFalse( $result );
	}
}
