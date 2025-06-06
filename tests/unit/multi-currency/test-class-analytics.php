<?php
/**
 * Class WCPay_Multi_Currency_Analytics_Tests
 *
 * @package PooCommerce\Payments\Tests
 */

use Automattic\PooCommerce\Blocks\Package;
use Automattic\PooCommerce\Blocks\Assets\AssetDataRegistry;
use PHPUnit\Framework\MockObject\MockObject;
use WCPay\MultiCurrency\Analytics;
use WCPay\MultiCurrency\Currency;
use WCPay\MultiCurrency\Interfaces\MultiCurrencyAccountInterface;
use WCPay\MultiCurrency\Interfaces\MultiCurrencyApiClientInterface;
use WCPay\MultiCurrency\Interfaces\MultiCurrencyCacheInterface;
use WCPay\MultiCurrency\Interfaces\MultiCurrencyLocalizationInterface;
use WCPay\MultiCurrency\Interfaces\MultiCurrencySettingsInterface;
use WCPay\MultiCurrency\MultiCurrency;

/**
 * Analytics unit tests.
 */
class WCPay_Multi_Currency_Analytics_Tests extends WCPAY_UnitTestCase {
	/**
	 * Analytics instance.
	 *
	 * @var Analytics
	 */
	private $analytics;

	/**
	 * Mock MultiCurrency
	 *
	 * @var MultiCurrency|MockObject
	 */
	private $mock_multi_currency;

	/**
	 * Mock orders.
	 *
	 * @var array An array of order ids.
	 */
	private $mock_orders = [];

	/**
	 * Mock customer currencies
	 *
	 * @var array An array of customer currencies.
	 */
	private $mock_customer_currencies = [ 'EUR', 'USD', 'GBP', 'ISK' ];

	/**
	 * Mock available currencies.
	 *
	 * @var array An array of available currencies.
	 */
	private $mock_available_currencies = [];

	/**
	 * The localization service.
	 *
	 * @var MultiCurrencyLocalizationInterface
	 */
	private $mock_localization_service;

	/**
	 * Pre-test setup
	 */
	public function set_up() {
		parent::set_up();

		$this->add_mock_order_with_meta();
		$this->set_is_admin( true );
		$this->set_is_rest_request( true );
		add_filter( 'poocommerce_is_rest_api_request', '__return_true' );
		// Add manage_poocommerce capability to user.
		$cb = $this->create_can_manage_poocommerce_cap_override( true );
		add_filter( 'user_has_cap', $cb );

		$mock_api_client   = $this->createMock( MultiCurrencyApiClientInterface::class );
		$mock_account      = $this->createMock( MultiCurrencyAccountInterface::class );
		$mock_localization = $this->createMock( MultiCurrencyLocalizationInterface::class );
		$mock_cache        = $this->createMock( MultiCurrencyCacheInterface::class );
		$mock_settings     = $this->createMock( MultiCurrencySettingsInterface::class );

		$this->mock_multi_currency = $this->getMockBuilder( MultiCurrency::class )
			->setConstructorArgs( [ $mock_settings, $mock_api_client, $mock_account, $mock_localization, $mock_cache ] )
			->getMock();

		$this->mock_multi_currency->expects( $this->any() )
			->method( 'get_all_customer_currencies' )
			->willReturn( $this->mock_customer_currencies );

		$this->mock_multi_currency->expects( $this->any() )
			->method( 'get_available_currencies' )
			->willReturn( $this->get_mock_available_currencies() );

		$this->analytics = new Analytics( $this->mock_multi_currency, $mock_settings );

		$this->mock_localization_service = $this->createMock( MultiCurrencyLocalizationInterface::class );
		$this->mock_localization_service->expects( $this->any() )
			->method( 'get_currency_format' )
			->willReturn( [ 'num_decimals' => 2 ] );

		remove_filter( 'user_has_cap', $cb );
	}

	/**
	 * Post-test tear down.
	 */
	public function tear_down() {
		$this->delete_mock_orders();

		remove_filter( 'poocommerce_is_rest_api_request', '__return_true' );

		parent::tear_down();
	}

