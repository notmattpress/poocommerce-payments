<?php
/**
 * Class WC_Payments_Utils_Test
 *
 * @package PooCommerce\Payments\Tests
 */

use PHPUnit\Framework\MockObject\MockObject;
use WCPay\Exceptions\Amount_Too_Small_Exception;

/**
 * WC_Payments_Utils unit tests.
 */
class WC_Payments_Utils_Test extends WCPAY_UnitTestCase {
	public function test_esc_interpolated_html_returns_raw_string() {
		$result = WC_Payments_Utils::esc_interpolated_html(
			'hello world',
			[
				'span' => '<span/>',
			]
		);
		$this->assertEquals( 'hello world', $result );
	}

	public function test_esc_interpolated_html_allows_self_closing_tag_without_attrs() {
		$result = WC_Payments_Utils::esc_interpolated_html(
			'line 1<br/>line 2',
			[
				'br' => '<br>',
			]
		);
		$this->assertEquals( 'line 1<br/>line 2', $result );
	}

	public function test_esc_interpolated_html_allows_self_closing_tag_with_attrs() {
		$result = WC_Payments_Utils::esc_interpolated_html(
			'this is an image: <img/>.',
			[
				'img' => '<img src="#"/>',
			]
		);
		$this->assertEquals( 'this is an image: <img src="#"/>.', $result );
	}

	public function test_esc_interpolated_html_allows_opening_and_closing_tag_without_attrs() {
		$result = WC_Payments_Utils::esc_interpolated_html(
			'here is a <strong>text</strong>: hello',
			[
				'strong' => '<strong>',
			]
		);
		$this->assertEquals( 'here is a <strong>text</strong>: hello', $result );
	}

	public function test_esc_interpolated_html_allows_opening_and_closing_tag_with_attrs() {
		$result = WC_Payments_Utils::esc_interpolated_html(
			'click <a>here</a> for a link',
			[
				'a' => '<a href="#"/>',
			]
		);
		$this->assertEquals( 'click <a href="#">here</a> for a link', $result );
	}

	public function test_esc_interpolated_html_allows_custom_map_keys() {
		$result = WC_Payments_Utils::esc_interpolated_html(
			'click <foo>here</foo> for a link',
			[
				'foo' => '<a href="abc.def/hello"/>',
			]
		);
		$this->assertEquals( 'click <a href="abc.def/hello">here</a> for a link', $result );
	}

	public function test_esc_interpolated_html_allows_tag_at_the_beginning_of_string() {
		$result = WC_Payments_Utils::esc_interpolated_html(
			'<strong>qwerty</strong>uiop',
			[
				'strong' => '<strong/>',
			]
		);
		$this->assertEquals( '<strong>qwerty</strong>uiop', $result );
	}

	public function test_esc_interpolated_html_allows_tag_at_the_end_of_string() {
		$result = WC_Payments_Utils::esc_interpolated_html(
			'qwerty<strong>uiop</strong>',
			[
				'strong' => '<strong/>',
			]
		);
		$this->assertEquals( 'qwerty<strong>uiop</strong>', $result );
	}

	public function test_esc_interpolated_html_allows_tag_at_the_beginning_and_end_of_string() {
		$result = WC_Payments_Utils::esc_interpolated_html(
			'<strong>qwertyuiop</strong>',
			[
				'strong' => '<strong/>',
			]
		);
		$this->assertEquals( '<strong>qwertyuiop</strong>', $result );
	}

	public function test_esc_interpolated_html_allows_multiple_tags() {
		$result = WC_Payments_Utils::esc_interpolated_html(
			'this is <strong>bold text</strong>, this is <a>a link</a>, this is an image <img/>.',
			[
				'strong' => '<strong/>',
				'a'      => '<a href="#">',
				'img'    => '<img src="#">',
			]
		);
		$this->assertEquals( 'this is <strong>bold text</strong>, this is <a href="#">a link</a>, this is an image <img src="#"/>.', $result );
	}

	public function test_esc_interpolated_html_escapes_unrecognized_tags() {
		$result = WC_Payments_Utils::esc_interpolated_html(
			'<strong>hello world</strong>',
			[
				'span' => '<span/>',
			]
		);
		$this->assertEquals( '&lt;strong&gt;hello world&lt;/strong&gt;', $result );
	}

	public function test_esc_interpolated_html_escapes_unrecognized_tags_but_allows_defined_tags() {
		$result = WC_Payments_Utils::esc_interpolated_html(
			'this is <strong>bold text</strong>, <span>this should not be here</span>, this is <a>a link</a>, this is an image <img/>.',
			[
				'strong' => '<strong/>',
				'a'      => '<a href="#">',
				'img'    => '<img src="#">',
			]
		);
		$this->assertEquals( 'this is <strong>bold text</strong>, &lt;span&gt;this should not be here&lt;/span&gt;, this is <a href="#">a link</a>, this is an image <img src="#"/>.', $result );
	}

