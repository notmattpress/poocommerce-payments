<?php
/**
 * Class Core_Mode_Test
 *
 * @package PooCommerce\Payments\Tests
 */

use WCPay\Core\Mode;

/**
 * WCPay\Core\Mode unit tests.
 */
class Core_Mode_Test extends WCPAY_UnitTestCase {
	/**
	 * Holds the main class.
	 *
	 * @var Mode
	 */
	protected $mode;

	/**
	 * Holds the mock gateway.
	 *
	 * @var WC_Payment_Gateway_WCPay
	 */
	protected $mock_gateway;

	public function setUp(): void {
		parent::setUp();

		$this->mode = $this->getMockBuilder( Mode::class )
			->setMethods( [ 'is_wcpay_dev_mode_defined', 'get_wp_environment_type', 'wp_get_development_mode' ] )
			->getMock();
	}

	public function tearDown(): void {
		remove_filter( 'wcpay_dev_mode', '__return_true' );
		remove_filter( 'wcpay_test_mode', '__return_true' );

		parent::tearDown();
	}

	public function test_init_defaults_to_live_mode() {
		update_option( 'poocommerce_poocommerce_payments_settings', [ 'test_mode' => 'no' ] );

		$this->assertTrue( $this->mode->is_live() );
	}

	public function test_init_enters_dev_mode_when_constant_is_defined() {
		$this->mode->expects( $this->once() )
			->method( 'is_wcpay_dev_mode_defined' )
			->willReturn( true );

		$this->assertTrue( $this->mode->is_dev() );
		$this->assertTrue( $this->mode->is_test_mode_onboarding() );
		$this->assertTrue( $this->mode->is_test() );
		$this->assertFalse( $this->mode->is_live() );
	}

	public function provider_init_enters_dev_mode_for_WP_DEVELOPMENT_MODE(): array {
		return [
			'core'         => [ 'core', true ],
			'plugin'       => [ 'plugin', true ],
			'theme'        => [ 'theme', true ],
			'all'          => [ 'all', true ],
			'empty string' => [ '', false ],
		];
	}

	/**
	 * @dataProvider provider_init_enters_dev_mode_for_WP_DEVELOPMENT_MODE
	 */
	public function test_init_enters_dev_mode_for_WP_DEVELOPMENT_MODE( ?string $constant_value, bool $should_init_in_dev_mode ) {
		$this->mode->expects( $this->once() )
			->method( 'wp_get_development_mode' )
			->willReturn( $constant_value );

		$this->assertSame( $should_init_in_dev_mode, $this->mode->is_dev() );
	}

	public function test_init_enters_dev_mode_through_filter() {
		// Force dev mode to be entered through the filter.
		add_filter( 'wcpay_dev_mode', '__return_true' );

		$this->assertTrue( $this->mode->is_dev() );
		$this->assertTrue( $this->mode->is_test_mode_onboarding() );
		$this->assertTrue( $this->mode->is_test() );
		$this->assertFalse( $this->mode->is_live() );
	}

	public function test_init_enters_test_mode_with_gateway_test_mode_settings() {
		update_option( 'poocommerce_poocommerce_payments_settings', [ 'test_mode' => 'yes' ] );

		// Reset and check.
		$this->assertFalse( $this->mode->is_dev() );
		$this->assertFalse( $this->mode->is_test_mode_onboarding() );
		$this->assertTrue( $this->mode->is_test() );
	}

	public function test_init_enters_test_mode_through_filter() {
		// Force test mode to be entered through the filter.
		add_filter( 'wcpay_test_mode', '__return_true' );

		$this->assertTrue( $this->mode->is_test() );
		$this->assertFalse( $this->mode->is_dev() );
		$this->assertFalse( $this->mode->is_test_mode_onboarding() );
	}

	public function test_init_test_init_enters_dev_mode_when_environment_is_dev() {
		$this->mode->expects( $this->once() )
			->method( 'get_wp_environment_type' )
			->willReturn( 'development' );

		$this->assertTrue( $this->mode->is_dev() );
		$this->assertTrue( $this->mode->is_test_mode_onboarding() );
		$this->assertTrue( $this->mode->is_test() );
		$this->assertFalse( $this->mode->is_live() );
	}

	public function test_live() {
		// Reset to dev.
		$this->mode->dev();

		// Act.
		$this->mode->live();

		// Assert.
		// Everything is changed.
		$this->assertTrue( $this->mode->is_live() );
		$this->assertFalse( $this->mode->is_test() );
		$this->assertFalse( $this->mode->is_test_mode_onboarding() );
		$this->assertFalse( $this->mode->is_dev() );
	}

	public function test_test() {
		// Reset to live.
		$this->mode->live();

		// Act.
		$this->mode->test();

		// Assert.
		// Only the payments processing mode is changed.
		$this->assertTrue( $this->mode->is_test() );
		$this->assertFalse( $this->mode->is_live() );
		$this->assertFalse( $this->mode->is_test_mode_onboarding() );
		$this->assertFalse( $this->mode->is_dev() );
	}

	public function test_test_mode_onboarding() {
		// Reset to live.
		$this->mode->live();

		// Act.
		$this->mode->test_mode_onboarding();

		// Assert.
		// Payments processing mode is changed.
		$this->assertTrue( $this->mode->is_test() );
		$this->assertFalse( $this->mode->is_live() );
		$this->assertTrue( $this->mode->is_test_mode_onboarding() );
		// Dev mode is left unchanged.
		$this->assertFalse( $this->mode->is_dev() );
	}

	public function test_live_mode_onboarding() {
		// Reset to dev.
		$this->mode->dev();

		// Act.
		$this->mode->live_mode_onboarding();

		// Assert.
		// The payments processing mode is left unchanged.
		$this->assertFalse( $this->mode->is_live() );
		$this->assertTrue( $this->mode->is_test() );
		// The onboarding mode is changed.
		$this->assertFalse( $this->mode->is_test_mode_onboarding() );
		// Dev mode is deactivated.
		$this->assertFalse( $this->mode->is_dev() );
	}
}
