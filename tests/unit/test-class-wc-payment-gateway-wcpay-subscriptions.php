<?php
/**
 * Class WC_Payment_Gateway_WCPay_Test
 *
 * @package PooCommerce\Payments\Tests
 */

use PHPUnit\Framework\MockObject\MockObject;
use WCPay\Core\Server\Request\Create_And_Confirm_Intention;
use WCPay\Duplicate_Payment_Prevention_Service;
use WCPay\Duplicates_Detection_Service;
use WCPay\Exceptions\API_Exception;
use WCPay\Internal\Service\Level3Service;
use WCPay\Internal\Service\OrderService;
use WCPay\Payment_Methods\CC_Payment_Method;
use WCPay\Session_Rate_Limiter;

/**
 * WC_Payment_Gateway_WCPay unit tests.
 */
class WC_Payment_Gateway_WCPay_Subscriptions_Test extends WCPAY_UnitTestCase {
	const USER_ID           = 1;
	const CUSTOMER_ID       = 'cus_mock';
	const PAYMENT_METHOD_ID = 'pm_mock';
	const CHARGE_ID         = 'ch_mock';
	const PAYMENT_INTENT_ID = 'pi_mock';
	const SETUP_INTENT_ID   = 'seti_mock';

	/**
	 * System under test.
	 *
	 * @var WC_Payment_Gateway_WCPay_Subscriptions_Compat
	 */
	private $wcpay_gateway;

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
	private $mock_session_rate_limiter;

	/**
	 * WC_Payments_Order_Service.
	 *
	 * @var WC_Payments_Order_Service
	 */
	private $order_service;

	/**
	 * Duplicate_Payment_Prevention_Service instance.
	 *
	 * @var Duplicate_Payment_Prevention_Service|MockObject
	 */
	private $mock_dpps;

	/**
	 * Mock WC_Payments_Account.
	 *
	 * @var WC_Payments_Account|MockObject
	 */
	private $mock_wcpay_account;

	/**
	 * WC_Payments_Localization_Service instance.
	 *
	 * @var WC_Payments_Localization_Service|MockObject
	 */
	private $mock_localization_service;

	/**
	 * Mock Fraud Service.
	 *
	 * @var WC_Payments_Fraud_Service|MockObject;
	 */
	private $mock_fraud_service;

	/**
	 * Mock Duplicates Detection Service.
	 *
	 * @var Duplicates_Detection_Service
	 */
	private $mock_duplicates_detection_service;

	public function set_up() {
		parent::set_up();

		wp_set_current_user( self::USER_ID );

		$this->mock_api_client = $this->getMockBuilder( 'WC_Payments_API_Client' )
			->disableOriginalConstructor()
			->getMock();

		$this->mock_wcpay_account = $this->createMock( WC_Payments_Account::class );
		$this->mock_wcpay_account
			->method( 'get_account_default_currency' )
			->willReturn( 'usd' );

		$this->mock_customer_service = $this->getMockBuilder( 'WC_Payments_Customer_Service' )
			->disableOriginalConstructor()
			->getMock();

		$this->mock_token_service = $this->getMockBuilder( 'WC_Payments_Token_Service' )
			->disableOriginalConstructor()
			->getMock();

		$this->mock_action_scheduler_service = $this->getMockBuilder( 'WC_Payments_Action_Scheduler_Service' )
			->disableOriginalConstructor()
			->getMock();

		$this->mock_session_rate_limiter = $this->getMockBuilder( Session_Rate_Limiter::class )
			->disableOriginalConstructor()
			->getMock();

		$this->order_service = new WC_Payments_Order_Service( $this->mock_api_client );

		$this->mock_dpps = $this->createMock( Duplicate_Payment_Prevention_Service::class );

		$this->mock_localization_service         = $this->createMock( WC_Payments_Localization_Service::class );
		$this->mock_fraud_service                = $this->createMock( WC_Payments_Fraud_Service::class );
		$this->mock_duplicates_detection_service = $this->createMock( Duplicates_Detection_Service::class );

		$mock_payment_method = $this->getMockBuilder( CC_Payment_Method::class )
			->setConstructorArgs( [ $this->mock_token_service ] )
			->onlyMethods( [ 'is_subscription_item_in_cart' ] )
			->getMock();

		$this->wcpay_gateway = new \WC_Payment_Gateway_WCPay(
			$this->mock_api_client,
			$this->mock_wcpay_account,
			$this->mock_customer_service,
			$this->mock_token_service,
			$this->mock_action_scheduler_service,
			$mock_payment_method,
			[ 'card' => $mock_payment_method ],
			$this->order_service,
			$this->mock_dpps,
			$this->mock_localization_service,
			$this->mock_fraud_service,
			$this->mock_duplicates_detection_service,
			$this->mock_session_rate_limiter
		);
		$this->wcpay_gateway->init_hooks();
		WC_Payments::set_gateway( $this->wcpay_gateway );

		// Mock the level3 service to always return an empty array.
		$mock_level3_service = $this->createMock( Level3Service::class );
		$mock_level3_service->expects( $this->any() )
			->method( 'get_data_from_order' )
			->willReturn( [] );
		wcpay_get_test_container()->replace( Level3Service::class, $mock_level3_service );

		// Mock the order service to always return an empty array for meta.
		$mock_order_service = $this->createMock( OrderService::class );
		$mock_order_service->expects( $this->any() )
			->method( 'get_payment_metadata' )
			->willReturn( [] );
		wcpay_get_test_container()->replace( OrderService::class, $mock_order_service );
	}

