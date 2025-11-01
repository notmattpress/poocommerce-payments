<?php
/**
 * Class WC_Payments_Admin_Settings_Test
 *
 * @package PooCommerce\Payments\Tests
 */

use PHPUnit\Framework\MockObject\MockObject;
use WCPay\Database_Cache;

/**
 * WC_Payments_Admin_Settings unit tests.
 */
class WC_Payments_Admin_Settings_Test extends WCPAY_UnitTestCase {

	/**
	 * @var WC_Payments_Account|MockObject
	 */
	private $mock_account;

	/**
	 * @var WC_Payment_Gateway_WCPay|MockObject
	 */
	private $mock_gateway;

	/**
	 * @var WC_Payments_Admin_Settings
	 */
	private $payments_admin_settings;

	public function set_up() {
		$this->mock_gateway = $this->getMockBuilder( WC_Payment_Gateway_WCPay::class )
			->disableOriginalConstructor()
			->getMock();

		$this->mock_account = $this->getMockBuilder( WC_Payments_Account::class )
			->disableOriginalConstructor()
			->getMock();

		$this->payments_admin_settings = new WC_Payments_Admin_Settings( $this->mock_gateway, $this->mock_account );
	}

	public function test_it_does_not_show_test_mode_notice_when_not_connected() {
		// Arrange.
		$this->mock_gateway
			->expects( $this->any() )
			->method( 'is_connected' )
			->willReturn( false );

		// Act.
		ob_start();
		$this->payments_admin_settings->maybe_show_test_mode_notice();
		$result = ob_get_clean();

		// Assert.
		$this->assertStringNotContainsString( 'WooPayments is in test mode.', $result );
	}

	public function test_it_does_not_show_test_mode_notice_when_stripe_account_is_invalid() {
		// Arrange.
		$this->mock_gateway
			->expects( $this->any() )
			->method( 'is_connected' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'is_stripe_account_valid' )
			->willReturn( false );

		// Act.
		ob_start();
		$this->payments_admin_settings->maybe_show_test_mode_notice();
		$result = ob_get_clean();

		// Assert.
		$this->assertStringNotContainsString( 'WooPayments is in test mode.', $result );
	}