	/**
	 * @dataProvider poocommerce_filter_provider
	 */
	public function test_registers_poocommerce_filters_properly( $filter, $function_name, $expected_priority ) {
		$priority = has_filter( $filter, [ $this->analytics, $function_name ] );
		$this->assertEquals( $expected_priority, $priority );
	}

	public function poocommerce_filter_provider() {
		return [
			'admin scripts enqueued with default priority' => [ 'admin_enqueue_scripts', 'enqueue_admin_scripts', 10 ],
			'select clause filters added with late priority' => [ 'poocommerce_analytics_clauses_select', 'filter_select_clauses', 20 ],
			'join clause filters added with late priority' => [ 'poocommerce_analytics_clauses_join', 'filter_join_clauses', 20 ],
		];
	}

	/**
	 * Test for the register_customer_currencies method. Note that this function is called in the constructor,
	 * and the customerCurrencies data key cannot be re-registered, so this test is only to ensure that it exists.
	 */
	public function test_register_customer_currencies() {
		$data_registry = Package::container()->get(
			AssetDataRegistry::class
		);
		$this->assertTrue( $data_registry->exists( 'customerCurrencies' ) );
	}


	public function test_has_multi_currency_orders() {

		// Use reflection to make the private method has_multi_currency_orders accessible.
		$method = new ReflectionMethod( Analytics::class, 'has_multi_currency_orders' );
		$method->setAccessible( true );

		// Now, you can call the has_multi_currency_orders method using the ReflectionMethod object.
		$result = $method->invoke( $this->analytics );

		$this->assertTrue( $result );
	}

	public function test_update_order_stats_data_with_non_multi_currency_order() {
		$args  = $this->order_args_provider( 123, 0, 1, 15.50, 1.50, 0, 14.00 );
		$order = wc_create_order();
		$order->set_currency( 'USD' );

		$this->assertEquals( $args, $this->analytics->update_order_stats_data( $args, $order ) );
	}

	public function test_update_order_stats_data_with_invalid_order() {
		$args = $this->order_args_provider( 123, 0, 1, 15.50, 1.50, 0, 14.00 );
		$this->assertEquals( $args, $this->analytics->update_order_stats_data( $args, null ) );
	}

	public function test_update_order_stats_data_with_multi_currency_order_without_meta_data() {
		$args  = $this->order_args_provider( 123, 0, 1, 15.50, 1.50, 0, 14.00 );
		$order = wc_create_order();
		$order->set_currency( 'VND' );

		$this->assertEquals( $args, $this->analytics->update_order_stats_data( $args, $order ) );
	}

	public function test_update_order_stats_data_with_multi_currency_order() {
		$this->mock_multi_currency->expects( $this->once() )
			->method( 'get_default_currency' )
			->willReturn( new Currency( $this->mock_localization_service, 'USD', 1.0 ) );

		$args  = $this->order_args_provider( 123, 0, 1, 15.50, 1.50, 0, 14.00 );
		$order = wc_create_order();
		$order->set_currency( 'GBP' );
		$order->update_meta_data( '_wcpay_multi_currency_order_exchange_rate', 0.75 );
		$order->update_meta_data( '_wcpay_multi_currency_order_default_currency', 'USD' );

		$expected = $this->order_args_provider( 123, 0, 1, 20.67, 2, 0, 18.67 );
		$this->assertEquals( $expected, $this->analytics->update_order_stats_data( $args, $order ) );
	}

	public function test_update_order_stats_data_with_large_order() {
		$this->mock_multi_currency->expects( $this->once() )
			->method( 'get_default_currency' )
			->willReturn( new Currency( $this->mock_localization_service, 'USD', 1.0 ) );

		$args  = $this->order_args_provider( 123, 0, 1, 130500.75, 20000, 10000, 100500.75 );
		$order = wc_create_order();
		$order->set_currency( 'GBP' );
		$order->update_meta_data( '_wcpay_multi_currency_order_exchange_rate', 0.78 );
		$order->update_meta_data( '_wcpay_multi_currency_order_default_currency', 'USD' );

		$expected = $this->order_args_provider( 123, 0, 1, 167308.66, 25641.03, 12820.51, 128847.12 );
		$this->assertEquals( $expected, $this->analytics->update_order_stats_data( $args, $order ) );
	}

