<?php
/**
 * Class Order_Fraud_And_Risk_Meta_Box_Test
 *
 * @package PooCommerce\Payments\Tests
 */

use WCPay\Constants\Fraud_Meta_Box_Type;
use WCPay\Fraud_Prevention\Order_Fraud_And_Risk_Meta_Box;

/**
 * Fraud_Prevention_Service_Test unit tests.
 */
class Order_Fraud_And_Risk_Meta_Box_Test extends WCPAY_UnitTestCase {
	/**
	 * Test WC_Order object.
	 *
	 * @var WC_Order
	 */
	private $order;

	/**
	 * Order_Fraud_And_Risk_Meta_Box object.
	 *
	 * @var Order_Fraud_And_Risk_Meta_Box
	 */
	private $order_fraud_and_risk_meta_box;

	/**
	 * WC_Payments_Order_Service mock object.
	 *
	 * @var PHPUnit_Framework_MockObject_MockObject|WC_Payments_Order_Service
	 */
	private $mock_order_service;

	public function set_up() {
		parent::set_up();

		// Create the mock Order Service and the Fraud and Risk meta box objects.
		$this->mock_order_service            = $this->createMock( WC_Payments_Order_Service::class );
		$this->order_fraud_and_risk_meta_box = new Order_Fraud_And_Risk_Meta_Box( $this->mock_order_service );
		$this->order_fraud_and_risk_meta_box->init_hooks();

		// Create the mock order and set the gateway.
		$this->order = WC_Helper_Order::create_order();
		$this->order->set_payment_method( 'poocommerce_payments' );
		$this->order->save();
	}

	public function test_registers_action_properly() {
		$this->assertNotFalse( has_action( 'add_meta_boxes', [ $this->order_fraud_and_risk_meta_box, 'maybe_add_meta_box' ] ) );
	}

	/**
	 * @dataProvider display_order_fraud_and_risk_meta_box_message_provider
	 */
	public function test_display_order_fraud_and_risk_meta_box_message_with_provider( $meta_box_type, $expected_output ) {
		// Arrange: Set the return results for the order service methods.
		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_intent_id_for_order' )
			->willReturn( 'pi_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_id_for_order' )
			->willReturn( 'ch_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_fraud_meta_box_type_for_order' )
			->willReturn( $meta_box_type );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_risk_level_for_order' )
			->willReturn( '' );

		// Act: Call the method to display the meta box.
		$this->order_fraud_and_risk_meta_box->display_order_fraud_and_risk_meta_box_message( $this->order );

		// Assert: Check to make sure the expected string has been output.
		$this->expectOutputString( $this->compose_fraud_and_risk_actions_block( $expected_output ) );
	}

