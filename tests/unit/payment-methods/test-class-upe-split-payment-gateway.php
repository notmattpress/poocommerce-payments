<?php
/**
 * Class WC_Payment_Gateway_WCPay_Test
 *
 * @package PooCommerce\Payments\Tests
 */

namespace WCPay\Payment_Methods;

use PHPUnit\Framework\MockObject\MockObject;
use WC_Payments_Fraud_Service;
use WCPay\Constants\Order_Status;
use WCPay\Constants\Intent_Status;
use WCPay\Core\Server\Request\Get_Setup_Intention;
use WCPay\WooPay\WooPay_Utilities;
use WCPay\Session_Rate_Limiter;
use WCPAY_UnitTestCase;
use WC_Helper_Order;
use WC_Helper_Intention;
use WC_Helper_Token;
use WC_Payments_Account;
use WC_Payments_Action_Scheduler_Service;
use WC_Payments_API_Client;
use WC_Payments_Customer_Service;
use WC_Payment_Gateway_WCPay;
use WC_Payments_Order_Service;
use WC_Payments_Token_Service;
use WCPay\Constants\Payment_Method;
use WCPay\Core\Server\Request\Get_Intention;
use WCPay\Duplicate_Payment_Prevention_Service;
use WCPay\Payment_Information;
use WC_Payments;
use WC_Payments_Localization_Service;
use WCPay\Core\Server\Request\Create_And_Confirm_Intention;
use WCPay\Database_Cache;
use WCPay\Duplicates_Detection_Service;
use WCPay\Internal\Service\Level3Service;
use WCPay\Internal\Service\OrderService;
/**
 * WC_Payment_Gateway_WCPay unit tests
 */
class UPE_Split_Payment_Gateway_Test extends WCPAY_UnitTestCase {

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
	 * WC_Payments_Order_Service.
	 *
	 * @var WC_Payments_Order_Service|MockObject
	 */
	private $order_service;

	/**
	 * Array of mock UPE payment methods.
	 *
	 * @var array
	 */
	private $mock_payment_methods;

	/**
	 * Array of mock UPE payment gateways created by individual payment methods.
	 *
	 * @var array
	 */
	private $mock_payment_gateways;

	/**
	 * WC_Payments_Account instance.
	 *
	 * @var WC_Payments_Account|MockObject
	 */
	private $mock_wcpay_account;

	/**
	 * WooPay_Utilities instance.
	 *
	 * @var WooPay_Utilities|MockObject
	 */
	private $mock_woopay_utilities;

	/**
	 * Duplicate Payments Prevention Service.
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
	 * @var string Mocked value of return_url.
	 */
	private $icon_url = 'test_icon_url';

	/**
	 * Mocked object to be used as response from process_payment_using_saved_method()
	 *
	 * @var array
	 */
	private $mock_payment_result = [
		'result'         => 'success',
		'payment_needed' => true,
		'redirect'       => 'testURL/key=mock_order_key',
	];

	/**
	 * WC_Payments_Localization_Service instance.
	 *
	 * @var WC_Payments_Localization_Service
	 */
	private $mock_localization_service;

	/**
	 * Mock Fraud Service.
	 *
	 * @var WC_Payments_Fraud_Service|MockObject
	 */
	private $mock_fraud_service;

		/**
		 * Mock Duplicates Detection Service.
		 *
		 * @var Duplicates_Detection_Service
		 */
	private $mock_duplicates_detection_service;

	/**
	 * Mapping for payment ID to payment method.
	 *
	 * @var array
	 */
	private $payment_method_classes = [
		Payment_Method::CARD       => CC_Payment_Method::class,
		Payment_Method::GIROPAY    => Giropay_Payment_Method::class,
		Payment_Method::SOFORT     => Sofort_Payment_Method::class,
		Payment_Method::BANCONTACT => Bancontact_Payment_Method::class,
		Payment_Method::EPS        => EPS_Payment_Method::class,
		Payment_Method::P24        => P24_Payment_Method::class,
		Payment_Method::IDEAL      => Ideal_Payment_Method::class,
		Payment_Method::SEPA       => Sepa_Payment_Method::class,
		Payment_Method::BECS       => Becs_Payment_Method::class,
		Payment_Method::LINK       => Link_Payment_Method::class,
	];