	public function test_it_hides_test_mode_notice_for_live_account() {
		// Arrange.
		WC_Payments::mode()->live();

		$this->mock_gateway
			->expects( $this->any() )
			->method( 'is_connected' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'is_stripe_account_valid' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_is_live' )
			->willReturn( true );

		// Act.
		ob_start();
		$this->payments_admin_settings->maybe_show_test_mode_notice();
		$result = ob_get_clean();

		// Assert.
		$this->assertStringNotContainsString( 'WooPayments is in test mode.', $result );
	}

	public function test_it_hides_test_mode_notice_for_test_account() {
		// Arrange.
		WC_Payments::mode()->live();

		$this->mock_gateway
			->expects( $this->any() )
			->method( 'is_connected' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'is_stripe_account_valid' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_is_live' )
			->willReturn( false );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_account_status_data' )
			->willReturn(
				[
					'isLive'    => false,
					'testDrive' => true,
				]
			);

		// Act.
		ob_start();
		$this->payments_admin_settings->maybe_show_test_mode_notice();
		$result = ob_get_clean();

		// Assert.
		$this->assertStringNotContainsString( 'WooPayments is in test mode.', $result );
	}

	public function test_it_hides_test_mode_notice_for_sandbox_account() {
		// Arrange.
		WC_Payments::mode()->live();

		$this->mock_gateway
			->expects( $this->any() )
			->method( 'is_connected' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'is_stripe_account_valid' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_is_live' )
			->willReturn( false );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_account_status_data' )
			->willReturn(
				[
					'isLive'    => false,
					'testDrive' => false,
				]
			);

		// Act.
		ob_start();
		$this->payments_admin_settings->maybe_show_test_mode_notice();
		$result = ob_get_clean();

		// Assert.
		$this->assertStringNotContainsString( 'WooPayments is in test mode.', $result );
	}

	public function test_it_renders_test_mode_notice_for_live_account() {
		// Arrange.
		WC_Payments::mode()->test();

		$this->mock_gateway
			->expects( $this->any() )
			->method( 'is_connected' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'is_stripe_account_valid' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_is_live' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_account_status_data' )
			->willReturn(
				[
					'isLive'    => true,
					'testDrive' => false,
				]
			);

		// Act.
		ob_start();
		$this->payments_admin_settings->maybe_show_test_mode_notice();
		$result = ob_get_clean();

		// Assert.
		$this->assertStringContainsStringIgnoringCase( 'WooPayments is in test mode', $result );
		$this->assertStringNotContainsString( 'You are using a test account.', $result );
		$this->assertStringNotContainsString( 'You are using a sandbox test account.', $result );
	}

	public function test_does_not_show_test_account_notice_when_not_connected() {
		// Arrange.
		$this->mock_gateway
			->expects( $this->any() )
			->method( 'is_connected' )
			->willReturn( false );

		// Act.
		ob_start();
		$this->payments_admin_settings->maybe_show_test_account_notice();
		$result = ob_get_clean();

		// Assert.
		$this->assertStringNotContainsString( 'You are using a test account.', $result );
	}

	public function test_it_hides_test_account_notice_for_invalid_stripe_account() {
		// Arrange.
		$this->mock_gateway
			->expects( $this->any() )
			->method( 'is_connected' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'is_stripe_account_valid' )
			->willReturn( false );

		// Act.
		ob_start();
		$this->payments_admin_settings->maybe_show_test_account_notice();
		$result = ob_get_clean();

		// Assert.
		$this->assertStringNotContainsString( 'You are using a test account.', $result );
	}

	public function test_it_hides_test_account_notice_for_live_account() {
		// Arrange.
		$this->mock_gateway
			->expects( $this->any() )
			->method( 'is_connected' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'is_stripe_account_valid' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_is_live' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_account_status_data' )
			->willReturn(
				[
					'isLive'    => true,
					'testDrive' => false,
				]
			);

		// Act.
		ob_start();
		$this->payments_admin_settings->maybe_show_test_account_notice();
		$result = ob_get_clean();

		// Assert.
		$this->assertStringNotContainsString( 'You are using a test account.', $result );
	}

	public function test_it_hides_test_account_notice_for_sandbox_account() {
		// Arrange.
		$this->mock_gateway
			->expects( $this->any() )
			->method( 'is_connected' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'is_stripe_account_valid' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_is_live' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_account_status_data' )
			->willReturn(
				[
					'isLive'    => false,
					'testDrive' => false,
				]
			);

		// Act.
		ob_start();
		$this->payments_admin_settings->maybe_show_test_account_notice();
		$result = ob_get_clean();

		// Assert.
		$this->assertStringNotContainsString( 'You are using a test account.', $result );
	}

	public function test_it_renders_test_account_notice_for_test_account() {
		// Arrange.
		$this->mock_gateway
			->expects( $this->any() )
			->method( 'is_connected' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'is_stripe_account_valid' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_is_live' )
			->willReturn( false );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_account_status_data' )
			->willReturn(
				[
					'isLive'    => false,
					'testDrive' => true,
				]
			);

		// Act.
		ob_start();
		$this->payments_admin_settings->maybe_show_test_account_notice();
		$result = ob_get_clean();

		// Assert.
		$this->assertStringContainsString( 'You are using a test account.', $result );
		$this->assertStringNotContainsString( 'WooPayments is in test mode', $result );
		$this->assertStringNotContainsString( 'You are using a sandbox test account.', $result );
	}

	public function test_it_does_not_show_sandbox_account_notice_when_not_connected() {
		// Arrange.
		$this->mock_gateway
			->expects( $this->any() )
			->method( 'is_connected' )
			->willReturn( false );

		// Act.
		ob_start();
		$this->payments_admin_settings->maybe_show_sandbox_account_notice();
		$result = ob_get_clean();

		// Assert.
		$this->assertStringNotContainsString( 'You are using a sandbox test account.', $result );
	}

	public function test_it_hides_sandbox_account_notice_for_invalid_stripe_account() {
		// Arrange.
		$this->mock_gateway
			->expects( $this->any() )
			->method( 'is_connected' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'is_stripe_account_valid' )
			->willReturn( false );

		// Act.
		ob_start();
		$this->payments_admin_settings->maybe_show_sandbox_account_notice();
		$result = ob_get_clean();

		// Assert.
		$this->assertStringNotContainsString( 'You are using a sandbox test account.', $result );
	}

	public function test_it_hides_sandbox_account_notice_for_live_account() {
		// Arrange.
		$this->mock_gateway
			->expects( $this->any() )
			->method( 'is_connected' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'is_stripe_account_valid' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_is_live' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_account_status_data' )
			->willReturn(
				[
					'isLive'    => true,
					'testDrive' => false,
				]
			);

		// Act.
		ob_start();
		$this->payments_admin_settings->maybe_show_sandbox_account_notice();
		$result = ob_get_clean();

		// Assert.
		$this->assertStringNotContainsString( 'You are using a sandbox test account.', $result );
	}

	public function test_it_hides_sandbox_account_notice_for_test_account() {
		// Arrange.
		$this->mock_gateway
			->expects( $this->any() )
			->method( 'is_connected' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'is_stripe_account_valid' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_is_live' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_account_status_data' )
			->willReturn(
				[
					'isLive'    => false,
					'testDrive' => true,
				]
			);

		// Act.
		ob_start();
		$this->payments_admin_settings->maybe_show_sandbox_account_notice();
		$result = ob_get_clean();

		// Assert.
		$this->assertStringNotContainsString( 'You are using a sandbox test account.', $result );
	}

	public function test_it_renders_sandbox_account_notice_for_sandbox_account() {
		// Arrange.
		$this->mock_gateway
			->expects( $this->any() )
			->method( 'is_connected' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'is_stripe_account_valid' )
			->willReturn( true );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_is_live' )
			->willReturn( false );
		$this->mock_account
			->expects( $this->any() )
			->method( 'get_account_status_data' )
			->willReturn(
				[
					'isLive'    => false,
					'testDrive' => false,
				]
			);

		// Act.
		ob_start();
		$this->payments_admin_settings->maybe_show_sandbox_account_notice();
		$result = ob_get_clean();

		// Assert.
		$this->assertStringContainsString( 'You are using a sandbox test account.', $result );
		$this->assertStringNotContainsString( 'You are using a test account.', $result );
		$this->assertStringNotContainsString( 'WooPayments is in test mode', $result );
	}

	public function test_it_adds_plugin_links() {
		$links = $this->payments_admin_settings->add_plugin_links( [ '<a href="#some-link">Mock link</a>' ] );

		$this->assertCount( 2, $links );
	}
}