	public function display_order_fraud_and_risk_meta_box_message_provider() {
		return [
			'Fraud_Meta_Box_Type_ALLOW'            => [
				'meta_box_type'   => Fraud_Meta_Box_Type::ALLOW,
				'expected_output' => '<p class="wcpay-fraud-risk-meta-allow"><img src="' . plugins_url( 'assets/images/icons/check-green.svg', WCPAY_PLUGIN_FILE ) . '" alt="Green check mark"> No action taken</p><p>The payment for this order passed your risk filtering.</p>',
			],
			'Fraud_Meta_Box_Type_PAYMENT_STARTED'  => [
				'meta_box_type'   => Fraud_Meta_Box_Type::PAYMENT_STARTED,
				'expected_output' => '<p class="wcpay-fraud-risk-meta-review"><img src="' . plugins_url( 'assets/images/icons/shield-stroke-orange.svg', WCPAY_PLUGIN_FILE ) . '" alt="Orange shield outline"> No action taken</p><p>The payment for this order has not yet been passed to the fraud and risk filters to determine its outcome status.</p>',
			],
			'Fraud_Meta_Box_Type_REVIEW'           => [
				'meta_box_type'   => Fraud_Meta_Box_Type::REVIEW,
				'expected_output' => '<p class="wcpay-fraud-risk-meta-review"><img src="' . plugins_url( 'assets/images/icons/shield-stroke-orange.svg', WCPAY_PLUGIN_FILE ) . '" alt="Orange shield outline"> Held for review</p><p>The payment for this order was held for review by your risk filtering. You can review the details and determine whether to approve or block the payment.</p><p><a href="http://example.org/wp-admin/admin.php?page=wc-admin&#038;path=/payments/transactions/details&#038;id=pi_mock&#038;status_is=review&#038;type_is=meta_box" target="_blank" rel="noopener noreferrer">Review payment</a></p>',
			],
			'Fraud_Meta_Box_Type_REVIEW_ALLOWED'   => [
				'meta_box_type'   => Fraud_Meta_Box_Type::REVIEW_ALLOWED,
				'expected_output' => '<p class="wcpay-fraud-risk-meta-allow"><img src="' . plugins_url( 'assets/images/icons/check-green.svg', WCPAY_PLUGIN_FILE ) . '" alt="Green check mark"> Approved</p><p>The payment for this order was held for review by your risk filtering and manually approved.</p>',
			],
			'Fraud_Meta_Box_Type_REVIEW_BLOCKED'   => [
				'meta_box_type'   => Fraud_Meta_Box_Type::REVIEW_BLOCKED,
				'expected_output' => '<p class="wcpay-fraud-risk-meta-blocked"><img src="' . plugins_url( 'assets/images/icons/shield-stroke-red.svg', WCPAY_PLUGIN_FILE ) . '" alt="Orange shield outline"> Held for review</p><p>This transaction was held for review by your risk filters, and the charge was manually blocked after review.</p><p><a href="http://example.org/wp-admin/admin.php?page=wc-admin&#038;path=/payments/transactions/details&#038;id=pi_mock" target="_blank" rel="noopener noreferrer">Review payment</a></p>',
			],
			'Fraud_Meta_Box_Type_REVIEW_EXPIRED'   => [
				'meta_box_type'   => Fraud_Meta_Box_Type::REVIEW_EXPIRED,
				'expected_output' => '<p class="wcpay-fraud-risk-meta-review"><img src="' . plugins_url( 'assets/images/icons/shield-stroke-orange.svg', WCPAY_PLUGIN_FILE ) . '" alt="Orange shield outline"> Held for review</p><p>The payment for this order was held for review by your risk filtering. The authorization for the charge appears to have expired.</p><p><a href="http://example.org/wp-admin/admin.php?page=wc-admin&#038;path=/payments/transactions/details&#038;id=pi_mock" target="_blank" rel="noopener noreferrer">Review payment</a></p>',
			],
			'Fraud_Meta_Box_Type_REVIEW_FAILED'    => [
				'meta_box_type'   => Fraud_Meta_Box_Type::REVIEW_FAILED,
				'expected_output' => '<p class="wcpay-fraud-risk-meta-review"><img src="' . plugins_url( 'assets/images/icons/shield-stroke-orange.svg', WCPAY_PLUGIN_FILE ) . '" alt="Orange shield outline"> Held for review</p><p>The payment for this order was held for review by your risk filtering. The authorization for the charge appears to have failed.</p><p><a href="http://example.org/wp-admin/admin.php?page=wc-admin&#038;path=/payments/transactions/details&#038;id=pi_mock" target="_blank" rel="noopener noreferrer">Review payment</a></p>',
			],
			'Fraud_Meta_Box_Type_TERMINAL_PAYMENT' => [
				'meta_box_type'   => Fraud_Meta_Box_Type::TERMINAL_PAYMENT,
				'expected_output' => '<p class="wcpay-fraud-risk-meta-allow"><img src="' . plugins_url( 'assets/images/icons/check-green.svg', WCPAY_PLUGIN_FILE ) . '" alt="Green check mark"> No action taken</p><p>The payment for this order was done in person and has bypassed your risk filtering.</p>',
			],
		];
	}

	public function test_display_order_fraud_and_risk_meta_box_message_exits_if_no_order() {
		// Arrange: Set the return results for the order service methods.
		$this->mock_order_service
			->expects( $this->never() )
			->method( 'get_intent_id_for_order' );

		$this->mock_order_service
			->expects( $this->never() )
			->method( 'get_charge_id_for_order' );

		$this->mock_order_service
			->expects( $this->never() )
			->method( 'get_fraud_meta_box_type_for_order' );

		$this->mock_order_service
			->expects( $this->never() )
			->method( 'get_charge_risk_level_for_order' );

		// Act: Call the method to display the meta box.
		$this->order_fraud_and_risk_meta_box->display_order_fraud_and_risk_meta_box_message( 'fake_order' );

		// Assert: Check to make sure the expected string has been output.
		$this->expectOutputString( '' );
	}