	/**
	 * Pre-test setup
	 */
	public function set_up() {
		parent::set_up();

		$this->mock_payment_gateways = [];
		$this->mock_payment_methods  = [];

		// Mock the main class's cache service.
		$this->_cache     = WC_Payments::get_database_cache();
		$this->mock_cache = $this->createMock( Database_Cache::class );
		WC_Payments::set_database_cache( $this->mock_cache );

		// Arrange: Mock WC_Payments_API_Client so we can configure the
		// return value of create_and_confirm_intention().
		// Note that we cannot use createStub here since it's not defined in PHPUnit 6.5.
		$this->mock_api_client = $this->getMockBuilder( 'WC_Payments_API_Client' )
			->disableOriginalConstructor()
			->setMethods(
				[
					'create_intention',
					'create_setup_intention',
					'update_intention',
					'get_intent',
					'get_payment_method',
					'is_server_connected',
					'get_charge',
					'get_timeline',
				]
			)
			->getMock();

		$this->mock_wcpay_account = $this->createMock( WC_Payments_Account::class );
		$this->mock_wcpay_account->method( 'get_account_country' )->willReturn( 'US' );
		$this->mock_wcpay_account->method( 'get_account_default_currency' )->willReturn( 'USD' );

		$payment_methods = [
			'link' => [
				'base' => 0.1,
			],
		];

		$this->mock_wcpay_account
			->expects( $this->any() )
			->method( 'get_fees' )
			->willReturn( $payment_methods );

		$this->mock_woopay_utilities = $this->createMock( WooPay_Utilities::class );

		// Arrange: Mock WC_Payments_Customer_Service so its methods aren't called directly.
		$this->mock_customer_service = $this->getMockBuilder( 'WC_Payments_Customer_Service' )
			->disableOriginalConstructor()
			->getMock();

		// Arrange: Mock WC_Payments_Customer_Service so its methods aren't called directly.
		$this->mock_token_service = $this->getMockBuilder( 'WC_Payments_Token_Service' )
			->disableOriginalConstructor()
			->setMethods( [ 'add_payment_method_to_user' ] )
			->getMock();

		// Arrange: Mock WC_Payments_Action_Scheduler_Service so its methods aren't called directly.
		$this->mock_action_scheduler_service = $this->getMockBuilder( 'WC_Payments_Action_Scheduler_Service' )
			->disableOriginalConstructor()
			->getMock();

		$this->mock_rate_limiter = $this->createMock( Session_Rate_Limiter::class );
		$this->order_service     = new WC_Payments_Order_Service( $this->mock_api_client );

		$this->mock_dpps = $this->createMock( Duplicate_Payment_Prevention_Service::class );

		$this->mock_localization_service         = $this->createMock( WC_Payments_Localization_Service::class );
		$this->mock_fraud_service                = $this->createMock( WC_Payments_Fraud_Service::class );
		$this->mock_duplicates_detection_service = $this->createMock( Duplicates_Detection_Service::class );

		// Arrange: Define a $_POST array which includes the payment method,
		// so that get_payment_method_from_request() does not throw error.
		$_POST = [
			'wcpay-payment-method' => 'pm_mock',
			'payment_method'       => WC_Payment_Gateway_WCPay::GATEWAY_ID,
		];

		$get_payment_gateway_by_id_return_value_map = [];

		foreach ( $this->payment_method_classes as $payment_method_id => $payment_method_class ) {
			$mock_payment_method = $this->getMockBuilder( $payment_method_class )
				->setConstructorArgs( [ $this->mock_token_service ] )
				->setMethods( [ 'is_subscription_item_in_cart', 'get_icon' ] )
				->getMock();
			$this->mock_payment_methods[ $mock_payment_method->get_id() ] = $mock_payment_method;

			$mock_gateway = $this->getMockBuilder( WC_Payment_Gateway_WCPay::class )
				->setConstructorArgs(
					[
						$this->mock_api_client,
						$this->mock_wcpay_account,
						$this->mock_customer_service,
						$this->mock_token_service,
						$this->mock_action_scheduler_service,
						$mock_payment_method,
						$this->mock_payment_methods,
						$this->order_service,
						$this->mock_dpps,
						$this->mock_localization_service,
						$this->mock_fraud_service,
						$this->mock_duplicates_detection_service,
						$this->mock_rate_limiter,
					]
				)
				->setMethods(
					[
						'get_return_url',
						'manage_customer_details_for_order',
						'parent_process_payment',
						'get_upe_enabled_payment_method_statuses',
						'is_payment_recurring',
						'get_payment_method_ids_enabled_at_checkout',
						'wc_payments_get_payment_gateway_by_id',
						'get_selected_payment_method',
					]
				)
				->getMock();

			// Arrange: Set the return value of get_return_url() so it can be used in a test later.
			$mock_gateway
				->expects( $this->any() )
				->method( 'get_return_url' )
				->will(
					$this->returnValue( $this->return_url )
				);
			$mock_gateway
				->expects( $this->any() )
				->method( 'parent_process_payment' )
				->will(
					$this->returnValue( $this->mock_payment_result )
				);

			$this->mock_payment_gateways[ $payment_method_id ] = $mock_gateway;

			$get_payment_gateway_by_id_return_value_map[] = [ $payment_method_id, $mock_gateway ];

			WC_Helper_Site_Currency::$mock_site_currency = '';
		}

		foreach ( $this->mock_payment_gateways as $id => $mock_gateway ) {
			$mock_gateway->expects( $this->any() )
				->method( 'wc_payments_get_payment_gateway_by_id' )
				->will(
					$this->returnValueMap( $get_payment_gateway_by_id_return_value_map )
				);
		}

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

	/**
	 * Cleanup after tests.
	 *
	 * @return void
	 */
	public function tear_down() {
		parent::tear_down();
		WC_Payments::set_database_cache( $this->_cache );
		wcpay_get_test_container()->reset_all_replacements();
	}

	/**
	 * Test the UI <div> container that will hold the payment method.
	 *
	 * @return void
	 */
	public function test_display_gateway_html_for_multiple_gateways() {
		foreach ( $this->mock_payment_gateways as $payment_method_id => $mock_payment_gateway ) {
			/**
			* This tests each payment method output separately without concatenating the output
			* into 1 single buffer. Each iteration has 1 assertion.
			*/
			ob_start();
			$mock_payment_gateway->display_gateway_html();
			$actual_output = ob_get_contents();
			ob_end_clean();

			$this->assertStringContainsString( '<div class="wcpay-upe-element" data-payment-method-type="' . $payment_method_id . '"></div>', $actual_output );
		}
	}

	public function test_should_not_use_stripe_platform_on_checkout_page_for_upe() {
		$payment_gateway = $this->mock_payment_gateways[ Payment_Method::SEPA ];
		$this->assertFalse( $payment_gateway->should_use_stripe_platform_on_checkout_page() );
	}

	public function test_link_payment_method_requires_mandate_data() {
		$mock_upe_gateway = $this->mock_payment_gateways[ Payment_Method::CARD ];

		$mock_upe_gateway->update_option( 'upe_enabled_payment_method_ids', [ 'link' ] );

		$this->assertTrue( $mock_upe_gateway->is_mandate_data_required() );
	}

	public function test_sepa_debit_payment_method_requires_mandate_data() {
		$mock_upe_gateway = $this->mock_payment_gateways[ Payment_Method::SEPA ];
		$this->assertTrue( $mock_upe_gateway->is_mandate_data_required() );
	}

	public function test_non_required_mandate_data() {
		$mock_gateway_not_requiring_mandate_data = $this->mock_payment_gateways[ Payment_Method::GIROPAY ];
		$this->assertFalse( $mock_gateway_not_requiring_mandate_data->is_mandate_data_required() );
	}

	public function test_non_reusable_payment_method_is_not_available_when_subscription_is_in_cart() {
		$non_reusable_payment_method = Payment_Method::BANCONTACT;
		$payment_gateway             = $this->mock_payment_gateways[ $non_reusable_payment_method ];

		$this->set_cart_contains_subscription_items( true );

		$this->assertFalse( $payment_gateway->is_available() );
	}

	public function test_process_payment_returns_correct_redirect_when_using_saved_payment() {
		$mock_card_payment_gateway = $this->mock_payment_gateways[ Payment_Method::CARD ];
		$user                      = wp_get_current_user();
		$customer_id               = 'cus_mock';

		$order = WC_Helper_Order::create_order();
		$_POST = $this->setup_saved_payment_method();
		$mock_card_payment_gateway->expects( $this->once() )
			->method( 'manage_customer_details_for_order' )
			->will(
				$this->returnValue( [ $user, $customer_id ] )
			);
		$mock_card_payment_gateway->update_option( 'upe_enabled_payment_method_ids', [ Payment_Method::CARD ] );
		$this->mock_wcpay_request( Create_And_Confirm_Intention::class, 1 )
			->expects( $this->once() )
			->method( 'format_response' )
			->willReturn(
				WC_Helper_Intention::create_intention( [ 'status' => Intent_Status::PROCESSING ] )
			);

		$this->set_cart_contains_subscription_items( false );

		$result = $mock_card_payment_gateway->process_payment( $order->get_id() );

		$this->assertEquals( 'success', $result['result'] );
		$this->assertEquals( $this->return_url, $result['redirect'] );
	}

	public function test_upe_process_payment_check_session_order_redirect_to_previous_order() {
		$_POST['wc_payment_intent_id'] = 'pi_mock';
		$mock_upe_gateway              = $this->mock_payment_gateways[ Payment_Method::SEPA ];

		$response = [
			'dummy_result' => 'xyz',
		];

		// Arrange the order is being processed.
		$order    = WC_Helper_Order::create_order();
		$order_id = $order->get_id();

		// Arrange the DPPs to return a redirect.
		$this->mock_dpps->expects( $this->once() )
			->method( 'check_against_session_processing_order' )
			->with( wc_get_order( $order ) )
			->willReturn( $response );

		// Act: process the order but redirect to the previous/session paid order.
		$result = $mock_upe_gateway->process_payment( $order_id );

		// Assert: the result of check_against_session_processing_order.
		$this->assertSame( $response, $result );
	}

	public function test_process_redirect_payment_intent_processing() {
		$mock_upe_gateway = $this->mock_payment_gateways[ Payment_Method::CARD ];
		$order            = WC_Helper_Order::create_order();

		$order_id            = $order->get_id();
		$save_payment_method = false;
		$user                = wp_get_current_user();
		$intent_status       = Intent_Status::PROCESSING;
		$intent_metadata     = [ 'order_id' => (string) $order_id ];
		$charge_id           = 'ch_mock';
		$customer_id         = 'cus_mock';
		$intent_id           = 'pi_mock';
		$payment_method_id   = 'pm_mock';

		// Supply the order with the intent id so that it can be retrieved during the redirect payment processing.
		$order->update_meta_data( '_intent_id', $intent_id );
		$order->save();

		$card_method = $this->mock_payment_methods['card'];

		$payment_intent = WC_Helper_Intention::create_intention(
			[
				'status'   => $intent_status,
				'metadata' => $intent_metadata,
			]
		);

		$mock_upe_gateway->expects( $this->once() )
			->method( 'manage_customer_details_for_order' )
			->will(
				$this->returnValue( [ $user, $customer_id ] )
			);

		$mock_upe_gateway->expects( $this->any() )
			->method( 'get_selected_payment_method' )
			->willReturn( $card_method );

		$this->mock_wcpay_request( Get_Intention::class, 1, $intent_id )
			->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $payment_intent );

		$this->set_cart_contains_subscription_items( false );

		$mock_upe_gateway->process_redirect_payment( $order, $intent_id, $save_payment_method );

		$result_order = wc_get_order( $order_id );
		$note         = wc_get_order_notes(
			[
				'order_id' => $order_id,
				'limit'    => 1,
			]
		)[0];

		$this->assertStringContainsString( 'authorized', $note->content );
		$this->assertEquals( $intent_id, $result_order->get_meta( '_intent_id', true ) );
		$this->assertEquals( $charge_id, $result_order->get_meta( '_charge_id', true ) );
		$this->assertEquals( $intent_status, $result_order->get_meta( '_intention_status', true ) );
		$this->assertEquals( $payment_method_id, $result_order->get_meta( '_payment_method_id', true ) );
		$this->assertEquals( $customer_id, $result_order->get_meta( '_stripe_customer_id', true ) );
		$this->assertEquals( Order_Status::ON_HOLD, $result_order->get_status() );
	}

