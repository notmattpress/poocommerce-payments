<?php
/**
 * Class WC_Payments_Account_Capital_Test
 *
 * @package PooCommerce\Payments\Tests
 */

use WCPay\Core\Server\Request\Get_Account_Capital_Link;
use WCPay\Core\Server\Response;
use WCPay\Exceptions\API_Exception;
use WCPay\Database_Cache;
use PHPUnit\Framework\MockObject\MockObject;

/**
 * WC_Payments_Account unit tests for Capital-related methods.
 */
class WC_Payments_Account_Capital_Test extends WCPAY_UnitTestCase {
	/**
	 * System under test.
	 *
	 * @var WC_Payments_Account
	 */
	private $wcpay_account;

	/**
	 * Mock WC_Payments_API_Client.
	 *
	 * @var WC_Payments_API_Client|MockObject
	 */
	private $mock_api_client;

	/**
	 * Mock Database_Cache
	 *
	 * @var Database_Cache|MockObject
	 */
	private $mock_database_cache;

	/**
	 * Previous user ID.
	 * @var int
	 */
	private $previous_user_id;

	/**
	 * Mock WC_Payments_Action_Scheduler_Service
	 *
	 * @var WC_Payments_Action_Scheduler_Service|MockObject
	 */
	private $mock_action_scheduler_service;

	/**
	 * Mock WC_Payments_Onboarding_Service.
	 *
	 * @var WC_Payments_Onboarding_Service|MockObject
	 */
	private $mock_onboarding_service;

	/**
	 * Mock WC_Payments_Redirect_Service.
	 *
	 * @var WC_Payments_Redirect_Service|MockObject
	 */
	private $mock_redirect_service;

	/**
	 * Pre-test setup
	 */
	public function set_up() {
		parent::set_up();

		$this->previous_user_id = get_current_user_id();
		// Set admin as the current user.
		wp_set_current_user( 1 );

		// Set the request as if the user is requesting to view a capital offer.
		add_filter( 'wp_doing_ajax', '__return_false' );
		$_GET['wcpay-loan-offer'] = '';

		$this->mock_api_client               = $this->createMock( WC_Payments_API_Client::class );
		$this->mock_database_cache           = $this->createMock( Database_Cache::class );
		$this->mock_action_scheduler_service = $this->createMock( WC_Payments_Action_Scheduler_Service::class );
		$this->mock_onboarding_service       = $this->createMock( WC_Payments_Onboarding_Service::class );
		$this->mock_redirect_service         = $this->createMock( WC_Payments_Redirect_Service::class );

		// Mock WC_Payments_Account without redirect_to to prevent headers already sent error.
		$this->wcpay_account = $this->getMockBuilder( WC_Payments_Account::class )
			->setMethods( [ 'init_hooks' ] )
			->setConstructorArgs( [ $this->mock_api_client, $this->mock_database_cache, $this->mock_action_scheduler_service, $this->mock_onboarding_service, $this->mock_redirect_service ] )
			->getMock();
		$this->wcpay_account->init_hooks();
	}

	public function tear_down() {
		wp_set_current_user( $this->previous_user_id );

		unset( $_GET['wcpay-loan-offer'] );

		remove_filter( 'wp_doing_ajax', '__return_true' );
		remove_filter( 'wp_doing_ajax', '__return_false' );

		parent::tear_down();
	}

	public function test_maybe_redirect_by_get_param_will_run() {
		$wcpay_account = $this->getMockBuilder( WC_Payments_Account::class )
			->setMethodsExcept( [ 'init_hooks' ] )
			->setConstructorArgs( [ $this->mock_api_client, $this->mock_database_cache, $this->mock_action_scheduler_service, $this->mock_onboarding_service, $this->mock_redirect_service ] )
			->getMock();
		$wcpay_account->init_hooks();

		$this->assertNotFalse(
			has_action( 'admin_init', [ $wcpay_account, 'maybe_redirect_by_get_param' ] )
		);
	}

	public function test_maybe_redirect_to_capital_offer_skips_ajax_requests() {
		add_filter( 'wp_doing_ajax', '__return_true' );

		$this->mock_redirect_service->expects( $this->never() )->method( 'redirect_to_capital_view_offer_page' );

		$this->wcpay_account->maybe_redirect_by_get_param();
	}

	public function test_maybe_redirect_to_capital_offer_skips_non_admin_users() {
		wp_set_current_user( 0 );

		$this->mock_redirect_service->expects( $this->never() )->method( 'redirect_to_capital_view_offer_page' );

		$this->wcpay_account->maybe_redirect_by_get_param();
	}

	public function test_maybe_redirect_to_capital_offer_skips_regular_requests() {
		unset( $_GET['wcpay-loan-offer'] );

		$this->mock_redirect_service->expects( $this->never() )->method( 'redirect_to_capital_view_offer_page' );

		$this->wcpay_account->maybe_redirect_by_get_param();
	}

	public function test_maybe_redirect_to_capital_offer_redirects_to_capital_offer() {
		$this->mock_redirect_service->expects( $this->once() )->method( 'redirect_to_capital_view_offer_page' );

		$this->wcpay_account->maybe_redirect_by_get_param();
	}
}