	public function test_update_order_stats_data_with_stripe_exchange_rate() {
		$this->mock_multi_currency->expects( $this->once() )
			->method( 'get_default_currency' )
			->willReturn( new Currency( $this->mock_localization_service, 'USD', 1.0 ) );

		$args  = $this->order_args_provider( 123, 0, 1, 15.50, 1.50, 0, 15.00 );
		$order = wc_create_order();
		$order->set_currency( 'GBP' );
		$order->update_meta_data( '_wcpay_multi_currency_order_exchange_rate', 0.78 );
		$order->update_meta_data( '_wcpay_multi_currency_stripe_exchange_rate', 1.2823 );
		$order->update_meta_data( '_wcpay_multi_currency_order_default_currency', 'USD' );

		$expected = $this->order_args_provider( 123, 0, 1, 21.15, 1.92, 0.0, 19.23 );
		$this->assertEquals( $expected, $this->analytics->update_order_stats_data( $args, $order ) );
	}

	/**
	 * @dataProvider select_clause_provider
	 */
	public function test_filter_select_clauses( $context, $clauses, $expected ) {
		$this->assertEquals( $expected, $this->analytics->filter_select_clauses( $clauses, $context ) );
	}

	public function select_clause_provider() {
		global $wpdb;

		return [
			'generic select clause should be modified' => [
				'unknown_stats_interval',
				[
					"DATE_FORMAT({$wpdb->prefix}wc_order_stats.date_created, '%Y-%m-%d') AS time_interval",
					"{$wpdb->prefix}wc_order_stats.order_id",
					", MAX({$wpdb->prefix}wc_order_stats.date_created) AS datetime_anchor",
					", SUM( CASE WHEN {$wpdb->prefix}wc_order_stats.parent_id = 0 THEN 1 ELSE 0 END ) as orders_count, COUNT( DISTINCT( {$wpdb->prefix}wc_order_stats.customer_id ) ) as total_customers, SUM({$wpdb->prefix}wc_order_stats.num_items_sold) as num_items_sold, COALESCE( coupons_count, 0 ) as coupons_count, SUM({$wpdb->prefix}wc_order_stats.net_total) AS net_revenue",
					'product_net_revenue, product_gross_revenue',
				],
				[
					"DATE_FORMAT({$wpdb->prefix}wc_order_stats.date_created, '%Y-%m-%d') AS time_interval",
					"{$wpdb->prefix}wc_order_stats.order_id",
					", MAX({$wpdb->prefix}wc_order_stats.date_created) AS datetime_anchor",
					", SUM( CASE WHEN {$wpdb->prefix}wc_order_stats.parent_id = 0 THEN 1 ELSE 0 END ) as orders_count, COUNT( DISTINCT( {$wpdb->prefix}wc_order_stats.customer_id ) ) as total_customers, SUM({$wpdb->prefix}wc_order_stats.num_items_sold) as num_items_sold, COALESCE( coupons_count, 0 ) as coupons_count, SUM({$wpdb->prefix}wc_order_stats.net_total) AS net_revenue",
					'CASE WHEN wcpay_multicurrency_default_currency_meta.meta_value IS NOT NULL THEN CASE WHEN wcpay_multicurrency_stripe_exchange_rate_meta.meta_value IS NOT NULL THEN ROUND(product_net_revenue * wcpay_multicurrency_stripe_exchange_rate_meta.meta_value, 2) ELSE ROUND(product_net_revenue * (1 / wcpay_multicurrency_exchange_rate_meta.meta_value ), 2) END ELSE product_net_revenue END, CASE WHEN wcpay_multicurrency_default_currency_meta.meta_value IS NOT NULL THEN CASE WHEN wcpay_multicurrency_stripe_exchange_rate_meta.meta_value IS NOT NULL THEN ROUND(product_gross_revenue * wcpay_multicurrency_stripe_exchange_rate_meta.meta_value, 2) ELSE ROUND(product_gross_revenue * (1 / wcpay_multicurrency_exchange_rate_meta.meta_value ), 2) END ELSE product_gross_revenue END',
					', wcpay_multicurrency_currency_meta.meta_value AS order_currency',
					', wcpay_multicurrency_default_currency_meta.meta_value AS order_default_currency',
					', wcpay_multicurrency_exchange_rate_meta.meta_value AS exchange_rate',
					', wcpay_multicurrency_stripe_exchange_rate_meta.meta_value AS stripe_exchange_rate',
				],
			],
			'null context should not modify query'     => [
				null,
				[ "{$wpdb->prefix}wc_order_stats.net_total, {$wpdb->prefix}wc_order_stats.total_sales, discount_amount, product_net_revenue, product_gross_revenue" ],
				[ "{$wpdb->prefix}wc_order_stats.net_total, {$wpdb->prefix}wc_order_stats.total_sales, discount_amount, product_net_revenue, product_gross_revenue" ],
			],
			'products subquery context should modify query' => [
				'products_subquery',
				[
					", MAX({$wpdb->prefix}wc_order_stats.date_created) AS datetime_anchor",
					'product_net_revenue, product_gross_revenue',
				],
				[
					", MAX({$wpdb->prefix}wc_order_stats.date_created) AS datetime_anchor",
					'CASE WHEN wcpay_multicurrency_default_currency_meta.meta_value IS NOT NULL THEN CASE WHEN wcpay_multicurrency_stripe_exchange_rate_meta.meta_value IS NOT NULL THEN ROUND(product_net_revenue * wcpay_multicurrency_stripe_exchange_rate_meta.meta_value, 2) ELSE ROUND(product_net_revenue * (1 / wcpay_multicurrency_exchange_rate_meta.meta_value ), 2) END ELSE product_net_revenue END, CASE WHEN wcpay_multicurrency_default_currency_meta.meta_value IS NOT NULL THEN CASE WHEN wcpay_multicurrency_stripe_exchange_rate_meta.meta_value IS NOT NULL THEN ROUND(product_gross_revenue * wcpay_multicurrency_stripe_exchange_rate_meta.meta_value, 2) ELSE ROUND(product_gross_revenue * (1 / wcpay_multicurrency_exchange_rate_meta.meta_value ), 2) END ELSE product_gross_revenue END',
					', wcpay_multicurrency_currency_meta.meta_value AS order_currency',
					', wcpay_multicurrency_default_currency_meta.meta_value AS order_default_currency',
					', wcpay_multicurrency_exchange_rate_meta.meta_value AS exchange_rate',
					', wcpay_multicurrency_stripe_exchange_rate_meta.meta_value AS stripe_exchange_rate',
				],
			],
			'coupons context should not modify query'  => [
				'coupons',
				[ 'RIGHT JOIN table1 on table1.x = table2.y' ],
				[ 'RIGHT JOIN table1 on table1.x = table2.y' ],
			],
		];
	}