	public function test_process_redirect_payment_intent_succeded() {

		$mock_upe_gateway = $this->mock_payment_gateways[ Payment_Method::CARD ];
		$order            = WC_Helper_Order::create_order();

		$order_id            = $order->get_id();
		$save_payment_method = false;
		$user                = wp_get_current_user();
		$intent_status       = Intent_Status::SUCCEEDED;
		$intent_metadata     = [ 'order_id' => (string) $order_id ];
		$charge_id           = 'ch_mock';
		$customer_id         = 'cus_mock';
		$intent_id           = 'pi_mock';
		$payment_method_id   = 'pm_mock';

		// Supply the order with the intent id so that it can be retrieved during the redirect payment processing.
		$order->update_meta_data( '_intent_id', $intent_id );
		$order->save();

		$card_method = $this->mock_payment_methods['card'];

		$payment_intent = WC_Helper_Intention::create_intention(
			[
				'status'   => $intent_status,
				'metadata' => $intent_metadata,
			]
		);

		$mock_upe_gateway->expects( $this->once() )
			->method( 'manage_customer_details_for_order' )
			->will(
				$this->returnValue( [ $user, $customer_id ] )
			);

		$this->mock_wcpay_request( Get_Intention::class, 1, $intent_id )
			->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $payment_intent );

		$mock_upe_gateway->expects( $this->any() )
			->method( 'get_selected_payment_method' )
			->willReturn( $card_method );

		$this->set_cart_contains_subscription_items( false );

		$mock_upe_gateway->process_redirect_payment( $order, $intent_id, $save_payment_method );

		$result_order = wc_get_order( $order_id );