	public function test_esc_interpolated_html_does_not_escape_sprintf_placeholders() {
		$result = WC_Payments_Utils::esc_interpolated_html(
			'A payment of %1$s was <strong>authorized</strong> using WooPayments (<code>%2$s</code>).',
			[
				'strong' => '<strong/>',
				'code'   => '<code>',
			]
		);
		$this->assertEquals( 'A payment of %1$s was <strong>authorized</strong> using WooPayments (<code>%2$s</code>).', $result );
	}

	public function test_esc_interpolated_html_handles_nested_tags() {
		$result = WC_Payments_Utils::esc_interpolated_html(
			'Hello <strong>there, <em>John Doe</em> <img/></strong>',
			[
				'strong' => '<strong/>',
				'em'     => '<em>',
				'img'    => '<img src="test"/>',
			]
		);
		$this->assertEquals( 'Hello <strong>there, <em>John Doe</em> <img src="test"/></strong>', $result );
	}

	public function test_get_charge_ids_from_search_term_order_returns_charge_id() {
		$charge_id = 'ch_test_charge';

		// Create an order with charge_id to test with.
		$order = WC_Helper_Order::create_order();
		$order->update_meta_data( '_charge_id', $charge_id );
		$order->save();

		$result = WC_Payments_Utils::get_charge_ids_from_search_term( 'Order #' . $order->get_id() );
		$this->assertEquals( [ $charge_id ], $result );
	}

	public function test_get_charge_ids_from_search_term_subscription_returns_charge_ids() {
		$charge_ids = [ 'ch_test_charge_1', 'ch_test_charge_2' ];

		WC_Subscriptions::set_wcs_get_subscription(
			function ( $id ) use ( $charge_ids ) {
				$subscription = new WC_Subscription();

				$order1 = WC_Helper_Order::create_order();
				$order1->update_meta_data( '_charge_id', $charge_ids[0] );
				$order1->save();
				$order2 = WC_Helper_Order::create_order();
				$order2->update_meta_data( '_charge_id', $charge_ids[1] );
				$order2->save();
				$subscription->set_related_orders( [ $order1, $order2 ] );

				return $subscription;
			}
		);

		$result = WC_Payments_Utils::get_charge_ids_from_search_term( 'Subscription #123' );
		$this->assertEquals( $charge_ids, $result );
	}

	public function test_get_charge_ids_from_search_term_skips_invalid_terms() {
		$result = WC_Payments_Utils::get_charge_ids_from_search_term( 'invalid term' );
		$this->assertEquals( [], $result );
	}

	public function test_get_charge_ids_from_search_term_handles_invalid_order() {
		$result = WC_Payments_Utils::get_charge_ids_from_search_term( 'Order #897' );
		$this->assertEquals( [], $result );
	}

	public function test_get_charge_ids_from_search_term_handles_invalid_subscription() {
		WC_Subscriptions::set_wcs_get_subscription(
			function ( $id ) {
				return false;
			}
		);
		$result = WC_Payments_Utils::get_charge_ids_from_search_term( 'Subscription #897' );
		$this->assertEquals( [], $result );
	}

	public function test_map_search_orders_to_charge_ids() {
		$charge_id = 'ch_test_charge';
		// Create an order with charge_id to test with.
		$order = WC_Helper_Order::create_order();
		$order->update_meta_data( '_charge_id', $charge_id );
		$order->save();

		$result = WC_Payments_Utils::map_search_orders_to_charge_ids( [ 'First term', "Order #{$order->get_id()}", 'Another term' ] );
		$this->assertEquals( [ 'First term', $charge_id, 'Another term' ], $result );
	}

	public function test_map_search_orders_to_charge_ids_subscription_term() {
		$charge_ids = [ 'ch_test_charge_1', 'ch_test_charge_2' ];

		WC_Subscriptions::set_wcs_get_subscription(
			function ( $id ) use ( $charge_ids ) {
				$subscription = new WC_Subscription();

				$order1 = WC_Helper_Order::create_order();
				$order1->update_meta_data( '_charge_id', $charge_ids[0] );
				$order1->save();
				$order2 = WC_Helper_Order::create_order();
				$order2->update_meta_data( '_charge_id', $charge_ids[1] );
				$order2->save();
				$subscription->set_related_orders( [ $order1, $order2 ] );

				return $subscription;
			}
		);

		$result = WC_Payments_Utils::map_search_orders_to_charge_ids( [ 'First term', 'Subscription #123', 'Another term' ] );
		$this->assertEquals( [ 'First term', $charge_ids[0], $charge_ids[1], 'Another term' ], $result );
	}