	public function test_filter_select_clauses_disable_filter() {
		$expected = [ 'Santa Claus', 'Mrs. Claus' ];
		add_filter( 'wcpay_multi_currency_disable_filter_select_clauses', '__return_true' );
		$this->assertEquals( $expected, $this->analytics->filter_select_clauses( $expected, 'orders_stats' ) );

		remove_filter( 'wcpay_multi_currency_disable_filter_select_clauses', '__return_true' );
	}

	public function test_filter_select_clauses_return_filter() {
		$clauses  = [ 'Santa Claus', 'Mrs. Claus' ];
		$expected = array_reverse( $clauses );
		add_filter(
			'wcpay_multi_currency_filter_select_clauses',
			function ( $new_clauses ) use ( $clauses ) {
				return array_reverse( $clauses );
			}
		);
		$this->assertEquals( $expected, $this->analytics->filter_select_clauses( $clauses, 'orders_stats' ) );

		remove_all_filters( 'wcpay_multi_currency_filter_select_clauses' );
	}

	public function test_filter_where_clauses_when_no_currency_provided() {
		global $wpdb;

		$clauses  = [ "WHERE {$wpdb->prefix}wc_order_stats.order_id = 123" ];
		$expected = [ "WHERE {$wpdb->prefix}wc_order_stats.order_id = 123" ];

		$this->assertEquals(
			$expected,
			$this->analytics->filter_where_clauses( $clauses )
		);
	}