		$this->assertEquals( $intent_id, $result_order->get_meta( '_intent_id', true ) );
		$this->assertEquals( $charge_id, $result_order->get_meta( '_charge_id', true ) );
		$this->assertEquals( $intent_status, $result_order->get_meta( '_intention_status', true ) );
		$this->assertEquals( $payment_method_id, $result_order->get_meta( '_payment_method_id', true ) );
		$this->assertEquals( $customer_id, $result_order->get_meta( '_stripe_customer_id', true ) );
		$this->assertEquals( Order_Status::PROCESSING, $result_order->get_status() );
	}

	public function is_proper_intent_used_with_order_returns_false() {
		$this->assertFalse( $this->mock_upe_gateway->is_proper_intent_used_with_order( WC_Helper_Order::create_order(), 'wrong_intent_id' ) );
	}

	public function test_process_redirect_setup_intent_succeded() {

		$order            = WC_Helper_Order::create_order();
		$mock_upe_gateway = $this->mock_payment_gateways[ Payment_Method::CARD ];

		$order_id            = $order->get_id();
		$save_payment_method = true;
		$user                = wp_get_current_user();
		$intent_status       = Intent_Status::SUCCEEDED;
		$client_secret       = 'cs_mock';
		$customer_id         = 'cus_mock';
		$intent_id           = 'si_mock';
		$payment_method_id   = 'pm_mock';
		$token               = WC_Helper_Token::create_token( $payment_method_id );

		// Supply the order with the intent id so that it can be retrieved during the redirect payment processing.
		$order->update_meta_data( '_intent_id', $intent_id );
		$order->save();

		$card_method = $this->mock_payment_methods['card'];

		$order->set_shipping_total( 0 );
		$order->set_shipping_tax( 0 );
		$order->set_cart_tax( 0 );
		$order->set_total( 0 );
		$order->save();

		$setup_intent = WC_Helper_Intention::create_setup_intention(
			[
				'id'                     => $intent_id,
				'client_secret'          => $client_secret,
				'status'                 => $intent_status,
				'payment_method'         => $payment_method_id,
				'payment_method_options' => [
					'card' => [
						'request_three_d_secure' => 'automatic',
					],
				],
				'last_setup_error'       => [],
			]
		);

		$mock_upe_gateway->expects( $this->once() )
			->method( 'manage_customer_details_for_order' )
			->will(
				$this->returnValue( [ $user, $customer_id ] )
			);

		$request = $this->mock_wcpay_request( Get_Setup_Intention::class, 1, $intent_id );

		$request->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $setup_intent );

		$this->mock_token_service->expects( $this->once() )
			->method( 'add_payment_method_to_user' )
			->will(
				$this->returnValue( $token )
			);

		$mock_upe_gateway->expects( $this->any() )
			->method( 'get_selected_payment_method' )
			->willReturn( $card_method );

		$this->set_cart_contains_subscription_items( true );

		$mock_upe_gateway->process_redirect_payment( $order, $intent_id, $save_payment_method );

		$result_order = wc_get_order( $order_id );

		$this->assertEquals( $intent_id, $result_order->get_meta( '_intent_id', true ) );
		$this->assertEquals( $intent_status, $result_order->get_meta( '_intention_status', true ) );
		$this->assertEquals( $payment_method_id, $result_order->get_meta( '_payment_method_id', true ) );
		$this->assertEquals( $customer_id, $result_order->get_meta( '_stripe_customer_id', true ) );
		$this->assertEquals( Order_Status::PROCESSING, $result_order->get_status() );
		$this->assertEquals( 1, count( $result_order->get_payment_tokens() ) );
	}

	public function test_process_redirect_payment_save_payment_token() {

		$mock_upe_gateway = $this->mock_payment_gateways[ Payment_Method::CARD ];

		$order               = WC_Helper_Order::create_order();
		$order_id            = $order->get_id();
		$save_payment_method = true;
		$user                = wp_get_current_user();
		$intent_status       = Intent_Status::PROCESSING;
		$intent_metadata     = [ 'order_id' => (string) $order_id ];
		$charge_id           = 'ch_mock';
		$customer_id         = 'cus_mock';
		$intent_id           = 'pi_mock';
		$payment_method_id   = 'pm_mock';
		$token               = WC_Helper_Token::create_token( $payment_method_id );

		// Supply the order with the intent id so that it can be retrieved during the redirect payment processing.
		$order->update_meta_data( '_intent_id', $intent_id );
		$order->save();

		$card_method = $this->mock_payment_methods['card'];

		$payment_intent = WC_Helper_Intention::create_intention(
			[
				'status'   => $intent_status,
				'metadata' => $intent_metadata,
			]
		);

		$mock_upe_gateway->expects( $this->once() )
			->method( 'manage_customer_details_for_order' )
			->will(
				$this->returnValue( [ $user, $customer_id ] )
			);

		$this->mock_wcpay_request( Get_Intention::class, 1, $intent_id )
			->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $payment_intent );

		$this->mock_token_service->expects( $this->once() )
			->method( 'add_payment_method_to_user' )
			->will(
				$this->returnValue( $token )
			);

		$mock_upe_gateway->expects( $this->any() )
			->method( 'get_selected_payment_method' )
			->willReturn( $card_method );

		$this->set_cart_contains_subscription_items( false );

		$mock_upe_gateway->process_redirect_payment( $order, $intent_id, $save_payment_method );

		$result_order = wc_get_order( $order_id );
		$note         = wc_get_order_notes(
			[
				'order_id' => $order_id,
				'limit'    => 1,
			]
		)[0];

		$this->assertStringContainsString( 'authorized', $note->content );
		$this->assertEquals( $intent_id, $result_order->get_meta( '_intent_id', true ) );
		$this->assertEquals( $charge_id, $result_order->get_meta( '_charge_id', true ) );
		$this->assertEquals( $intent_status, $result_order->get_meta( '_intention_status', true ) );
		$this->assertEquals( $payment_method_id, $result_order->get_meta( '_payment_method_id', true ) );
		$this->assertEquals( $customer_id, $result_order->get_meta( '_stripe_customer_id', true ) );
		$this->assertEquals( Order_Status::ON_HOLD, $result_order->get_status() );
		$this->assertEquals( 1, count( $result_order->get_payment_tokens() ) );
	}

	public function test_correct_payment_method_title_for_order() {
		$order = WC_Helper_Order::create_order();

		$visa_credit_details       = [
			'type' => 'card',
			'card' => [
				'network' => 'visa',
				'funding' => 'credit',
			],
		];
		$visa_debit_details        = [
			'type' => 'card',
			'card' => [
				'network' => 'visa',
				'funding' => 'debit',
			],
		];
		$mastercard_credit_details = [
			'type' => 'card',
			'card' => [
				'network' => 'mastercard',
				'funding' => 'credit',
			],
		];
		$eps_details               = [
			'type' => 'eps',
		];
		$giropay_details           = [
			'type' => 'giropay',
		];
		$p24_details               = [
			'type' => 'p24',
		];
		$sofort_details            = [
			'type' => 'sofort',
		];
		$bancontact_details        = [
			'type' => 'bancontact',
		];
		$sepa_details              = [
			'type' => 'sepa_debit',
		];
		$ideal_details             = [
			'type' => 'ideal',
		];
		$becs_details              = [
			'type' => 'au_becs_debit',
		];

		$charge_payment_method_details = [
			$visa_credit_details,
			$visa_debit_details,
			$mastercard_credit_details,
			$giropay_details,
			$sofort_details,
			$bancontact_details,
			$eps_details,
			$p24_details,
			$ideal_details,
			$sepa_details,
			$becs_details,
		];

		$expected_payment_method_titles = [
			'Visa credit card',
			'Visa debit card',
			'Mastercard credit card',
			'giropay',
			'Sofort',
			'Bancontact',
			'EPS',
			'Przelewy24 (P24)',
			'iDEAL',
			'SEPA Direct Debit',
			'BECS Direct Debit',
		];

		foreach ( $charge_payment_method_details as $i => $payment_method_details ) {
			$payment_method_id = $payment_method_details['type'];
			$mock_upe_gateway  = $this->mock_payment_gateways[ $payment_method_id ];
			$payment_method    = $this->mock_payment_methods[ $payment_method_id ];
			$mock_upe_gateway->expects( $this->any() )
				->method( 'get_selected_payment_method' )
				->willReturn( $payment_method );
			$mock_upe_gateway->set_payment_method_title_for_order( $order, $payment_method_id, $payment_method_details );
			$this->assertEquals( $expected_payment_method_titles[ $i ], $order->get_payment_method_title() );
		}
	}

	public function test_process_payment_sets_card_payment_method_and_title() {
		$mock_card_payment_gateway = $this->mock_payment_gateways[ Payment_Method::CARD ];
		$user                      = wp_get_current_user();
		$customer_id               = 'cus_mock';
		$intent_id                 = 'pi_mock';
		$payment_method_id         = 'pm_mock';

		$order = WC_Helper_Order::create_order();
		$_POST = [
			'wcpay-payment-method' => $payment_method_id,
			'payment_method'       => WC_Payment_Gateway_WCPay::GATEWAY_ID . '_' . Payment_Method::CARD,
		];

		$mock_card_payment_gateway->expects( $this->once() )
			->method( 'manage_customer_details_for_order' )
			->will(
				$this->returnValue( [ $user, $customer_id ] )
			);

		$card_method = $this->mock_payment_methods[ Payment_Method::CARD ];
		$mock_card_payment_gateway->expects( $this->any() )
			->method( 'get_selected_payment_method' )
			->willReturn( $card_method );

		$mock_card_payment_gateway->update_option( 'upe_enabled_payment_method_ids', [ Payment_Method::CARD ] );

		$payment_intent = WC_Helper_Intention::create_intention(
			[
				'status'            => Intent_Status::SUCCEEDED,
				'id'                => $intent_id,
				'payment_method_id' => $payment_method_id,
				'charge'            => [
					'payment_method_details' => [
						'type' => 'card',
						'card' => [
							'network' => 'visa',
							'funding' => 'credit',
							'last4'   => '4242',
							'brand'   => 'visa',
						],
					],
				],
			]
		);

		$this->mock_wcpay_request( Create_And_Confirm_Intention::class, 1 )
			->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $payment_intent );

		$this->set_cart_contains_subscription_items( false );

		$result = $mock_card_payment_gateway->process_payment( $order->get_id() );

		// reloading the order to get the updated data.
		$result_order = wc_get_order( $order->get_id() );

		$this->assertEquals( 'success', $result['result'] );
		$this->assertEquals( WC_Payment_Gateway_WCPay::GATEWAY_ID, $result_order->get_payment_method() );
		$this->assertEquals( 'Visa credit card', $result_order->get_payment_method_title() );
		$this->assertEquals( '4242', $result_order->get_meta( 'last4', true ) );
		$this->assertEquals( 'visa', $result_order->get_meta( '_card_brand', true ) );
	}

	public function test_process_payment_sets_sepa_payment_method_and_title() {
		$mock_sepa_payment_gateway = $this->mock_payment_gateways[ Payment_Method::SEPA ];
		$user                      = wp_get_current_user();
		$customer_id               = 'cus_mock';
		$intent_id                 = 'pi_mock';
		$payment_method_id         = 'pm_mock';

		$order = WC_Helper_Order::create_order();
		$_POST = [
			'wcpay-payment-method' => $payment_method_id,
			'payment_method'       => 'poocommerce_payments_sepa_debit',
		];

		$mock_sepa_payment_gateway->expects( $this->once() )
			->method( 'manage_customer_details_for_order' )
			->will(
				$this->returnValue( [ $user, $customer_id ] )
			);

		$mock_sepa_payment_gateway->expects( $this->any() )
			->method( 'get_selected_payment_method' )
			->willReturn( $this->mock_payment_methods[ Payment_Method::SEPA ] );

		$mock_sepa_payment_gateway->update_option( 'upe_enabled_payment_method_ids', [ Payment_Method::CARD, Payment_Method::SEPA ] );

		$payment_intent = WC_Helper_Intention::create_intention(
			[
				'status'            => Intent_Status::REQUIRES_ACTION,
				'id'                => $intent_id,
				'payment_method_id' => $payment_method_id,
				'charge'            => [
					'payment_method_details' => [
						'type' => 'sepa_debit',
					],
				],
			]
		);

		$this->mock_wcpay_request( Create_And_Confirm_Intention::class, 1 )
			->expects( $this->once() )
			->method( 'format_response' )
			->willReturn( $payment_intent );

		$this->set_cart_contains_subscription_items( false );

		$result = $mock_sepa_payment_gateway->process_payment( $order->get_id() );

		// reloading the order to get the updated data.
		$result_order = wc_get_order( $order->get_id() );

		$this->assertEquals( 'success', $result['result'] );
		$this->assertEquals( 'poocommerce_payments_sepa_debit', $result_order->get_payment_method() );
		$this->assertEquals( 'SEPA Direct Debit', $result_order->get_payment_method_title() );
		$this->assertEquals( null, $result_order->get_meta( 'last4', true ) );
		$this->assertEquals( null, $result_order->get_meta( '_card_brand', true ) );
	}

	public function test_payment_methods_show_correct_default_outputs() {
		$mock_token = WC_Helper_Token::create_token( 'pm_mock' );
		$this->mock_token_service->expects( $this->any() )
			->method( 'add_payment_method_to_user' )
			->will(
				$this->returnValue( $mock_token )
			);

		$mock_user              = 'mock_user';
		$mock_payment_method_id = 'pm_mock';

		$mock_visa_details       = [
			'type' => 'card',
			'card' => [
				'network' => 'visa',
				'funding' => 'debit',
			],
		];
		$mock_mastercard_details = [
			'type' => 'card',
			'card' => [
				'network' => 'mastercard',
				'funding' => 'credit',
			],
		];
		$mock_giropay_details    = [
			'type' => 'giropay',
		];
		$mock_p24_details        = [
			'type' => 'p24',
		];
		$mock_sofort_details     = [
			'type' => 'sofort',
		];
		$mock_bancontact_details = [
			'type' => 'bancontact',
		];
		$mock_eps_details        = [
			'type' => 'eps',
		];
		$mock_sepa_details       = [
			'type' => 'sepa_debit',
		];
		$mock_ideal_details      = [
			'type' => 'ideal',
		];
		$mock_becs_details       = [
			'type' => 'au_becs_debit',
		];

		$this->set_cart_contains_subscription_items( false );
		$card_method       = $this->mock_payment_methods['card'];
		$giropay_method    = $this->mock_payment_methods['giropay'];
		$p24_method        = $this->mock_payment_methods['p24'];
		$sofort_method     = $this->mock_payment_methods['sofort'];
		$bancontact_method = $this->mock_payment_methods['bancontact'];
		$eps_method        = $this->mock_payment_methods['eps'];
		$sepa_method       = $this->mock_payment_methods['sepa_debit'];
		$ideal_method      = $this->mock_payment_methods['ideal'];
		$becs_method       = $this->mock_payment_methods['au_becs_debit'];

		$this->assertEquals( 'card', $card_method->get_id() );
		$this->assertEquals( 'Card', $card_method->get_title( 'US' ) );
		$this->assertEquals( 'Visa debit card', $card_method->get_title( 'US', $mock_visa_details ) );
		$this->assertEquals( 'Mastercard credit card', $card_method->get_title( 'US', $mock_mastercard_details ) );
		$this->assertTrue( $card_method->is_enabled_at_checkout( 'US' ) );
		$this->assertTrue( $card_method->is_reusable() );
		$this->assertEquals( $mock_token, $card_method->get_payment_token_for_user( $mock_user, $mock_payment_method_id ) );

		$this->assertEquals( 'giropay', $giropay_method->get_id() );
		$this->assertEquals( 'giropay', $giropay_method->get_title( 'US' ) );
		$this->assertEquals( 'giropay', $giropay_method->get_title( 'US', $mock_giropay_details ) );
		$this->assertTrue( $giropay_method->is_enabled_at_checkout( 'US' ) );
		$this->assertFalse( $giropay_method->is_reusable() );

		$this->assertEquals( 'p24', $p24_method->get_id() );
		$this->assertEquals( 'Przelewy24 (P24)', $p24_method->get_title( 'US' ) );
		$this->assertEquals( 'Przelewy24 (P24)', $p24_method->get_title( 'US', $mock_p24_details ) );
		$this->assertTrue( $p24_method->is_enabled_at_checkout( 'US' ) );
		$this->assertFalse( $p24_method->is_reusable() );

		$this->assertEquals( 'sofort', $sofort_method->get_id() );
		$this->assertEquals( 'Sofort', $sofort_method->get_title( 'US' ) );
		$this->assertEquals( 'Sofort', $sofort_method->get_title( 'US', $mock_sofort_details ) );
		$this->assertTrue( $sofort_method->is_enabled_at_checkout( 'US' ) );
		$this->assertFalse( $sofort_method->is_reusable() );

		$this->assertEquals( 'bancontact', $bancontact_method->get_id() );
		$this->assertEquals( 'Bancontact', $bancontact_method->get_title( 'US' ) );
		$this->assertEquals( 'Bancontact', $bancontact_method->get_title( 'US', $mock_bancontact_details ) );
		$this->assertTrue( $bancontact_method->is_enabled_at_checkout( 'US' ) );
		$this->assertFalse( $bancontact_method->is_reusable() );

		$this->assertEquals( 'eps', $eps_method->get_id() );
		$this->assertEquals( 'EPS', $eps_method->get_title( 'US' ) );
		$this->assertEquals( 'EPS', $eps_method->get_title( 'US', $mock_eps_details ) );
		$this->assertTrue( $eps_method->is_enabled_at_checkout( 'US' ) );
		$this->assertFalse( $eps_method->is_reusable() );

		$this->assertEquals( 'sepa_debit', $sepa_method->get_id() );
		$this->assertEquals( 'SEPA Direct Debit', $sepa_method->get_title( 'US' ) );
		$this->assertEquals( 'SEPA Direct Debit', $sepa_method->get_title( 'US', $mock_sepa_details ) );
		$this->assertTrue( $sepa_method->is_enabled_at_checkout( 'US' ) );
		$this->assertFalse( $sepa_method->is_reusable() );

		$this->assertEquals( 'ideal', $ideal_method->get_id() );
		$this->assertEquals( 'iDEAL', $ideal_method->get_title( 'US' ) );
		$this->assertEquals( 'iDEAL', $ideal_method->get_title( 'US', $mock_ideal_details ) );
		$this->assertTrue( $ideal_method->is_enabled_at_checkout( 'US' ) );
		$this->assertFalse( $ideal_method->is_reusable() );

		$this->assertEquals( 'au_becs_debit', $becs_method->get_id() );
		$this->assertEquals( 'BECS Direct Debit', $becs_method->get_title( 'US' ) );
		$this->assertEquals( 'BECS Direct Debit', $becs_method->get_title( 'US', $mock_becs_details ) );
		$this->assertTrue( $becs_method->is_enabled_at_checkout( 'US' ) );
		$this->assertFalse( $becs_method->is_reusable() );
	}

	public function test_only_reusabled_payment_methods_enabled_with_subscription_item_present() {
		// Setup $this->mock_payment_methods.

		$this->set_cart_contains_subscription_items( true );

		$card_method       = $this->mock_payment_methods['card'];
		$giropay_method    = $this->mock_payment_methods['giropay'];
		$sofort_method     = $this->mock_payment_methods['sofort'];
		$bancontact_method = $this->mock_payment_methods['bancontact'];
		$eps_method        = $this->mock_payment_methods['eps'];
		$sepa_method       = $this->mock_payment_methods['sepa_debit'];
		$p24_method        = $this->mock_payment_methods['p24'];
		$ideal_method      = $this->mock_payment_methods['ideal'];
		$becs_method       = $this->mock_payment_methods['au_becs_debit'];

		$this->assertTrue( $card_method->is_enabled_at_checkout( 'US' ) );
		$this->assertFalse( $giropay_method->is_enabled_at_checkout( 'US' ) );
		$this->assertFalse( $sofort_method->is_enabled_at_checkout( 'US' ) );
		$this->assertFalse( $bancontact_method->is_enabled_at_checkout( 'US' ) );
		$this->assertFalse( $eps_method->is_enabled_at_checkout( 'US' ) );
		$this->assertFalse( $sepa_method->is_enabled_at_checkout( 'US' ) );
		$this->assertFalse( $p24_method->is_enabled_at_checkout( 'US' ) );
		$this->assertFalse( $ideal_method->is_enabled_at_checkout( 'US' ) );
		$this->assertFalse( $becs_method->is_enabled_at_checkout( 'US' ) );
	}

	public function test_only_valid_payment_methods_returned_for_currency() {
		// Setup $this->mock_payment_methods.

		$card_method       = $this->mock_payment_methods['card'];
		$giropay_method    = $this->mock_payment_methods['giropay'];
		$sofort_method     = $this->mock_payment_methods['sofort'];
		$bancontact_method = $this->mock_payment_methods['bancontact'];
		$eps_method        = $this->mock_payment_methods['eps'];
		$sepa_method       = $this->mock_payment_methods['sepa_debit'];
		$p24_method        = $this->mock_payment_methods['p24'];
		$ideal_method      = $this->mock_payment_methods['ideal'];
		$becs_method       = $this->mock_payment_methods['au_becs_debit'];

		WC_Helper_Site_Currency::$mock_site_currency = 'EUR';
		$account_domestic_currency                   = 'USD';

		$this->assertTrue( $card_method->is_currency_valid( $account_domestic_currency ) );
		$this->assertTrue( $giropay_method->is_currency_valid( $account_domestic_currency ) );
		$this->assertTrue( $sofort_method->is_currency_valid( $account_domestic_currency ) );
		$this->assertTrue( $bancontact_method->is_currency_valid( $account_domestic_currency ) );
		$this->assertTrue( $eps_method->is_currency_valid( $account_domestic_currency ) );
		$this->assertTrue( $sepa_method->is_currency_valid( $account_domestic_currency ) );
		$this->assertTrue( $p24_method->is_currency_valid( $account_domestic_currency ) );
		$this->assertTrue( $ideal_method->is_currency_valid( $account_domestic_currency ) );
		$this->assertFalse( $becs_method->is_currency_valid( $account_domestic_currency ) );

		WC_Helper_Site_Currency::$mock_site_currency = 'USD';

		$this->assertTrue( $card_method->is_currency_valid( $account_domestic_currency ) );
		$this->assertFalse( $giropay_method->is_currency_valid( $account_domestic_currency ) );
		$this->assertFalse( $sofort_method->is_currency_valid( $account_domestic_currency ) );
		$this->assertFalse( $bancontact_method->is_currency_valid( $account_domestic_currency ) );
		$this->assertFalse( $eps_method->is_currency_valid( $account_domestic_currency ) );
		$this->assertFalse( $sepa_method->is_currency_valid( $account_domestic_currency ) );
		$this->assertFalse( $p24_method->is_currency_valid( $account_domestic_currency ) );
		$this->assertFalse( $ideal_method->is_currency_valid( $account_domestic_currency ) );
		$this->assertFalse( $becs_method->is_currency_valid( $account_domestic_currency ) );

		WC_Helper_Site_Currency::$mock_site_currency = 'AUD';
		$this->assertTrue( $becs_method->is_currency_valid( $account_domestic_currency ) );

		WC_Helper_Site_Currency::$mock_site_currency = '';
	}

	public function test_create_token_from_setup_intent_adds_token() {

		$mock_token           = WC_Helper_Token::create_token( 'pm_mock' );
		$mock_setup_intent_id = 'si_mock';
		$mock_user            = wp_get_current_user();

		$this->mock_token_service
			->method( 'add_payment_method_to_user' )
			->with( 'pm_mock', $mock_user )
			->will(
				$this->returnValue( $mock_token )
			);

		foreach ( $this->mock_payment_gateways as $mock_upe_gateway ) {
			$request = $this->mock_wcpay_request( Get_Setup_Intention::class, 1, $mock_setup_intent_id );

			$request->expects( $this->once() )
				->method( 'format_response' )
				->willReturn(
					WC_Helper_Intention::create_setup_intention(
						[
							'id'             => $mock_setup_intent_id,
							'payment_method' => 'pm_mock',
						]
					)
				);
			$this->assertEquals( $mock_token, $mock_upe_gateway->create_token_from_setup_intent( $mock_setup_intent_id, $mock_user ) );
		}
	}

	/**
	 * Test get_payment_method_types with regular checkout post request context.
	 *
	 * @return void
	 */
	public function test_get_payment_methods_with_request_context() {
		$mock_upe_gateway = $this->getMockBuilder( WC_Payment_Gateway_WCPay::class )
			->setConstructorArgs(
				[
					$this->mock_api_client,
					$this->mock_wcpay_account,
					$this->mock_customer_service,
					$this->mock_token_service,
					$this->mock_action_scheduler_service,
					$this->mock_payment_methods[ Payment_Method::CARD ],
					$this->mock_payment_methods,
					$this->order_service,
					$this->mock_dpps,
					$this->mock_localization_service,
					$this->mock_fraud_service,
					$this->mock_duplicates_detection_service,
					$this->mock_rate_limiter,
				]
			)
			->setMethods( [ 'get_payment_methods_from_gateway_id' ] )
			->getMock();

		$order               = WC_Helper_Order::create_order();
		$payment_information = new Payment_Information( 'pm_mock', $order );

		$_POST['payment_method'] = 'poocommerce_payments';

		$mock_upe_gateway->expects( $this->once() )
			->method( 'get_payment_methods_from_gateway_id' )
			->with( 'poocommerce_payments' )
			->will(
				$this->returnValue( [ Payment_Method::CARD ] )
			);

		$payment_methods = $mock_upe_gateway->get_payment_method_types( $payment_information );

		$this->assertSame( [ Payment_Method::CARD ], $payment_methods );

		unset( $_POST['payment_method'] ); // phpcs:ignore WordPress.Security.NonceVerification
	}

	/**
	 * Test get_payment_method_types without post request context.
	 *
	 * @return void
	 */
	public function test_get_payment_methods_without_request_context() {
		$mock_upe_gateway = $this->getMockBuilder( WC_Payment_Gateway_WCPay::class )
			->setConstructorArgs(
				[
					$this->mock_api_client,
					$this->mock_wcpay_account,
					$this->mock_customer_service,
					$this->mock_token_service,
					$this->mock_action_scheduler_service,
					$this->mock_payment_methods[ Payment_Method::CARD ],
					$this->mock_payment_methods,
					$this->order_service,
					$this->mock_dpps,
					$this->mock_localization_service,
					$this->mock_fraud_service,
					$this->mock_duplicates_detection_service,
					$this->mock_rate_limiter,
				]
			)
			->setMethods( [ 'get_payment_methods_from_gateway_id' ] )
			->getMock();

		$token               = WC_Helper_Token::create_token( 'pm_mock' );
		$order               = WC_Helper_Order::create_order();
		$payment_information = new Payment_Information( 'pm_mock', $order, null, $token );

		unset( $_POST['payment_method'] ); // phpcs:ignore WordPress.Security.NonceVerification

		$mock_upe_gateway->expects( $this->once() )
			->method( 'get_payment_methods_from_gateway_id' )
			->with( $token->get_gateway_id(), $order->get_id() )
			->will(
				$this->returnValue( [ Payment_Method::CARD ] )
			);

		$payment_methods = $mock_upe_gateway->get_payment_method_types( $payment_information );

		$this->assertSame( [ Payment_Method::CARD ], $payment_methods );
	}

	/**
	 * Test get_payment_methods_from_gateway_id function with UPE enabled.
	 *
	 * @return void
	 */
	public function test_get_payment_methods_from_gateway_id_upe() {
		WC_Helper_Order::create_order();
		$mock_upe_gateway = $this->getMockBuilder( WC_Payment_Gateway_WCPay::class )
			->setConstructorArgs(
				[
					$this->mock_api_client,
					$this->mock_wcpay_account,
					$this->mock_customer_service,
					$this->mock_token_service,
					$this->mock_action_scheduler_service,
					$this->mock_payment_methods[ Payment_Method::CARD ],
					$this->mock_payment_methods,
					$this->order_service,
					$this->mock_dpps,
					$this->mock_localization_service,
					$this->mock_fraud_service,
					$this->mock_duplicates_detection_service,
					$this->mock_rate_limiter,
				]
			)
			->onlyMethods(
				[
					'get_payment_method_ids_enabled_at_checkout',
				]
			)
			->getMock();

		$gateway = WC_Payments::get_gateway();
		WC_Payments::set_gateway( $mock_upe_gateway );

		$mock_upe_gateway->update_option( 'upe_enabled_payment_method_ids', [ Payment_Method::CARD, Payment_Method::LINK ] );

		$payment_methods = $mock_upe_gateway->get_payment_methods_from_gateway_id( WC_Payment_Gateway_WCPay::GATEWAY_ID . '_' . Payment_Method::BANCONTACT );
		$this->assertSame( [ Payment_Method::BANCONTACT ], $payment_methods );

		$mock_upe_gateway->expects( $this->any() )
			->method( 'get_payment_method_ids_enabled_at_checkout' )
			->will(
				$this->onConsecutiveCalls(
					[ Payment_Method::CARD, Payment_Method::LINK ],
					[ Payment_Method::CARD ]
				)
			);

		$payment_methods = $mock_upe_gateway->get_payment_methods_from_gateway_id( WC_Payment_Gateway_WCPay::GATEWAY_ID );
		$this->assertSame( [ Payment_Method::CARD, Payment_Method::LINK ], $payment_methods );

		$payment_methods = $mock_upe_gateway->get_payment_methods_from_gateway_id( WC_Payment_Gateway_WCPay::GATEWAY_ID );
		$this->assertSame( [ Payment_Method::CARD ], $payment_methods );

		WC_Payments::set_gateway( $gateway );
	}

	/**
	 * Helper function to mock subscriptions for internal UPE payment methods.
	 */
	private function set_cart_contains_subscription_items( $cart_contains_subscriptions ) {
		foreach ( $this->mock_payment_methods as $mock_payment_method ) {
			$mock_payment_method->expects( $this->any() )
				->method( 'is_subscription_item_in_cart' )
				->will(
					$this->returnValue( $cart_contains_subscriptions )
				);
		}
	}

	private function setup_saved_payment_method() {
		$token = WC_Helper_Token::create_token( 'pm_mock' );

		return [
			'payment_method' => WC_Payment_Gateway_WCPay::GATEWAY_ID,
			'wc-' . WC_Payment_Gateway_WCPay::GATEWAY_ID . '-payment-token' => (string) $token->get_id(),
		];
	}

	private function set_get_upe_enabled_payment_method_statuses_return_value( $mock_payment_gateway, $return_value = null ) {
		if ( null === $return_value ) {
			$return_value = [
				'card_payments' => [
					'status' => 'active',
				],
			];
		}
		$mock_payment_gateway
			->expects( $this->any() )
			->method( 'get_upe_enabled_payment_method_statuses' )
			->will( $this->returnValue( $return_value ) );
	}
}