	public function test_redact_array_redacts() {
		$array          = [
			'nice_key1' => 123,
			'nice_key2' => [
				'nested_nice_key' => 456,
				'nested_bad_key'  => 'hello',
			],
			'bad_key1'  => 'test',
			'bad_key2'  => [
				'nested_key' => 'foo',
			],
		];
		$keys_to_redact = [ 'nested_bad_key', 'bad_key1', 'bad_key2' ];

		$expected = [
			'nice_key1' => 123,
			'nice_key2' => [
				'nested_nice_key' => 456,
				'nested_bad_key'  => '(redacted)',
			],
			'bad_key1'  => '(redacted)',
			'bad_key2'  => '(redacted)',
		];

		$result = WC_Payments_Utils::redact_array( $array, $keys_to_redact );

		$this->assertEquals( $expected, $result );
	}

	public function test_redact_array_handles_recursion() {
		$array              = [
			'test' => 'test',
		];
		$array['recursive'] = &$array;

		$result = WC_Payments_Utils::redact_array( $array, [] );

		$node = $result;
		for ( $i = 0; $i < WC_Payments_Utils::MAX_ARRAY_DEPTH; $i++ ) {
			$node = $node['recursive'];
		}

		$this->assertEquals(
			'(recursion limit reached)',
			$node
		);
	}

	public function test_redact_array_handles_non_arrays() {
		$array = [
			'object'  => new stdClass(),
			'integer' => 123,
			'float'   => 1.23,
			'string'  => 'test',
			'boolean' => true,
			'null'    => null,
		];

		$expected = [
			'object'  => 'stdClass()',
			'integer' => 123,
			'float'   => 1.23,
			'string'  => 'test',
			'boolean' => true,
			'null'    => null,
		];

		$result = WC_Payments_Utils::redact_array( $array, [] );

		$this->assertEquals( $expected, $result );
	}

	public function test_array_map_recursive_maps_multidimensional() {
		$array = [
			'value0',
			'key1' => 'value1',
			'value2',
			'key2' => [
				'key3' => 'value3',
				'key4' => [
					'key5' => 'value5',
				],
				[
					'key6' => 'value6',
					[
						'key7' => 'value7',
					],
				],
			],
			[
				'key8' => 'value8',
				[
					'key9' => 'value9',
				],
			],
		];

		$expected = [
			'value0_modified',
			'key1' => 'value1_modified',
			'value2_modified',
			'key2' => [
				'key3' => 'value3_modified',
				'key4' => [
					'key5' => 'value5_modified',
				],
				[
					'key6' => 'value6_modified',
					[
						'key7' => 'value7_modified',
					],
				],
			],
			[
				'key8' => 'value8_modified',
				[
					'key9' => 'value9_modified',
				],
			],
		];

		$result = WC_Payments_Utils::array_map_recursive(
			$array,
			function ( $value ) {
				return $value . '_modified';
			}
		);

		$this->assertSame( $expected, $result );
	}

	public function test_array_map_recursive_maps_singledimensional() {
		$array = [
			'value0',
			'key1' => 'value1',
			'value2',
		];

		$expected = [
			'value0_modified',
			'key1' => 'value1_modified',
			'value2_modified',
		];

		$result = WC_Payments_Utils::array_map_recursive(
			$array,
			function ( $value ) {
				return $value . '_modified';
			}
		);

		$this->assertSame( $expected, $result );
	}

	public function test_array_map_recursive_maps_empty_array() {
		$array = [];

		$expected = [];

		$result = WC_Payments_Utils::array_map_recursive(
			$array,
			function ( $value ) {
				return $value . '_modified';
			}
		);

		$this->assertSame( $expected, $result );
	}

	public function test_array_map_recursive_maps_empty_array_with_keys() {
		$array = [
			'key1' => [],
			'key2' => [],
			'key3' => [
				'key4' => [],
			],
		];

		$expected = [
			'key1' => [],
			'key2' => [],
			'key3' => [
				'key4' => [],
			],
		];

		$result = WC_Payments_Utils::array_map_recursive(
			$array,
			function ( $value ) {
				return $value . '_modified';
			}
		);

		$this->assertSame( $expected, $result );
	}

	public function test_array_filter_recursive_filters_multidimensional() {
		$array = [
			0      => 'value0',
			'key1' => 'value1',
			1      => 'to_be_removed',
			'key2' => [
				'key3' => 'to_be_removed',
				'key4' => [ // This should also be removed.
					'key5' => 'to_be_removed',
				],
				[
					'key6' => 'value6',
					[ 'key7' => 'to_be_removed' ], // The entire array should be removed.
				],
			],
			99     => [
				'key8' => 'value8',
				[
					'key9' => 'value9',
				],
			],
		];

		$expected = [
			0      => 'value0',
			'key1' => 'value1',
			'key2' => [
				[
					'key6' => 'value6',
				],
			],
			99     => [
				'key8' => 'value8',
				[
					'key9' => 'value9',
				],
			],
		];

		$result = WC_Payments_Utils::array_filter_recursive(
			$array,
			function ( $value ) {
				return 'to_be_removed' !== $value;
			}
		);

		$this->assertSame( $expected, $result );
	}