	public function test_display_order_fraud_and_risk_meta_box_message_block() {
		// Arrange: Set the return results for the order service methods.
		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_intent_id_for_order' )
			->willReturn( 'pi_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_id_for_order' )
			->willReturn( 'ch_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_fraud_meta_box_type_for_order' )
			->willReturn( Fraud_Meta_Box_Type::BLOCK );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_risk_level_for_order' )
			->willReturn( '' );

		// Act: Call the method to display the meta box.
		$this->order_fraud_and_risk_meta_box->display_order_fraud_and_risk_meta_box_message( $this->order );

		// Assert: Check to make sure the expected string has been output.
		$this->expectOutputString( $this->compose_fraud_and_risk_actions_block( '<p class="wcpay-fraud-risk-meta-blocked"><img src="' . plugins_url( 'assets/images/icons/shield-stroke-red.svg', WCPAY_PLUGIN_FILE ) . '" alt="Red shield outline"> Blocked</p><p>The payment for this order was blocked by your risk filtering. There is no pending authorization, and the order can be cancelled to reduce any held stock.</p><p><a href="http://example.org/wp-admin/admin.php?page=wc-admin&#038;path=/payments/transactions/details&#038;id=' . $this->order->get_id() . '&#038;status_is=block&#038;type_is=meta_box" target="_blank" rel="noopener noreferrer">View more details</a></p>' ) );
	}