	public static function tear_down_after_class() {
		WC_Subscriptions::set_wcs_get_subscriptions_for_order( null );
		WC_Subscriptions::set_wcs_is_subscription( null );
		WC_Subscriptions::set_wcs_get_subscriptions_for_renewal_order( null );
		wcpay_get_test_container()->reset_all_replacements();
		parent::tear_down_after_class();
	}

	public function test_add_token_to_order_should_add_token_to_subscriptions() {
		$original_order = WC_Helper_Order::create_order( self::USER_ID );
		$subscriptions  = [
			WC_Helper_Order::create_order( self::USER_ID ),
			WC_Helper_Order::create_order( self::USER_ID ),
			WC_Helper_Order::create_order( self::USER_ID ),
		];
		$orders         = array_merge( [ $original_order ], $subscriptions );

		$this->mock_wcs_get_subscriptions_for_order( $subscriptions );

		$token = WC_Helper_Token::create_token( 'new_payment_method', self::USER_ID );

		$this->wcpay_gateway->add_token_to_order( $original_order, $token );

		foreach ( $orders as $order ) {
			$payment_methods = $order->get_payment_tokens();
			$this->assertEquals( $token->get_id(), end( $payment_methods ) );
		}
	}

	public function test_add_token_to_order_should_add_to_end_of_array() {
		$order = WC_Helper_Order::create_order( self::USER_ID );
		$this->mock_wcs_get_subscriptions_for_order( [] );
		$tokens = [
			WC_Helper_Token::create_token( 'new_payment_method_1', self::USER_ID ),
			WC_Helper_Token::create_token( 'new_payment_method_2', self::USER_ID ),
		];

		foreach ( $tokens as $token ) {
			$this->wcpay_gateway->add_token_to_order( $order, $token );
			$payment_methods = $order->get_payment_tokens();
			$this->assertEquals( $token->get_id(), end( $payment_methods ) );
		}
		$this->assertCount( count( $tokens ), $order->get_payment_tokens() );
	}

	public function test_add_token_to_order_should_add_existing_tokens() {
		$order = WC_Helper_Order::create_order( self::USER_ID );
		$this->mock_wcs_get_subscriptions_for_order( [] );
		$tokens = [
			WC_Helper_Token::create_token( 'new_payment_method_1', self::USER_ID ),
			WC_Helper_Token::create_token( 'new_payment_method_2', self::USER_ID ),
		];
		$tokens = array_merge( $tokens, $tokens );

		foreach ( $tokens as $token ) {
			$this->wcpay_gateway->add_token_to_order( $order, $token );
			$payment_methods = $order->get_payment_tokens();
			$this->assertEquals( $token->get_id(), end( $payment_methods ) );
		}
		$this->assertCount( count( $tokens ), $order->get_payment_tokens() );
	}

	public function test_update_failing_payment_method_copies_last_method_from_renewal() {
		$subscription  = WC_Helper_Order::create_order( self::USER_ID );
		$renewal_order = WC_Helper_Order::create_order( self::USER_ID );

		$renewal_order->add_payment_token( WC_Helper_Token::create_token( 'new_payment_method_1', self::USER_ID ) );
		$renewal_order->add_payment_token( WC_Helper_Token::create_token( 'new_payment_method_2', self::USER_ID ) );

		$this->wcpay_gateway->update_failing_payment_method( $subscription, $renewal_order );

		$payment_methods = $subscription->get_payment_tokens();
		$this->assertCount( 1, $payment_methods );
		$token = WC_Payment_Tokens::get( end( $payment_methods ) );
		$this->assertEquals( 'new_payment_method_2', $token->get_token() );
	}

	public function test_update_failing_payment_method_does_not_copy_method_if_renewal_has_no_method() {
		$subscription  = WC_Helper_Order::create_order( self::USER_ID );
		$renewal_order = $this->createMock( WC_Order::class );

		$renewal_order->expects( $this->once() )
			->method( 'get_payment_tokens' )
			->willReturn( [] );

		$renewal_order->expects( $this->once() )
			->method( 'add_order_note' )
			->with( 'Unable to update subscription payment method: No valid payment token or method found.' );

		$this->wcpay_gateway->update_failing_payment_method( $subscription, $renewal_order );

		$this->assertCount( 0, $subscription->get_payment_tokens() );
	}