	public function test_array_filter_recursive_filters_singledimensional() {
		$array = [
			0      => 'value0',
			'key1' => 'value1',
			1      => 'to_be_removed',
			'key2' => 'to_be_removed',
			99     => 'value3',
		];

		$expected = [
			0      => 'value0',
			'key1' => 'value1',
			99     => 'value3',
		];

		$result = WC_Payments_Utils::array_filter_recursive(
			$array,
			function ( $value ) {
				return 'to_be_removed' !== $value;
			}
		);

		$this->assertSame( $expected, $result );
	}

	public function test_array_filter_recursive_filters_without_callback() {
		$array = [
			0      => 'value0',
			'key1' => true,
			1      => '',
			'key2' => null,
			'key3' => false,
			99     => 'value3',
			'0',
			0,
			[],
			'key4' => [],
			200    => [ true, false, 0, '', null ],
			201    => [
				0 => false,
				3 => [],
				7 => [
					'key5' => false,
					'key6' => [],
					'key7' => '1',
				],
			],
		];

		// All non-truthy values are removed.
		$expected = [
			0      => 'value0',
			'key1' => true,
			99     => 'value3',
			200    => [ true ],
			201    => [
				7 => [
					'key7' => '1',
				],
			],
		];

		$result = WC_Payments_Utils::array_filter_recursive( $array );

		$this->assertSame( $expected, $result );
	}

	public function test_array_filter_recursive_filters_empty_array() {
		$array = [];

		$expected = [];

		$result = WC_Payments_Utils::array_filter_recursive(
			$array,
			function ( $value ) {
				return 'to_be_removed' !== $value;
			}
		);

		$this->assertSame( $expected, $result );
	}

	public function test_array_filter_recursive_filters_empty_array_with_keys() {
		$array = [
			'key1' => [],
			'key2' => [],
			'key3' => [
				'key4' => [],
			],
		];

		$expected = [];

		$result = WC_Payments_Utils::array_filter_recursive(
			$array,
			function ( $value ) {
				return 'to_be_removed' !== $value;
			}
		);

		$this->assertSame( $expected, $result );
	}

	public function test_array_merge_recursive_distinct_merges() {
		$a1 = [
			88    => 1,
			'foo' => 2,
			'bar' => [],
			'x'   => 5,
			'z'   => [
				6,
				'm' => 'hi',
			],
		];
		$a2 = [
			99    => 7,
			'foo' => [],
			'bar' => 9,
			'y'   => 10,
			'z'   => [
				'm' => 'bye',
				11,
			],
		];
		$a3 = [
			'z' => [
				6,
				'm' => 'final',
			],
		];

		$expected = [
			88    => 1,
			'foo' => [ 2 ],
			'bar' => [ 9 ],
			'x'   => 5,
			'z'   => [
				6,
				'm' => 'final',
				11,
			],
			7,
			'y'   => 10,
		];

		$result = WC_Payments_Utils::array_merge_recursive_distinct( $a1, $a2, $a3 );

		$this->assertSame( $expected, $result );
	}

	public function test_array_merge_recursive_distinct_two_string_keyed_arrays() {
		$a1 = [
			'key1' => 'value1',
			'key2' => [
				'key2_1' => 'value2',
				'key2_2' => null,
				'key2_3' => 'value22',
			],
			'key3' => [
				'key3_1' => 'value3',
			],
			'foo'  => [
				'bar' => [
					'baz' => 1,
				],
			],
		];
		$a2 = [
			'key1' => null,
			'key2' => [
				'key2_1' => null,
				'key2_2' => 'value',
				'key2_3' => 'value22_modified',
			],
			'key3' => [
				'key3_1' => 'value3_modified',
			],
			'foo'  => [
				'bar' => [
					'baz' => 2,
				],
			],
		];

		$expected = [
			'key1' => 'value1',
			'key2' => [
				'key2_1' => 'value2',
				'key2_2' => 'value',
				'key2_3' => 'value22_modified',
			],
			'key3' => [
				'key3_1' => 'value3_modified',
			],
			'foo'  => [
				'bar' => [
					'baz' => 2,
				],
			],
		];

		$result = WC_Payments_Utils::array_merge_recursive_distinct( $a1, $a2 );

		$this->assertSame( $expected, $result );
	}