	public function test_filter_where_clauses_with_currency_is() {
		global $wpdb;

		$clauses  = [ "WHERE {$wpdb->prefix}wc_order_stats.order_id = 123" ];
		$expected = [
			"WHERE {$wpdb->prefix}wc_order_stats.order_id = 123",
			"AND wcpay_multicurrency_currency_meta.meta_value IN ('USD')",
		];

		// Simulate a currency being passed in via GET request.
		$_GET['currency_is'] = [ 'USD' ];

		$this->assertEquals(
			$expected,
			$this->analytics->filter_where_clauses( $clauses )
		);
	}

	public function test_filter_where_clauses_with_multiple_currency_is() {
		global $wpdb;

		$clauses  = [ "WHERE {$wpdb->prefix}wc_order_stats.order_id = 123" ];
		$expected = [
			"WHERE {$wpdb->prefix}wc_order_stats.order_id = 123",
			"AND wcpay_multicurrency_currency_meta.meta_value IN ('USD', 'EUR')",
		];

		// Simulate a currency being passed in via GET request.
		$_GET['currency_is'] = [ 'USD', 'EUR' ];

		$this->assertEquals(
			$expected,
			$this->analytics->filter_where_clauses( $clauses )
		);
	}

	public function test_filter_where_clauses_with_currency_is_not() {
		global $wpdb;

		$clauses  = [ "WHERE {$wpdb->prefix}wc_order_stats.order_id = 123" ];
		$expected = [
			"WHERE {$wpdb->prefix}wc_order_stats.order_id = 123",
			"AND wcpay_multicurrency_currency_meta.meta_value NOT IN ('USD')",
		];

		// Simulate a currency being passed in via GET request.
		$_GET['currency_is_not'] = [ 'USD' ];

		$this->assertEquals(
			$expected,
			$this->analytics->filter_where_clauses( $clauses )
		);
	}

	public function test_filter_where_clauses_with_multiple_currency_is_not() {
		global $wpdb;

		$clauses  = [ "WHERE {$wpdb->prefix}wc_order_stats.order_id = 123" ];
		$expected = [
			"WHERE {$wpdb->prefix}wc_order_stats.order_id = 123",
			"AND wcpay_multicurrency_currency_meta.meta_value NOT IN ('USD', 'EUR')",
		];

		// Simulate a currency being passed in via GET request.
		$_GET['currency_is_not'] = [ 'USD', 'EUR' ];

		$this->assertEquals(
			$expected,
			$this->analytics->filter_where_clauses( $clauses )
		);
	}

	public function test_filter_where_clauses_with_currency() {
		global $wpdb;

		$clauses  = [ "WHERE {$wpdb->prefix}wc_order_stats.order_id = 123" ];
		$expected = [
			"WHERE {$wpdb->prefix}wc_order_stats.order_id = 123",
			"AND wcpay_multicurrency_currency_meta.meta_value = 'USD'",
		];

		// Simulate a currency being passed in via GET request.
		$_GET['currency'] = 'USD';

		$this->assertEquals(
			$expected,
			$this->analytics->filter_where_clauses( $clauses )
		);
	}

	public function test_filter_where_clauses_with_multiple_currency_args() {
		global $wpdb;

		$clauses  = [ "WHERE {$wpdb->prefix}wc_order_stats.order_id = 123" ];
		$expected = [
			"WHERE {$wpdb->prefix}wc_order_stats.order_id = 123",
			"AND wcpay_multicurrency_currency_meta.meta_value IN ('GBP')",
			"AND wcpay_multicurrency_currency_meta.meta_value NOT IN ('USD', 'EUR')",
		];

		// Simulate a currency being passed in via GET request.
		$_GET['currency_is']     = [ 'GBP' ];
		$_GET['currency_is_not'] = [ 'USD', 'EUR' ];

		$this->assertEquals(
			$expected,
			$this->analytics->filter_where_clauses( $clauses )
		);
	}

	public function test_filter_where_clauses_disable_filter() {
		$expected = [ 'Santa Claus', 'Mrs. Claus' ];
		add_filter( 'wcpay_multi_currency_disable_filter_where_clauses', '__return_true' );

		// Nothing should be appended to the clauses array, because the filter is disabled.
		$_GET['currency_is'] = [ 'USD' ];

		$this->assertEquals( $expected, $this->analytics->filter_where_clauses( $expected ) );

		remove_filter( 'wcpay_multi_currency_disable_filter_where_clauses', '__return_true' );
	}