	/**
	 * Simulates different possibilities for when legacy or split UPE are used and the method is not a card.
	 *
	 * @dataProvider display_order_fraud_and_risk_meta_box_message_not_card_provider
	 */
	public function test_display_order_fraud_and_risk_meta_box_message_not_card_with_provider( $payment_method_id, $payment_method_title, $expected_output ) {
		// Arrange: Set the return results for the order service methods.
		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_intent_id_for_order' )
			->willReturn( '' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_id_for_order' )
			->willReturn( '' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_fraud_meta_box_type_for_order' )
			->willReturn( Fraud_Meta_Box_Type::NOT_CARD );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_risk_level_for_order' )
			->willReturn( '' );

		// Arrange: Update the order's payment method.
		$this->order->set_payment_method( $payment_method_id );
		$this->order->set_payment_method_title( $payment_method_title );
		$this->order->save();

		// Act: Call the method to display the meta box.
		$this->order_fraud_and_risk_meta_box->display_order_fraud_and_risk_meta_box_message( $this->order );

		// Assert: Check to make sure the expected string has been output.
		$this->expectOutputString( $this->compose_fraud_and_risk_actions_block( $expected_output, false ) );
	}

	public function display_order_fraud_and_risk_meta_box_message_not_card_provider() {
		return [
			'simulate legacy UPE Popular payment methods' => [
				'payment_method_id'    => 'poocommerce_payments',
				'payment_method_title' => 'Popular payment methods',
				'expected_output'      => '<p>Risk filtering is only available for orders processed using credit cards with WooPayments.</p><p><a href="https://poocommerce.com/document/woopayments/fraud-and-disputes/fraud-protection/?status_is=fraud-meta-box-not-wcpay-learn-more" target="_blank" rel="noopener noreferrer">Learn more</a></p>',
			],
			'simulate legacy UPE Bancontact'              => [
				'payment_method_id'    => 'poocommerce_payments',
				'payment_method_title' => 'Bancontact',
				'expected_output'      => '<p>Risk filtering is only available for orders processed using credit cards with WooPayments. This order was processed with Bancontact.</p><p><a href="https://poocommerce.com/document/woopayments/fraud-and-disputes/fraud-protection/?status_is=fraud-meta-box-not-wcpay-learn-more" target="_blank" rel="noopener noreferrer">Learn more</a></p>',
			],
			'simulate split UPE Bancontact'               => [
				'payment_method_id'    => 'poocommerce_payments_bancontact',
				'payment_method_title' => 'Bancontact',
				'expected_output'      => '<p>Risk filtering is only available for orders processed using credit cards with WooPayments. This order was processed with Bancontact.</p><p><a href="https://poocommerce.com/document/woopayments/fraud-and-disputes/fraud-protection/?status_is=fraud-meta-box-not-wcpay-learn-more" target="_blank" rel="noopener noreferrer">Learn more</a></p>',
			],
		];
	}

	public function test_display_order_fraud_and_risk_meta_box_message_not_wcpay() {
		// Arrange: Set the return results for the order service methods.
		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_intent_id_for_order' )
			->willReturn( '' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_id_for_order' )
			->willReturn( '' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_fraud_meta_box_type_for_order' )
			->willReturn( '' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_risk_level_for_order' )
			->willReturn( '' );

		// Arrange: Update the order's payment method.
		$this->order->set_payment_method( 'bacs' );
		$this->order->save();

		// Act: Call the method to display the meta box.
		$this->order_fraud_and_risk_meta_box->display_order_fraud_and_risk_meta_box_message( $this->order );

		// Assert: Check to make sure the expected string has been output.
		$this->expectOutputString( $this->compose_fraud_and_risk_actions_block( '<p>Risk filtering is only available for orders processed using credit cards with WooPayments. This order was processed with Direct bank transfer.</p><p><a href="https://poocommerce.com/document/woopayments/fraud-and-disputes/fraud-protection/?status_is=fraud-meta-box-not-wcpay-learn-more" target="_blank" rel="noopener noreferrer">Learn more</a></p>', false ) );
	}

	public function test_display_order_fraud_and_risk_meta_box_message_default() {
		// Arrange: Set the return results for the order service methods.
		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_intent_id_for_order' )
			->willReturn( 'pi_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_id_for_order' )
			->willReturn( 'ch_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_fraud_meta_box_type_for_order' )
			->willReturn( '' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_risk_level_for_order' )
			->willReturn( '' );

		// Act: Call the method to display the meta box.
		$this->order_fraud_and_risk_meta_box->display_order_fraud_and_risk_meta_box_message( $this->order );

		// Assert: Check to make sure the expected string has been output.
		$this->expectOutputString( $this->compose_fraud_and_risk_actions_block( '<p>Risk filtering through WooPayments was not found on this order, it may have been created while filtering was not enabled.</p>' ) );
	}

	public function test_display_risk_level_normal_in_order_fraud_and_risk_meta_box() {
		// Arrange: Set the return results for the order service methods.
		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_intent_id_for_order' )
			->willReturn( 'pi_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_id_for_order' )
			->willReturn( 'ch_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_fraud_meta_box_type_for_order' )
			->willReturn( Fraud_Meta_Box_Type::ALLOW );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_risk_level_for_order' )
			->willReturn( 'normal' );

		// Act: Call the method to display the meta box.
		$this->order_fraud_and_risk_meta_box->display_order_fraud_and_risk_meta_box_message( $this->order );

		// Assert: Check to make sure the expected string has been output.
		$risk_level_block   = $this->compose_fraud_and_risk_level_block( 'normal', 'Normal', 'This payment shows a lower than normal risk of fraudulent activity.' );
		$risk_actions_block = $this->compose_fraud_and_risk_actions_block( '<p class="wcpay-fraud-risk-meta-allow"><img src="' . plugins_url( 'assets/images/icons/check-green.svg', WCPAY_PLUGIN_FILE ) . '" alt="Green check mark"> No action taken</p><p>The payment for this order passed your risk filtering.</p>' );

		$this->expectOutputString( $risk_level_block . $risk_actions_block );
	}

	public function test_display_risk_level_elevated_in_order_fraud_and_risk_meta_box() {
		// Arrange: Set the return results for the order service methods.
		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_intent_id_for_order' )
			->willReturn( 'pi_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_id_for_order' )
			->willReturn( 'ch_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_fraud_meta_box_type_for_order' )
			->willReturn( Fraud_Meta_Box_Type::ALLOW );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_risk_level_for_order' )
			->willReturn( 'elevated' );

		// Act: Call the method to display the meta box.
		$this->order_fraud_and_risk_meta_box->display_order_fraud_and_risk_meta_box_message( $this->order );

		// Assert: Check to make sure the expected string has been output.
		$risk_level_block   = $this->compose_fraud_and_risk_level_block( 'elevated', 'Elevated', 'This order has a moderate risk of being fraudulent. We suggest contacting the customer to confirm their details before fulfilling it.' );
		$risk_actions_block = $this->compose_fraud_and_risk_actions_block( '<p class="wcpay-fraud-risk-meta-allow"><img src="' . plugins_url( 'assets/images/icons/check-green.svg', WCPAY_PLUGIN_FILE ) . '" alt="Green check mark"> No action taken</p><p>The payment for this order passed your risk filtering.</p>' );

		$this->expectOutputString( $risk_level_block . $risk_actions_block );
	}

	public function test_display_risk_level_highest_in_order_fraud_and_risk_meta_box() {
		// Arrange: Set the return results for the order service methods.
		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_intent_id_for_order' )
			->willReturn( 'pi_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_id_for_order' )
			->willReturn( 'ch_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_fraud_meta_box_type_for_order' )
			->willReturn( Fraud_Meta_Box_Type::ALLOW );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_risk_level_for_order' )
			->willReturn( 'highest' );

		// Act: Call the method to display the meta box.
		$this->order_fraud_and_risk_meta_box->display_order_fraud_and_risk_meta_box_message( $this->order );

		// Assert: Check to make sure the expected string has been output.
		$risk_level_block   = $this->compose_fraud_and_risk_level_block( 'highest', 'High', 'This order has a high risk of being fraudulent. We suggest contacting the customer to confirm their details before fulfilling it.' );
		$risk_actions_block = $this->compose_fraud_and_risk_actions_block( '<p class="wcpay-fraud-risk-meta-allow"><img src="' . plugins_url( 'assets/images/icons/check-green.svg', WCPAY_PLUGIN_FILE ) . '" alt="Green check mark"> No action taken</p><p>The payment for this order passed your risk filtering.</p>' );

		$this->expectOutputString( $risk_level_block . $risk_actions_block );
	}

	public function test_do_not_display_risk_level_in_order_fraud_and_risk_meta_box_with_invalid_risk_level() {
		// Arrange: Set the return results for the order service methods.
		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_intent_id_for_order' )
			->willReturn( 'pi_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_id_for_order' )
			->willReturn( 'ch_mock' );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_fraud_meta_box_type_for_order' )
			->willReturn( Fraud_Meta_Box_Type::ALLOW );

		$this->mock_order_service
			->expects( $this->once() )
			->method( 'get_charge_risk_level_for_order' )
			->willReturn( 'unknown' );

		// Act: Call the method to display the meta box.
		$this->order_fraud_and_risk_meta_box->display_order_fraud_and_risk_meta_box_message( $this->order );

		// Assert: Check to make sure the expected string has been output.
		$risk_actions_block = $this->compose_fraud_and_risk_actions_block( '<p class="wcpay-fraud-risk-meta-allow"><img src="' . plugins_url( 'assets/images/icons/check-green.svg', WCPAY_PLUGIN_FILE ) . '" alt="Green check mark"> No action taken</p><p>The payment for this order passed your risk filtering.</p>' );

		$this->expectOutputString( $risk_actions_block );
	}

	private function compose_fraud_and_risk_level_block( $risk_level, $title, $description ) {
		$output  = '<div class="wcpay-fraud-risk-level wcpay-fraud-risk-level--' . $risk_level . '">';
		$output .= '<p class="wcpay-fraud-risk-level__title">' . $title . '</p>';
		$output .= '<div class="wcpay-fraud-risk-level__bar"></div>';
		$output .= '<p>' . $description . '</p>';
		$output .= '</div>';

		return $output;
	}

	private function compose_fraud_and_risk_actions_block( $content, $show_adjust_risk_filters_link = true ) {
		$output  = '<div class="wcpay-fraud-risk-action">';
		$output .= $content;

		if ( $show_adjust_risk_filters_link ) {
			$output .= '<p><a href="http://example.org/wp-admin/admin.php?page=wc-settings&#038;tab=checkout&#038;section=poocommerce_payments&#038;anchor=%23fp-settings" target="_blank" rel="noopener noreferrer">Adjust risk filters</a></p>';
		}

		$output .= '</div>';

		return $output;
	}
}