	public function test_array_merge_recursive_distinct_with_scalar() {
		$a1 = [
			'key1' => 'value1',
		];
		$a2 = 'scalar';

		$expected = [
			'key1' => 'value1',
			'scalar',
		];

		$result = WC_Payments_Utils::array_merge_recursive_distinct( $a1, $a2 );

		$this->assertEquals( $expected, $result );

		$a1 = 'scalar';
		$a2 = [
			'key1' => 'value1',
			'key3' => [
				'key3_1' => 'value3',
			],
		];

		$expected = [
			'scalar',
			'key1' => 'value1',
			'key3' => [
				'key3_1' => 'value3',
			],
		];

		$result = WC_Payments_Utils::array_merge_recursive_distinct( $a1, $a2 );

		$this->assertEquals( $expected, $result );

		$a1 = 'scalar1';
		$a2 = 2;

		$expected = [
			'scalar1',
			2,
		];

		$result = WC_Payments_Utils::array_merge_recursive_distinct( $a1, $a2 );

		$this->assertSame( $expected, $result );
	}

	public function test_array_merge_recursive_distinct_null_entries() {
		$a1 = [
			'key1' => 'value1',
			'key2' => [
				'key2_1' => 'value2',
				'key2_2' => null,
			],
			'foo'  => [
				'b'   => null,
				'bar' => [
					'baz' => 1,
				],
			],
			'value3',
		];
		$a2 = [
			'key1' => null,
			'key2' => [
				'key2_1' => null,
				'key2_2' => 'value',
			],
			null,
			null,
			'foo'  => [
				'ba'     => null,
				'bar'    => [
					'baz'    => null,
					'bazzzz' => null,
				],
				'barrrr' => null,
			],
			'key3' => null,
			null,
		];

		$expected = [
			'key1' => 'value1',
			'key2' => [
				'key2_1' => 'value2',
				'key2_2' => 'value',
			],
			'foo'  => [
				'b'      => null,
				'bar'    => [
					'baz'    => 1,
					'bazzzz' => null,
				],
				'ba'     => null,
				'barrrr' => null,
			],
			'value3',
			'key3' => null,
		];

		$result = WC_Payments_Utils::array_merge_recursive_distinct( $a1, $a2 );

		$this->assertSame( $expected, $result );
	}

	public function test_get_order_intent_currency() {
		$order = WC_Helper_Order::create_order();

		$this->assertEquals( WC_Payments_Utils::get_order_intent_currency( $order ), $order->get_currency() );

		WC_Payments_Utils::set_order_intent_currency( $order, 'EUR' );
		$this->assertEquals( WC_Payments_Utils::get_order_intent_currency( $order ), 'EUR' );
	}

	public function test_prepare_amount() {
		$this->assertEquals( 24500, WC_Payments_Utils::prepare_amount( 245 ) );
		$this->assertEquals( 10000, WC_Payments_Utils::prepare_amount( 100, 'USD' ) );
		$this->assertEquals( 100, WC_Payments_Utils::prepare_amount( 100, 'JPY' ) );
		$this->assertEquals( 500, WC_Payments_Utils::prepare_amount( 500, 'jpy' ) );
	}

	public function test_interpret_stripe_amount() {
		$this->assertEquals( 1, WC_Payments_Utils::interpret_stripe_amount( 100 ) );
		$this->assertEquals( 1, WC_Payments_Utils::interpret_stripe_amount( 100, 'usd' ) );
		$this->assertEquals( 1, WC_Payments_Utils::interpret_stripe_amount( 100, 'eur' ) );
		$this->assertEquals( 100, WC_Payments_Utils::interpret_stripe_amount( 100, 'jpy' ) );
		$this->assertEquals( 100, WC_Payments_Utils::interpret_stripe_amount( 100, 'bif' ) );
	}

	public function test_interpret_stripe_exchange_rate() {
		$this->assertEquals( 1.00, WC_Payments_Utils::interpret_string_exchange_rate( 1.00, 'USD', 'USD' ) );
		$this->assertEquals( 0.63, WC_Payments_Utils::interpret_string_exchange_rate( 0.63, 'USD', 'EUR' ) );
		$this->assertEquals( 0.63, WC_Payments_Utils::interpret_string_exchange_rate( 0.0063, 'USD', 'JPY' ) );
		$this->assertEquals( 0.0063, WC_Payments_Utils::interpret_string_exchange_rate( 0.63, 'JPY', 'USD' ) );
	}

	public function test_is_zero_decimal_currency() {
		$this->assertEquals( false, WC_Payments_Utils::is_zero_decimal_currency( 'usd' ) );
		$this->assertEquals( false, WC_Payments_Utils::is_zero_decimal_currency( 'USD' ) );
		$this->assertEquals( true, WC_Payments_Utils::is_zero_decimal_currency( 'jpy' ) );
		$this->assertEquals( true, WC_Payments_Utils::is_zero_decimal_currency( 'JPY' ) );
	}

	public function test_it_returns_is_payment_settings_page_for_main_settings_page() {
		global $current_section, $current_tab;

		$this->set_is_admin( true );
		$current_section = 'poocommerce_payments';
		$current_tab     = 'checkout';

		$this->assertTrue( WC_Payments_Utils::is_payments_settings_page() );
	}