	/**
	 * @dataProvider join_clause_provider
	 */
	public function test_filter_join_clauses( $clauses, $expected ) {
		$this->assertEquals( $expected, $this->analytics->filter_join_clauses( $clauses, 'test' ) );
	}

	public function join_clause_provider() {
		global $wpdb;

		return [
			'does not add to empty clauses array' => [
				[],
				[],
			],
			'does not add to non-empty clauses array if stats table is not mentioned' => [
				[
					'JOIN my_custom_table ON field1 = field2',
				],
				[
					'JOIN my_custom_table ON field1 = field2',
				],
			],
			'adds to clauses array if stats table is mentioned' => [
				[
					"LEFT JOIN {$wpdb->prefix}wc_order_stats ON table1.order_id = {$wpdb->prefix}wc_order_stats.order_id",
				],
				[
					"LEFT JOIN {$wpdb->prefix}wc_order_stats ON table1.order_id = {$wpdb->prefix}wc_order_stats.order_id",
					"LEFT JOIN {$wpdb->postmeta} wcpay_multicurrency_currency_meta ON {$wpdb->prefix}wc_order_stats.order_id = wcpay_multicurrency_currency_meta.post_id AND wcpay_multicurrency_currency_meta.meta_key = '_order_currency'",
					"LEFT JOIN {$wpdb->postmeta} wcpay_multicurrency_default_currency_meta ON {$wpdb->prefix}wc_order_stats.order_id = wcpay_multicurrency_default_currency_meta.post_id AND wcpay_multicurrency_default_currency_meta.meta_key = '_wcpay_multi_currency_order_default_currency'",
					"LEFT JOIN {$wpdb->postmeta} wcpay_multicurrency_exchange_rate_meta ON {$wpdb->prefix}wc_order_stats.order_id = wcpay_multicurrency_exchange_rate_meta.post_id AND wcpay_multicurrency_exchange_rate_meta.meta_key = '_wcpay_multi_currency_order_exchange_rate'",
					"LEFT JOIN {$wpdb->postmeta} wcpay_multicurrency_stripe_exchange_rate_meta ON {$wpdb->prefix}wc_order_stats.order_id = wcpay_multicurrency_stripe_exchange_rate_meta.post_id AND wcpay_multicurrency_stripe_exchange_rate_meta.meta_key = '_wcpay_multi_currency_stripe_exchange_rate'",
				],
			],
		];
	}

	public function test_filter_join_clauses_disable_filter() {
		$expected = [ 'Santa Claus', 'Mrs. Claus' ];
		add_filter( 'wcpay_multi_currency_disable_filter_join_clauses', '__return_true' );
		$this->assertEquals( $expected, $this->analytics->filter_join_clauses( $expected, 'orders_stats' ) );

		remove_filter( 'wcpay_multi_currency_disable_filter_join_clauses', '__return_true' );
	}

	public function test_filter_join_clauses_return_filter() {
		$clauses  = [ 'Santa Claus', 'Mrs. Claus' ];
		$expected = array_reverse( $clauses );
		add_filter(
			'wcpay_multi_currency_filter_join_clauses',
			function ( $new_clauses ) use ( $clauses ) {
				return array_reverse( $clauses );
			}
		);
		$this->assertEquals( $expected, $this->analytics->filter_join_clauses( $clauses, 'orders_stats' ) );

		remove_all_filters( 'wcpay_multi_currency_filter_join_clauses' );
	}

	/**
	 * @dataProvider select_orders_clause_provider
	 */
	public function test_filter_select_orders_clauses( $clauses, $expected ) {
		$this->assertEquals( $expected, $this->analytics->filter_select_orders_clauses( $clauses ) );
	}