	public function test_update_failing_payment_method_does_not_copy_method_if_token_does_not_exist() {
		$subscription  = WC_Helper_Order::create_order( self::USER_ID );
		$renewal_order = WC_Helper_Order::create_order( self::USER_ID );

		$token = WC_Helper_Token::create_token( 'new_payment_method', self::USER_ID );
		$renewal_order->add_payment_token( $token );
		$token->delete();

		$this->wcpay_gateway->update_failing_payment_method( $subscription, $renewal_order );

		$this->assertCount( 0, $subscription->get_payment_tokens() );
	}

	public function test_scheduled_subscription_payment() {
		$renewal_order = WC_Helper_Order::create_order( self::USER_ID );

		$token = WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID );
		$renewal_order->add_payment_token( $token );

		$mock_subscription = new WC_Subscription();

		$this->mock_wcs_get_subscriptions_for_renewal_order( [ '1' => $mock_subscription ] );

		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->with( self::USER_ID )
			->willReturn( self::CUSTOMER_ID );

		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'set_customer' )
			->with( self::CUSTOMER_ID );

		$request->expects( $this->once() )
			->method( 'set_payment_method' )
			->with( self::PAYMENT_METHOD_ID );

		$request->expects( $this->once() )
			->method( 'set_cvc_confirmation' )
			->with( null );

		$request->expects( $this->once() )
			->method( 'set_amount' )
			->with( 5000 )
			->willReturn( $request );

		$request->expects( $this->once() )
			->method( 'set_currency_code' )
			->with( 'usd' )
			->willReturn( $request );

		$request->expects( $this->never() )
			->method( 'setup_future_usage' );

		$request->expects( $this->once() )
			->method( 'set_capture_method' )
			->with( false );

		$request->expects( $this->once() )
			->method( 'set_off_session' )
			->with( true );

		$request->expects( $this->once() )
			->method( 'set_capture_method' )
			->with( false );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( WC_Helper_Intention::create_intention() );

		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'update_customer_for_user' )
			->willReturn( self::CUSTOMER_ID );

		$this->wcpay_gateway->scheduled_subscription_payment( $renewal_order->get_total(), $renewal_order );

		$this->assertEquals( 'processing', $renewal_order->get_status() );
	}

	public function test_scheduled_subscription_payment_with_saved_customer_id() {
		$saved_customer_id = self::CUSTOMER_ID . '_old';

		$renewal_order = WC_Helper_Order::create_order( self::USER_ID );

		$token = WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID );
		$renewal_order->add_payment_token( $token );

		$this->order_service->set_customer_id_for_order( $renewal_order, $saved_customer_id );

		$mock_subscription = new WC_Subscription();

		$this->mock_wcs_get_subscriptions_for_renewal_order( [ '1' => $mock_subscription ] );

		$this->mock_customer_service
			->expects( $this->never() )
			->method( 'get_customer_id_by_user_id' );

		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'set_customer' )
			->with( $saved_customer_id );

		$request->expects( $this->once() )
			->method( 'set_payment_method' )
			->with( self::PAYMENT_METHOD_ID );

		$request->expects( $this->once() )
			->method( 'set_cvc_confirmation' )
			->with( null );

		$request->expects( $this->once() )
			->method( 'set_amount' )
			->with( 5000 )
			->willReturn( $request );

		$request->expects( $this->once() )
			->method( 'set_currency_code' )
			->with( 'usd' )
			->willReturn( $request );

		$request->expects( $this->never() )
			->method( 'setup_future_usage' );

		$request->expects( $this->once() )
			->method( 'set_capture_method' )
			->with( false );

		$request->expects( $this->once() )
			->method( 'set_off_session' )
			->with( true );

		$request->expects( $this->once() )
			->method( 'set_capture_method' )
			->with( false );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( WC_Helper_Intention::create_intention() );

		$this->mock_customer_service
			->expects( $this->never() )
			->method( 'update_customer_for_user' );

		$this->wcpay_gateway->scheduled_subscription_payment( $renewal_order->get_total(), $renewal_order );

		$this->assertEquals( 'processing', $renewal_order->get_status() );
	}

	public function test_scheduled_subscription_payment_fails_when_token_is_missing() {
		$renewal_order = WC_Helper_Order::create_order( self::USER_ID );

		$this->mock_customer_service
			->expects( $this->never() )
			->method( 'get_customer_id_by_user_id' );

		$this->wcpay_gateway->scheduled_subscription_payment( $renewal_order->get_total(), $renewal_order );

		$this->assertEquals( 'failed', $renewal_order->get_status() );
	}

	public function test_scheduled_subscription_payment_fails_when_token_is_invalid() {
		$renewal_order = WC_Helper_Order::create_order( self::USER_ID );

		$token = WC_Helper_Token::create_token( 'new_payment_method', self::USER_ID );
		$renewal_order->add_payment_token( $token );
		$token->delete();

		$this->mock_customer_service
			->expects( $this->never() )
			->method( 'get_customer_id_by_user_id' );

		$this->wcpay_gateway->scheduled_subscription_payment( $renewal_order->get_total(), $renewal_order );

		$this->assertEquals( 'failed', $renewal_order->get_status() );
	}

	public function test_scheduled_subscription_payment_fails_when_payment_processing_fails() {
		$renewal_order = WC_Helper_Order::create_order( self::USER_ID );

		$token = WC_Helper_Token::create_token( 'new_payment_method', self::USER_ID );
		$renewal_order->add_payment_token( $token );

		$mock_subscription = new WC_Subscription();

		WC_Subscriptions::set_wcs_get_subscriptions_for_renewal_order(
			function ( $id ) use ( $mock_subscription ) {
				return [ '1' => $mock_subscription ];
			}
		);

		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->willThrowException( new API_Exception( 'Error', 'error', 500 ) );

		$this->wcpay_gateway->scheduled_subscription_payment( $renewal_order->get_total(), $renewal_order );

		$this->assertEquals( 'failed', $renewal_order->get_status() );
	}

	public function test_scheduled_subscription_payment_fails_when_payment_processing_fails_non_usd() {
		$renewal_order = WC_Helper_Order::create_order( self::USER_ID );

		$token = WC_Helper_Token::create_token( 'new_payment_method', self::USER_ID );
		$renewal_order->add_payment_token( $token );
		$renewal_order->set_currency( 'EUR' );

		$mock_subscription = new WC_Subscription();

		WC_Subscriptions::set_wcs_get_subscriptions_for_renewal_order(
			function ( $id ) use ( $mock_subscription ) {
				return [ '1' => $mock_subscription ];
			}
		);

		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->willThrowException( new API_Exception( 'Error', 'error', 500 ) );

		$this->wcpay_gateway->scheduled_subscription_payment( $renewal_order->get_total(), $renewal_order );

		$notes             = wc_get_order_notes(
			[
				'order_id' => $renewal_order->get_id(),
				'limit'    => 1,
			]
		);
		$latest_wcpay_note = $notes[0];

		$this->assertEquals( 'failed', $renewal_order->get_status() );
		$this->assertStringContainsString( 'failed', $latest_wcpay_note->content );
		$this->assertStringContainsString( wc_price( $renewal_order->get_total(), [ 'currency' => 'EUR' ] ), $latest_wcpay_note->content );
	}

	public function test_scheduled_subscription_payment_adds_mandate() {
		$renewal_order = WC_Helper_Order::create_order( self::USER_ID );
		$token         = WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID );
		$renewal_order->add_payment_token( $token );

		$subscription_order = WC_Helper_Order::create_order();
		$subscription_order->add_meta_data( '_stripe_mandate_id', 'mandate_id' );
		$subscription_order->save_meta_data();

		$mock_subscription = new WC_Subscription();
		$mock_subscription->set_parent( $subscription_order );

		$this->mock_wcs_get_subscriptions_for_renewal_order( [ '1' => $mock_subscription ] );

		$this->mock_customer_service
			->expects( $this->once() )
			->method( 'get_customer_id_by_user_id' )
			->with( self::USER_ID )
			->willReturn( self::CUSTOMER_ID );

		$request = $this->mock_wcpay_request( Create_And_Confirm_Intention::class );

		$request->expects( $this->once() )
			->method( 'set_customer' )
			->with( self::CUSTOMER_ID );

		$request->expects( $this->once() )
			->method( 'set_payment_method' )
			->with( self::PAYMENT_METHOD_ID );

		$request->expects( $this->once() )
			->method( 'set_cvc_confirmation' )
			->with( null );

		$request->expects( $this->once() )
			->method( 'set_amount' )
			->with( 5000 )
			->willReturn( $request );

		$request->expects( $this->once() )
			->method( 'set_currency_code' )
			->with( 'usd' )
			->willReturn( $request );

		$request->expects( $this->once() )
			->method( 'set_capture_method' )
			->with( false );

		$request->expects( $this->once() )
			->method( 'set_off_session' )
			->with( true );

		$request->expects( $this->once() )
			->method( 'set_capture_method' )
			->with( false );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( WC_Helper_Intention::create_intention() );

		/**
		$this->mock_api_client
			->expects( $this->once() )
			->method( 'create_and_confirm_intention' )
			->with(
				$this->anything(),
				$this->anything(),
				self::PAYMENT_METHOD_ID,
				self::CUSTOMER_ID,
				$this->anything(),
				false,
				false,
				$this->anything(),
				$this->anything(),
				true,
				$this->equalTo(
					[
						'mandate'                    => 'mandate_id',
						'is_platform_payment_method' => false,
					]
				)
			)
			->willReturn( WC_Helper_Intention::create_intention() )

		 */

		$this->wcpay_gateway->scheduled_subscription_payment( $renewal_order->get_total(), $renewal_order );
	}

	public function test_subscription_payment_method_filter_bypass_other_payment_methods() {
		$subscription              = WC_Helper_Order::create_order( self::USER_ID );
		$payment_method_to_display = $this->wcpay_gateway->maybe_render_subscription_payment_method( 'Via Crypto Currency', $subscription );
		$this->assertEquals( 'Via Crypto Currency', $payment_method_to_display );
	}

	public function test_subscription_payment_method_filter_adds_card_details() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );
		$subscription->set_payment_method( $this->wcpay_gateway->id );
		$subscription->add_payment_token( WC_Helper_Token::create_token( 'new_payment_method_1', self::USER_ID ) );

		$last_token = WC_Helper_Token::create_token( 'new_payment_method_2', self::USER_ID );
		$subscription->add_payment_token( $last_token );

		$payment_method_to_display = $this->wcpay_gateway->maybe_render_subscription_payment_method( 'Via Credit card', $subscription );
		$this->assertEquals( $last_token->get_display_name(), $payment_method_to_display );
	}

	public function test_display_save_payment_method_checkbox_for_subs_cart() {
		WC_Subscriptions_Cart::set_cart_contains_subscription( true );

		$this->assertFalse( $this->wcpay_gateway->display_save_payment_method_checkbox( true ) );
	}

	public function test_display_save_payment_method_checkbox_for_subs_change() {
		WC_Subscriptions_Cart::set_cart_contains_subscription( false );

		$this->mock_wcs_is_subscription( true );

		$_GET = [ 'change_payment_method' => 10 ];
		$this->assertFalse( $this->wcpay_gateway->display_save_payment_method_checkbox( true ) );
	}

	public function test_display_save_payment_method_checkbox_for_returns_display() {
		WC_Subscriptions_Cart::set_cart_contains_subscription( false );

		$this->mock_wcs_is_subscription( false );

		$this->assertTrue( $this->wcpay_gateway->display_save_payment_method_checkbox( true ) );
	}

	public function test_add_subscription_payment_meta_adds_active_token() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );

		$token = WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID );
		$subscription->add_payment_token( $token );

		$payment_meta = $this->wcpay_gateway->add_subscription_payment_meta( [], $subscription );

		$this->assertEquals(
			[
				'wc_order_tokens' => [
					'token' => [
						'label' => 'Saved payment method',
						'value' => strval( $token->get_id() ),
					],
				],
			],
			$payment_meta[ $this->wcpay_gateway->id ]
		);
	}

	public function test_add_subscription_payment_meta_adds_empty_string() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );

		$payment_meta = $this->wcpay_gateway->add_subscription_payment_meta( [], $subscription );

		$this->assertEquals(
			[
				'wc_order_tokens' => [
					'token' => [
						'label' => 'Saved payment method',
						'value' => '',
					],
				],
			],
			$payment_meta[ $this->wcpay_gateway->id ]
		);
	}

	public function test_validate_subscription_payment_meta_success() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );
		$token        = WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID );

		// The validate method doesn't return/does anything when the payment_meta is valid,
		// but we need to assert something to avoid PHPUnit's risky test warning.
		$this->assertNull(
			$this->wcpay_gateway->validate_subscription_payment_meta(
				$this->wcpay_gateway->id,
				[ 'wc_order_tokens' => [ 'token' => [ 'value' => strval( $token->get_id() ) ] ] ],
				$subscription
			)
		);
	}

	public function test_validate_subscription_payment_meta_skips_wrong_gateway() {
		// The validate method doesn't return/does anything when the payment_meta is valid,
		// but we need to assert something to avoid PHPUnit's risky test warning.
		$this->assertNull(
			$this->wcpay_gateway->validate_subscription_payment_meta(
				'some_random_gateway',
				[],
				null
			)
		);
	}

	public function test_validate_subscription_payment_meta_no_payment_method() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'A customer saved payment method was not selected for this order.' );

		$subscription = WC_Helper_Order::create_order( self::USER_ID );

		$this->wcpay_gateway->validate_subscription_payment_meta(
			$this->wcpay_gateway->id,
			[ 'wc_order_tokens' => [ 'token' => [ 'value' => '' ] ] ],
			$subscription
		);
	}

	public function test_validate_subscription_payment_meta_invalid_token() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'The saved payment method selected is invalid or does not exist.' );

		$subscription = WC_Helper_Order::create_order( self::USER_ID );

		$this->wcpay_gateway->validate_subscription_payment_meta(
			$this->wcpay_gateway->id,
			[ 'wc_order_tokens' => [ 'token' => [ 'value' => '158651' ] ] ],
			$subscription
		);
	}

	public function test_validate_subscription_payment_meta_another_user_token() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'The saved payment method selected does not belong to this order\'s customer.' );

		$subscription = WC_Helper_Order::create_order( self::USER_ID );
		$token        = WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID + 1 );

		$this->wcpay_gateway->validate_subscription_payment_meta(
			$this->wcpay_gateway->id,
			[ 'wc_order_tokens' => [ 'token' => [ 'value' => strval( $token->get_id() ) ] ] ],
			$subscription
		);
	}

	public function test_save_meta_in_order_tokens_adds_token_to_order() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );
		$token        = WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID );

		$this->wcpay_gateway->save_meta_in_order_tokens( $subscription, 'wc_order_tokens', 'token', strval( $token->get_id() ) );
		$subscription_tokens = $subscription->get_payment_tokens();
		$this->assertEquals( $token->get_id(), end( $subscription_tokens ) );
	}

	public function test_save_meta_in_order_tokens_skips_wrong_table_name() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );
		$token        = WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID );

		$this->wcpay_gateway->save_meta_in_order_tokens( $subscription, 'post_meta', 'token', strval( $token->get_id() ) );
		$this->assertCount( 0, $subscription->get_payment_tokens() );
	}

	public function test_save_meta_in_order_tokens_wrong_meta_key() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );
		$token        = WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID );

		$this->wcpay_gateway->save_meta_in_order_tokens( $subscription, 'wc_order_tokens', 'payment_method_id', strval( $token->get_id() ) );
		$this->assertCount( 0, $subscription->get_payment_tokens() );
	}

	public function test_save_meta_in_order_tokens_wrong_token_id() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );
		$token        = WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID );

		$this->wcpay_gateway->save_meta_in_order_tokens( $subscription, 'wc_order_tokens', 'token', strval( $token->get_id() + 200 ) );
		$this->assertCount( 0, $subscription->get_payment_tokens() );
	}

	public function test_render_custom_payment_meta_input() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );
		$tokens       = [
			WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID . '_1', self::USER_ID ),
			WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID . '_2', self::USER_ID ),
		];
		$subscription->add_payment_token( $tokens[0] );
		$subscription->add_payment_token( $tokens[1] );

		$this->expectOutputString(
			'<select name="field_id" id="field_id">' .
				'<option value="' . $tokens[0]->get_id() . '" selected>' . $tokens[0]->get_display_name() . '</option>' .
				'<option value="' . $tokens[1]->get_id() . '" >' . $tokens[1]->get_display_name() . '</option>' .
			'</select>'
		);

		$this->wcpay_gateway->render_custom_payment_meta_input( $subscription, 'field_id', strval( $tokens[0]->get_id() ) );
	}

	public function test_render_custom_payment_meta_input_invalid_value() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );
		$tokens       = [
			WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID . '_1', self::USER_ID ),
			WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID . '_2', self::USER_ID ),
		];
		$subscription->add_payment_token( $tokens[0] );
		$subscription->add_payment_token( $tokens[1] );

		$this->expectOutputString(
			'<select name="field_id" id="field_id">' .
				'<option value="" selected disabled>Please select a payment method</option>' .
				'<option value="' . $tokens[0]->get_id() . '" >' . $tokens[0]->get_display_name() . '</option>' .
				'<option value="' . $tokens[1]->get_id() . '" >' . $tokens[1]->get_display_name() . '</option>' .
			'</select>'
		);

		$this->wcpay_gateway->render_custom_payment_meta_input( $subscription, 'field_id', 'invalid_value' );
	}

	public function test_render_custom_payment_meta_input_multiple_tokens() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );
		$tokens       = [
			WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID . '_1', self::USER_ID ),
			WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID . '_2', self::USER_ID ),
			WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID . '_3', self::USER_ID ),
			WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID . '_4', self::USER_ID ),
			WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID . '_5', self::USER_ID ),
			WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID . '_6', self::USER_ID ),
			WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID . '_7', self::USER_ID ),
			WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID . '_8', self::USER_ID ),
			WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID . '_9', self::USER_ID ),
			WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID . '_10', self::USER_ID ),
			WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID . '_11', self::USER_ID ),
		];

		foreach ( $tokens as $token ) {
			$subscription->add_payment_token( $token );
		}

		$this->expectOutputString(
			'<select name="field_id" id="field_id">' .
				'<option value="" selected disabled>Please select a payment method</option>' .
				'<option value="' . $tokens[0]->get_id() . '" >' . $tokens[0]->get_display_name() . '</option>' .
				'<option value="' . $tokens[1]->get_id() . '" >' . $tokens[1]->get_display_name() . '</option>' .
				'<option value="' . $tokens[2]->get_id() . '" >' . $tokens[2]->get_display_name() . '</option>' .
				'<option value="' . $tokens[3]->get_id() . '" >' . $tokens[3]->get_display_name() . '</option>' .
				'<option value="' . $tokens[4]->get_id() . '" >' . $tokens[4]->get_display_name() . '</option>' .
				'<option value="' . $tokens[5]->get_id() . '" >' . $tokens[5]->get_display_name() . '</option>' .
				'<option value="' . $tokens[6]->get_id() . '" >' . $tokens[6]->get_display_name() . '</option>' .
				'<option value="' . $tokens[7]->get_id() . '" >' . $tokens[7]->get_display_name() . '</option>' .
				'<option value="' . $tokens[8]->get_id() . '" >' . $tokens[8]->get_display_name() . '</option>' .
				'<option value="' . $tokens[9]->get_id() . '" >' . $tokens[9]->get_display_name() . '</option>' .
				'<option value="' . $tokens[10]->get_id() . '" >' . $tokens[10]->get_display_name() . '</option>' .
			'</select>'
		);

		$this->wcpay_gateway->render_custom_payment_meta_input( $subscription, 'field_id', '' );
	}


	public function test_render_custom_payment_meta_input_empty_value() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );
		$tokens       = [
			WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID . '_1', self::USER_ID ),
			WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID . '_2', self::USER_ID ),
		];
		$subscription->add_payment_token( $tokens[0] );
		$subscription->add_payment_token( $tokens[1] );

		$this->expectOutputString(
			'<select name="field_id" id="field_id">' .
				'<option value="" selected disabled>Please select a payment method</option>' .
				'<option value="' . $tokens[0]->get_id() . '" >' . $tokens[0]->get_display_name() . '</option>' .
				'<option value="' . $tokens[1]->get_id() . '" >' . $tokens[1]->get_display_name() . '</option>' .
			'</select>'
		);

		$this->wcpay_gateway->render_custom_payment_meta_input( $subscription, 'field_id', '' );
	}

	public function test_adds_custom_payment_meta_input_using_filter() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );
		$subscription->add_payment_token( WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID ) );

		$this->wcpay_gateway->add_subscription_payment_meta( [], $subscription );
		$this->assertTrue( has_action( 'poocommerce_subscription_payment_meta_input_' . WC_Payment_Gateway_WCPay::GATEWAY_ID . '_wc_order_tokens_token' ) );
	}

	public function test_adds_custom_payment_meta_input_fallback_until_subs_3_0_7() {
		remove_all_actions( 'poocommerce_admin_order_data_after_billing_address' );

		WC_Subscriptions::$version = '3.0.7';

		$mock_payment_method = $this->getMockBuilder( CC_Payment_Method::class )
			->setConstructorArgs( [ $this->mock_token_service ] )
			->onlyMethods( [ 'is_subscription_item_in_cart' ] )
			->getMock();

		$payment_gateway = new \WC_Payment_Gateway_WCPay(
			$this->mock_api_client,
			$this->mock_wcpay_account,
			$this->mock_customer_service,
			$this->mock_token_service,
			$this->mock_action_scheduler_service,
			$mock_payment_method,
			[ 'card' => $mock_payment_method ],
			$this->order_service,
			$this->mock_dpps,
			$this->mock_localization_service,
			$this->mock_fraud_service,
			$this->mock_duplicates_detection_service,
			$this->mock_session_rate_limiter
		);

		// Ensure the has_attached_integration_hooks property is set to false so callbacks can be attached in maybe_init_subscriptions().
		$ref = new ReflectionProperty( $payment_gateway, 'has_attached_integration_hooks' );
		$ref->setAccessible( true );
		$ref->setValue( null, false );

		$payment_gateway->init_hooks();

		$this->assertTrue( has_action( 'poocommerce_admin_order_data_after_billing_address' ) );
	}

	public function test_does_not_add_custom_payment_meta_input_fallback_for_subs_3_0_8() {
		remove_all_actions( 'poocommerce_admin_order_data_after_billing_address' );

		$mock_payment_method = $this->getMockBuilder( CC_Payment_Method::class )
			->setConstructorArgs( [ $this->mock_token_service ] )
			->onlyMethods( [ 'is_subscription_item_in_cart' ] )
			->getMock();

		WC_Subscriptions::$version = '3.0.8';
		new \WC_Payment_Gateway_WCPay(
			$this->mock_api_client,
			$this->mock_wcpay_account,
			$this->mock_customer_service,
			$this->mock_token_service,
			$this->mock_action_scheduler_service,
			$mock_payment_method,
			[ 'card' => $mock_payment_method ],
			$this->order_service,
			$this->mock_dpps,
			$this->mock_localization_service,
			$this->mock_fraud_service,
			$this->mock_duplicates_detection_service,
			$this->mock_session_rate_limiter
		);

		$this->assertFalse( has_action( 'poocommerce_admin_order_data_after_billing_address' ) );
	}

	public function test_add_payment_method_select_to_subscription_edit_when_subscription() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );
		$this->mock_wcs_is_subscription( true );
		wp_deregister_script( 'WCPAY_SUBSCRIPTION_EDIT_PAGE' );
		wp_dequeue_script( 'WCPAY_SUBSCRIPTION_EDIT_PAGE' );

		$this->wcpay_gateway->add_payment_method_select_to_subscription_edit( $subscription );

		$this->assertTrue( wp_script_is( 'WCPAY_SUBSCRIPTION_EDIT_PAGE', 'registered' ) );
		$this->assertTrue( wp_script_is( 'WCPAY_SUBSCRIPTION_EDIT_PAGE', 'enqueued' ) );
	}

	public function test_add_payment_method_select_to_subscription_edit_when_order() {
		$order = WC_Helper_Order::create_order( self::USER_ID );
		$this->mock_wcs_is_subscription( false );
		wp_deregister_script( 'WCPAY_SUBSCRIPTION_EDIT_PAGE' );
		wp_dequeue_script( 'WCPAY_SUBSCRIPTION_EDIT_PAGE' );

		$this->wcpay_gateway->add_payment_method_select_to_subscription_edit( $order );

		$this->assertFalse( wp_script_is( 'WCPAY_SUBSCRIPTION_EDIT_PAGE', 'registered' ) );
		$this->assertFalse( wp_script_is( 'WCPAY_SUBSCRIPTION_EDIT_PAGE', 'enqueued' ) );
	}

	public function test_append_payment_meta() {
		$token1 = WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID );
		$token2 = WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID );

		$subscription = WC_Helper_Order::create_order( self::USER_ID );
		$subscription->set_payment_method( $this->wcpay_gateway->id );
		$subscription->add_payment_token( $token1 );

		$order = WC_Helper_Order::create_order( self::USER_ID );
		$order->set_payment_method( $this->wcpay_gateway->id );
		$order->add_payment_token( $token2 );

		$payment_meta1 = $this->wcpay_gateway->append_payment_meta( [], $order, $subscription );
		$payment_meta2 = $this->wcpay_gateway->append_payment_meta( [ 'some-key' => 'some-value' ], $order, $subscription );

		$this->assertEquals(
			[
				'wc_order_tokens' => [
					'token' => [
						'label' => 'Saved payment method',
						'value' => $subscription->get_payment_tokens()[0],
					],
				],
			],
			$payment_meta1
		);

		$this->assertEquals(
			[
				'some-key'        => 'some-value',
				'wc_order_tokens' => [
					'token' => [
						'label' => 'Saved payment method',
						'value' => $subscription->get_payment_tokens()[0],
					],
				],
			],
			$payment_meta2
		);
	}

	public function test_append_payment_meta_non_wcpay() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );

		$order = WC_Helper_Order::create_order( self::USER_ID );
		$order->set_payment_method( $this->wcpay_gateway->id );

		$payment_meta = $this->wcpay_gateway->append_payment_meta( [ 'something' ], $order, $subscription );

		$this->assertEquals(
			[ 'something' ],
			$payment_meta
		);
	}

	public function test_append_payment_meta_invalid_payment_meta() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );
		$order        = WC_Helper_Order::create_order( self::USER_ID );

		$payment_meta = $this->wcpay_gateway->append_payment_meta( 'non-array', $order, $subscription );

		$this->assertEquals(
			'non-array',
			$payment_meta
		);
	}

	public function test_update_subscription_token_from_wcpay_to_wcpay() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );
		$token1       = WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID );
		$token2       = WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID );

		$subscription->set_payment_method( $this->wcpay_gateway->id );
		$subscription->update_meta_data( '_payment_method_id', $token1->get_token() );
		$subscription->add_payment_token( $token1 );
		$subscription->save();

		$updated             = $this->wcpay_gateway->update_subscription_token( false, $subscription, $token2 );
		$subscription_tokens = $subscription->get_payment_tokens();

		$this->assertSame( $token2->get_id(), end( $subscription_tokens ) );
		$this->assertSame( $updated, true );
		$this->assertSame( $token2->get_token(), $subscription->get_meta_data( '_payment_method_id' )[0]->get_data()['value'] );
	}

	public function test_update_subscription_token_from_non_wcpay_to_wcpay() {
		$subscription = WC_Helper_Order::create_order( self::USER_ID );
		$token        = WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID );

		$subscription->set_payment_method( 'bacs' );
		$subscription->save();

		$updated             = $this->wcpay_gateway->update_subscription_token( false, $subscription, $token );
		$subscription_tokens = $subscription->get_payment_tokens();

		$this->assertSame( $token->get_id(), end( $subscription_tokens ) );
		$this->assertSame( $updated, true );
	}

	public function test_update_subscription_token_not_wcpay() {
		$subscription    = WC_Helper_Order::create_order( self::USER_ID );
		$non_wcpay_token = WC_Helper_Token::create_token( self::PAYMENT_METHOD_ID, self::USER_ID, 'not_poocommerce_payments' );

		$updated             = $this->wcpay_gateway->update_subscription_token( false, $subscription, $non_wcpay_token );
		$subscription_tokens = $subscription->get_payment_tokens();

		$this->assertSame( $updated, false );
	}

	private function mock_wcs_get_subscriptions_for_order( $subscriptions ) {
		WC_Subscriptions::set_wcs_get_subscriptions_for_order(
			function ( $order ) use ( $subscriptions ) {
				return $subscriptions;
			}
		);
	}

	private function mock_wcs_is_subscription( $return_value ) {
		WC_Subscriptions::set_wcs_is_subscription(
			function ( $order ) use ( $return_value ) {
				return $return_value;
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
}