	public function test_it_returns_is_payment_settings_page_for_payment_method_settings_page() {
		global $current_section, $current_tab;

		$this->set_is_admin( true );
		$current_section = 'poocommerce_payments_foo';
		$current_tab     = 'checkout';

		$this->assertTrue( WC_Payments_Utils::is_payments_settings_page() );
	}

	/**
	 * @dataProvider not_payment_settings_page_conditions_provider
	 */
	public function test_it_returns_it_is_not_payment_settings_page( $is_admin, $section, $tab ) {
		global $current_section, $current_tab;

		$this->set_is_admin( $is_admin );
		$current_section = $section;
		$current_tab     = $tab;

		$this->assertFalse( WC_Payments_Utils::is_payments_settings_page() );
	}

	public function test_convert_to_stripe_locale() {
		$result = WC_Payments_Utils::convert_to_stripe_locale( 'en_GB' );
		$this->assertEquals( 'en-GB', $result );

		$result = WC_Payments_Utils::convert_to_stripe_locale( 'fr_FR' );
		$this->assertEquals( 'fr', $result );

		$result = WC_Payments_Utils::convert_to_stripe_locale( 'fr_CA' );
		$this->assertEquals( 'fr-CA', $result );

		$result = WC_Payments_Utils::convert_to_stripe_locale( 'es_UY' );
		$this->assertEquals( 'es', $result );
	}