	public function select_orders_clause_provider() {
		global $wpdb;

		return [
			'subquery'    => [
				[
					"DISTINCT {$wpdb->prefix}wc_order_stats.order_id, {$wpdb->prefix}wc_order_stats.parent_id, {$wpdb->prefix}wc_order_stats.date_created, {$wpdb->prefix}wc_order_stats.date_created_gmt, REPLACE({$wpdb->prefix}wc_order_stats.status, 'wc-', '') as status, {$wpdb->prefix}wc_order_stats.customer_id, {$wpdb->prefix}wc_order_stats.net_total, {$wpdb->prefix}wc_order_stats.total_sales, {$wpdb->prefix}wc_order_stats.num_items_sold, (CASE WHEN {$wpdb->prefix}wc_order_stats.returning_customer = 0 THEN 'new' ELSE 'returning' END) as customer_type",
					', wcpay_multicurrency_currency_meta.meta_value AS order_currency',
				],
				[
					"DISTINCT {$wpdb->prefix}wc_order_stats.order_id, {$wpdb->prefix}wc_order_stats.parent_id, {$wpdb->prefix}wc_order_stats.date_created, {$wpdb->prefix}wc_order_stats.date_created_gmt, REPLACE({$wpdb->prefix}wc_order_stats.status, 'wc-', '') as status, {$wpdb->prefix}wc_order_stats.customer_id, CASE WHEN wcpay_multicurrency_stripe_exchange_rate_meta.meta_value IS NOT NULL THEN ROUND({$wpdb->prefix}wc_order_stats.net_total / wcpay_multicurrency_stripe_exchange_rate_meta.meta_value, 2) ELSE ROUND({$wpdb->prefix}wc_order_stats.net_total * wcpay_multicurrency_exchange_rate_meta.meta_value, 2) END as net_total, {$wpdb->prefix}wc_order_stats.total_sales, {$wpdb->prefix}wc_order_stats.num_items_sold, (CASE WHEN {$wpdb->prefix}wc_order_stats.returning_customer = 0 THEN 'new' ELSE 'returning' END) as customer_type",
					', wcpay_multicurrency_currency_meta.meta_value AS order_currency',
				],
			],
			'stats total' => [
				[
					"SUM( CASE WHEN {$wpdb->prefix}wc_order_stats.parent_id = 0 THEN 1 ELSE 0 END ) as orders_count, SUM({$wpdb->prefix}wc_order_stats.net_total) AS net_revenue, SUM( {$wpdb->prefix}wc_order_stats.net_total ) / SUM( CASE WHEN {$wpdb->prefix}wc_order_stats.parent_id = 0 THEN 1 ELSE 0 END ) AS avg_order_value, SUM( {$wpdb->prefix}wc_order_stats.num_items_sold ) / SUM( CASE WHEN {$wpdb->prefix}wc_order_stats.parent_id = 0 THEN 1 ELSE 0 END ) AS avg_items_per_order",
					', wcpay_multicurrency_currency_meta.meta_value AS order_currency',
				],
				[
					"SUM( CASE WHEN {$wpdb->prefix}wc_order_stats.parent_id = 0 THEN 1 ELSE 0 END ) as orders_count, SUM(CASE WHEN wcpay_multicurrency_stripe_exchange_rate_meta.meta_value IS NOT NULL THEN ROUND({$wpdb->prefix}wc_order_stats.net_total / wcpay_multicurrency_stripe_exchange_rate_meta.meta_value, 2) ELSE ROUND({$wpdb->prefix}wc_order_stats.net_total * wcpay_multicurrency_exchange_rate_meta.meta_value, 2) END) AS net_revenue, SUM( CASE WHEN wcpay_multicurrency_stripe_exchange_rate_meta.meta_value IS NOT NULL THEN ROUND({$wpdb->prefix}wc_order_stats.net_total / wcpay_multicurrency_stripe_exchange_rate_meta.meta_value, 2) ELSE ROUND({$wpdb->prefix}wc_order_stats.net_total * wcpay_multicurrency_exchange_rate_meta.meta_value, 2) END ) / SUM( CASE WHEN {$wpdb->prefix}wc_order_stats.parent_id = 0 THEN 1 ELSE 0 END ) AS avg_order_value, SUM( {$wpdb->prefix}wc_order_stats.num_items_sold ) / SUM( CASE WHEN {$wpdb->prefix}wc_order_stats.parent_id = 0 THEN 1 ELSE 0 END ) AS avg_items_per_order",
					', wcpay_multicurrency_currency_meta.meta_value AS order_currency',
				],
			],
		];
	}