	public function not_payment_settings_page_conditions_provider(): array {
		return [
			'is_admin() is false'                 => [ false, 'poocommerce_payments_foo', 'checkout' ],
			'section is not poocommerce_payments' => [ true, 'foo', 'checkout' ],
			'tab is not checkout'                 => [ true, 'poocommerce_payments', 'shipping' ],
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

	public function test_get_cached_minimum_amount_returns_amount() {
		// Note: WP stores options as strings.
		set_transient( 'wcpay_minimum_amount_usd', '500', DAY_IN_SECONDS );
		$result = WC_Payments_Utils::get_cached_minimum_amount( 'usd' );
		$this->assertSame( 500, $result );
	}

	public function test_get_cached_minimum_amount_returns_null_without_cache() {
		delete_transient( 'wcpay_minimum_amount_usd' );
		$result = WC_Payments_Utils::get_cached_minimum_amount( 'usd' );
		$this->assertNull( $result );
	}

	public function test_get_last_refund_from_order_id_returns_correct_refund() {
		$order    = WC_Helper_Order::create_order();
		$refund_1 = wc_create_refund( [ 'order_id' => $order->get_id() ] );
		$refund_2 = wc_create_refund( [ 'order_id' => $order->get_id() ] );

		$result = WC_Payments_Utils::get_last_refund_from_order_id( $order->get_id() );

		$this->assertEquals( $refund_2->get_id(), $result->get_id() );
	}

	public function test_get_last_refund_from_order_id_returns_null_if_no_refund_exists() {
		$order  = WC_Helper_Order::create_order();
		$result = WC_Payments_Utils::get_last_refund_from_order_id( $order->get_id() );

		$this->assertNull( $result );
	}

	/**
	 * @dataProvider provider_get_currency_format_for_wc_price
	 */
	public function test_get_currency_format_for_wc_price( string $currency, array $expected ) {
		$result = WC_Payments_Utils::get_currency_format_for_wc_price( $currency );
		$this->assertSame( $expected, $result );
	}

	public function provider_get_currency_format_for_wc_price(): array {
		$usd_format = [
			'price_format'       => '%1$s%2$s',
			'thousand_separator' => ',',
			'decimal_separator'  => '.',
			'decimals'           => 2,
			'currency'           => 'USD',
		];

		$eur_format = [
			'price_format'       => '%2$s %1$s',
			'thousand_separator' => '.',
			'decimal_separator'  => ',',
			'decimals'           => 2,
			'currency'           => 'EUR',
		];

		// Decimal currency.
		$vnd_format = [
			'price_format'       => '%2$s %1$s',
			'thousand_separator' => '.',
			'decimal_separator'  => ',',
			'decimals'           => 0,
			'currency'           => 'VND',
		];

		return [
			'USD'                                          => [ 'usd', $usd_format ],
			'EUR with lowercase code'                      => [ 'eur', $eur_format ],
			'EUR with uppercase code'                      => [ 'EUR', $eur_format ],
			'VND with lowercase code'                      => [ 'vnd', $vnd_format ],
			'VND with uppercase code'                      => [ 'VND', $vnd_format ],
			'Not existing code falling back to USD format' => [ 'not_exist', array_merge( $usd_format, [ 'currency' => 'NOT_EXIST' ] ) ],
		];
	}

	/**
	 * @dataProvider provider_format_currency
	 */
	public function test_format_currency( float $amount, string $currency, string $expected ) {
		$result = WC_Payments_Utils::format_currency( $amount, $currency );
		$this->assertSame( $expected, $result );
	}

	public function provider_format_currency(): array {
		return [
			'US dollar'                      => [ 123.456, 'USD', '$123.46' ],
			'US dollar with negative amount' => [ -123.456, 'USD', '-$123.46' ],
			'Euro'                           => [ 12000, 'EUR', '12.000,00 €' ],
			'CHF - no currency symbol'       => [ 123, 'CHF', 'CHF 123.00' ],
			'VND - decimal currency'         => [ 123456, 'VND', '123.456 ₫' ],
		];
	}

	/**
	 * @dataProvider provider_format_explicit_currency
	 */
	public function test_format_explicit_currency( float $amount, string $currency, bool $skip_symbol, array $custom_format, string $expected ) {
		$result = WC_Payments_Utils::format_explicit_currency( $amount, $currency, $skip_symbol, $custom_format );
		$this->assertSame( $expected, $result );
	}

	public function provider_format_explicit_currency(): array {
		return [
			'US dollar - skip symbol'                  => [ 123.456, 'USD', true, [], '123.46 USD' ],
			'US dollar - not skip symbol'              => [ 123.456, 'USD', false, [], '$123.46 USD' ],
			'US dollar with custom decimal'            => [ 123.456, 'USD', true, [ 'decimals' => 5 ], '123.45600 USD' ],
			'Euro - skip symbol'                       => [ 12000, 'EUR', true, [], '12.000,00 EUR' ],
			'Euro - not skip symbol'                   => [ 12000, 'EUR', false, [], '12.000,00 € EUR' ],
			'VND (decimal currency) - skip symbol'     => [ 123456, 'VND', true, [], '123.456 VND' ],
			'VND (decimal currency) - not skip symbol' => [ 123456, 'VND', false, [], '123.456 ₫ VND' ],
		];
	}

	public function test_get_filtered_error_status_code_with_exception() {
		$this->assertSame( 400, WC_Payments_Utils::get_filtered_error_status_code( new Exception( 'Just an exception' ) ) );
	}

	public function test_get_filtered_error_status_code_with_api_exception() {
		$this->assertSame( 401, WC_Payments_Utils::get_filtered_error_status_code( new \WCPay\Exceptions\API_Exception( 'Error: Your card has insufficient funds.', 'card_declined', 401 ) ) );
	}

	public function test_get_filtered_error_status_code_with_api_exception_and_402_status() {
		$this->assertSame( 400, WC_Payments_Utils::get_filtered_error_status_code( new \WCPay\Exceptions\API_Exception( 'Error: Your card was declined.', 'card_declined', 402 ) ) );
	}

	private function delete_appearance_theme_transients( $transients ) {
		foreach ( $transients as $location => $contexts ) {
			foreach ( $contexts as $context => $transient ) {
				delete_transient( $transient );
			}
		}
	}

	private function set_appearance_theme_transients( $transients ) {
		foreach ( $transients as $location => $contexts ) {
			foreach ( $contexts as $context => $transient ) {
				set_transient( $transient, $location . '_' . $context . '_value', DAY_IN_SECONDS );
			}
		}
	}

	public function test_get_active_upe_theme_transient_for_location() {
		$theme_transients = \WC_Payment_Gateway_WCPay::APPEARANCE_THEME_TRANSIENTS;

		// Test with no transients set.
		$this->assertSame( 'stripe', WC_Payments_Utils::get_active_upe_theme_transient_for_location( 'checkout', 'blocks' ) );

		// Set the transients.
		$this->set_appearance_theme_transients( $theme_transients );

		// Test with transients set.
		// Test with invalid location.
		$this->assertSame( 'checkout_blocks_value', WC_Payments_Utils::get_active_upe_theme_transient_for_location( 'invalid_location', 'blocks' ) );

		// Test with valid location and invalid context.
		$this->assertSame( 'checkout_blocks_value', WC_Payments_Utils::get_active_upe_theme_transient_for_location( 'checkout', 'invalid_context' ) );

		// Test with valid location and context.
		foreach ( $theme_transients as $location => $contexts ) {
			foreach ( $contexts as $context => $transient ) {
				// Our transient for the product page is the same transient for both block and classic.
				if ( 'product_page' === $location ) {
					$this->assertSame( 'product_page_classic_value', WC_Payments_Utils::get_active_upe_theme_transient_for_location( $location, 'blocks' ) );
					$this->assertSame( 'product_page_classic_value', WC_Payments_Utils::get_active_upe_theme_transient_for_location( $location, 'classic' ) );
				} else {
					$this->assertSame( $location . '_' . $context . '_value', WC_Payments_Utils::get_active_upe_theme_transient_for_location( $location, $context ) );
				}
			}
		}

		// Remove the transients.
		$this->delete_appearance_theme_transients( $theme_transients );
	}

	public function test_is_store_api_request_with_store_api_request() {
		$_SERVER['REQUEST_URI'] = '/index.php';
		$_REQUEST['rest_route'] = '/wc/store/v1/checkout';

		$this->assertTrue( WC_Payments_Utils::is_store_api_request() );

		unset( $_REQUEST['rest_route'] );
	}

	public function test_is_store_api_request_with_another_request() {
		$_SERVER['REQUEST_URI'] = '/index.php';

		$this->assertFalse( WC_Payments_Utils::is_store_api_request() );

		unset( $_REQUEST['rest_route'] );
	}

	public function test_is_store_api_request_with_malformed_url() {
		$_SERVER['REQUEST_URI'] = '///wp-json/wc/store/v1/checkout';

		$this->assertFalse( WC_Payments_Utils::is_store_api_request() );
	}

	public function test_is_store_api_request_with_url_with_no_path() {
		$_SERVER['REQUEST_URI'] = '?something';
		$this->assertFalse( WC_Payments_Utils::is_store_api_request() );

		$_SERVER['REQUEST_URI'] = '';
		$this->assertFalse( WC_Payments_Utils::is_store_api_request() );
	}

	public function test_is_store_api_request_with_multisite_subdirectory() {
		// Test multisite subdirectory setup where the path includes the site subdirectory.
		$_SERVER['REQUEST_URI'] = '/child-1/wp-json/wc/store/v1/cart/add-item';
		$this->assertTrue( WC_Payments_Utils::is_store_api_request() );

		// Test multisite subdirectory with non-store API endpoint.
		$_SERVER['REQUEST_URI'] = '/child-1/wp-json/wp/v2/posts';
		$this->assertFalse( WC_Payments_Utils::is_store_api_request() );

		// Test deeply nested subdirectory.
		$_SERVER['REQUEST_URI'] = '/network/child-site/wp-json/wc/store/v1/cart';
		$this->assertTrue( WC_Payments_Utils::is_store_api_request() );
	}

	public function test_is_any_bnpl_supporting_country() {
		// Test supported country and currency combination (US with USD).
		$this->assertTrue(
			WC_Payments_Utils::is_any_bnpl_supporting_country(
				[ 'afterpay_clearpay', 'klarna' ],
				'US',
				'USD'
			)
		);

		// Test unsupported country and currency combination.
		$this->assertFalse(
			WC_Payments_Utils::is_any_bnpl_supporting_country(
				[ 'afterpay_clearpay', 'klarna' ],
				'CN',
				'CNY'
			)
		);

		// Test with empty enabled methods.
		$this->assertFalse(
			WC_Payments_Utils::is_any_bnpl_supporting_country(
				[],
				'US',
				'USD'
			)
		);
	}

	public function test_is_any_bnpl_method_available() {
		// Price within range for Afterpay/Clearpay in the US.
		$this->assertTrue(
			WC_Payments_Utils::is_any_bnpl_method_available(
				[ 'afterpay_clearpay' ],
				'US',
				'USD',
				100
			)
		);

		// Price within range for Klarna in the US.
		$this->assertTrue(
			WC_Payments_Utils::is_any_bnpl_method_available(
				[ 'klarna' ],
				'US',
				'USD',
				500
			)
		);

		// Price below minimum for all methods.
		$this->assertFalse(
			WC_Payments_Utils::is_any_bnpl_method_available(
				[ 'afterpay_clearpay', 'klarna', 'affirm' ],
				'US',
				'USD',
				0.50
			)
		);

		// Price above maximum for all methods.
		$this->assertFalse(
			WC_Payments_Utils::is_any_bnpl_method_available(
				[ 'afterpay_clearpay', 'klarna', 'affirm' ],
				'US',
				'USD',
				4000000
			)
		);

		// Unsupported country.
		$this->assertFalse(
			WC_Payments_Utils::is_any_bnpl_method_available(
				[ 'afterpay_clearpay', 'klarna', 'affirm' ],
				'RU',
				'RUB',
				100
			)
		);

		// Unsupported currency.
		$this->assertFalse(
			WC_Payments_Utils::is_any_bnpl_method_available(
				[ 'afterpay_clearpay', 'klarna', 'affirm' ],
				'US',
				'JPY',
				100
			)
		);

		// Empty enabled methods array.
		$this->assertFalse(
			WC_Payments_Utils::is_any_bnpl_method_available(
				[],
				'US',
				'USD',
				100
			)
		);

		// Different country, same currency (Afterpay/Clearpay in Canada).
		$this->assertTrue(
			WC_Payments_Utils::is_any_bnpl_method_available(
				[ 'afterpay_clearpay' ],
				'CA',
				'CAD',
				100
			)
		);
	}
}