	public function test_filter_select_orders_clauses_disable_filter() {
		$expected = [ 'Santa Claus', 'Mrs. Claus' ];
		add_filter( 'wcpay_multi_currency_disable_filter_select_orders_clauses', '__return_true' );
		$this->assertEquals( $expected, $this->analytics->filter_select_orders_clauses( $expected ) );

		remove_filter( 'wcpay_multi_currency_disable_filter_select_orders_clauses', '__return_true' );
	}

	public function test_filter_select_orders_clauses_return_filter() {
		$clauses  = [ 'Santa Claus', 'Mrs. Claus' ];
		$expected = array_reverse( $clauses );
		add_filter(
			'wcpay_multi_currency_filter_select_orders_clauses',
			function ( $new_clauses ) use ( $clauses ) {
				return array_reverse( $clauses );
			}
		);
		$this->assertEquals( $expected, $this->analytics->filter_select_orders_clauses( $clauses ) );

		remove_all_filters( 'wcpay_multi_currency_filter_select_orders_clauses' );
	}

	private function order_args_provider( $order_id, $parent_id, $num_items_sold, $total_sales, $tax_total, $shipping_total, $net_total ) {
		return [
			'order_id'       => $order_id,
			'parent_id'      => $parent_id,
			'num_items_sold' => $num_items_sold,
			'total_sales'    => $total_sales,
			'tax_total'      => $tax_total,
			'shipping_total' => $shipping_total,
			'net_total'      => $net_total,
		];
	}
	/**
	 * @param bool $is_admin
	 */
	private function set_is_admin( bool $is_admin ) {
		global $current_screen;

		if ( ! $is_admin ) {
			$current_screen = null; // phpcs:ignore: WordPress.WP.GlobalVariablesOverride.Prohibited
			return;
		}

		// phpcs:ignore: WordPress.WP.GlobalVariablesOverride.Prohibited
		$current_screen = $this->getMockBuilder( \stdClass::class )
			->setMethods( [ 'in_admin' ] )
			->getMock();

		$current_screen->method( 'in_admin' )->willReturn( $is_admin );
	}

	private function set_is_rest_request() {
		$_SERVER['REQUEST_URI'] = '/ajax';
	}

	/**
	 * @param bool $can_manage_poocommerce
	 *
	 * @return Closure
	 */
	private function create_can_manage_poocommerce_cap_override( bool $can_manage_poocommerce ) {
		return function ( $allcaps ) use ( $can_manage_poocommerce ) {
			$allcaps['manage_poocommerce'] = $can_manage_poocommerce;

			return $allcaps;
		};
	}

	private function get_mock_available_currencies() {
		$this->mock_localization_service = $this->createMock( MultiCurrencyLocalizationInterface::class );
		if ( empty( $this->mock_available_currencies ) ) {
			$this->mock_localization_service
				->expects( $this->any() )
				->method( 'get_currency_format' )
				->willReturn( [ 'num_decimals' => 2 ] );

			$this->mock_available_currencies = [
				'GBP' => new Currency( $this->mock_localization_service, 'GBP', 1.2 ),
				'USD' => new Currency( $this->mock_localization_service, 'USD', 1 ),
				'EUR' => new Currency( $this->mock_localization_service, 'EUR', 0.9 ),
				'ISK' => new Currency( $this->mock_localization_service, 'ISK', 30.52 ),
				'NZD' => new Currency( $this->mock_localization_service, 'NZD', 1.4 ),
			];
		}

		return $this->mock_available_currencies;
	}

	/**
	 * This will create a mock order with the appropriate Multi-Currency meta data.
	 */
	private function add_mock_order_with_meta() {
		$order_id = wp_insert_post(
			[
				'post_type'   => 'shop_order',
				'post_status' => 'wc-processing',
			]
		);

		update_post_meta( $order_id, '_wcpay_multi_currency_order_exchange_rate', 0.5353 );
		update_post_meta( $order_id, '_payment_method', 'stripe' );
		update_post_meta( $order_id, '_order_total', 12.64 );
		update_post_meta( $order_id, '_order_currency', 'EUR' );

		// Add to the array of mock order IDs so we can delete it later.
		$this->mock_orders[] = $order_id;
	}

	private function delete_mock_orders() {
		foreach ( $this->mock_orders as $order_id ) {
			wp_delete_post( $order_id, true );
		}
	}
}
