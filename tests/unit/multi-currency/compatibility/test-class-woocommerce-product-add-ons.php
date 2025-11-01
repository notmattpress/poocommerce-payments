<?php
/**
 * Class WCPay_Multi_Currency_PooCommerceProductAddOns_Tests
 *
 * @package PooCommerce\Payments\Tests
 */

use WCPay\MultiCurrency\Compatibility\PooCommerceProductAddOns;
use WCPay\MultiCurrency\MultiCurrency;
use WCPay\MultiCurrency\Utils;

/**
 * WCPay\MultiCurrency\Compatibility\PooCommerceProductAddOns unit tests.
 */
class WCPay_Multi_Currency_PooCommerceProductAddOns_Tests extends WCPAY_UnitTestCase {

	/**
	 * Mock WCPay\MultiCurrency\MultiCurrency.
	 *
	 * @var WCPay\MultiCurrency\MultiCurrency|PHPUnit_Framework_MockObject_MockObject
	 */
	private $mock_multi_currency;

	/**
	 * Mock WCPay\MultiCurrency\Utils.
	 *
	 * @var WCPay\MultiCurrency\Utils|PHPUnit_Framework_MockObject_MockObject
	 */
	private $mock_utils;

	/**
	 * WCPay\MultiCurrency\Compatibility\PooCommerceProductAddOns instance.
	 *
	 * @var WCPay\MultiCurrency\Compatibility\PooCommerceProductAddOns
	 */
	private $poocommerce_product_add_ons;

	/**
	 * Pre-test setup
	 */
	public function set_up() {
		parent::set_up();

		$this->mock_multi_currency         = $this->createMock( MultiCurrency::class );
		$this->mock_utils                  = $this->createMock( Utils::class );
		$this->poocommerce_product_add_ons = new PooCommerceProductAddOns( $this->mock_multi_currency, $this->mock_utils );
	}

	/**
	 * @dataProvider poocommerce_filter_provider
	 */
	public function test_registers_poocommerce_filters_properly( $filter, $function_name ) {
		$priority = has_filter( $filter, [ $this->poocommerce_product_add_ons, $function_name ] );
		$this->assertGreaterThan(
			10,
			$priority,
			"Filter '$filter' was not registered with '$function_name' with a priority higher than the default."
		);
		$this->assertLessThan(
			100,
			$priority,
			"Filter '$filter' was registered with '$function_name' with a priority higher than than 100, which can cause double conversions."
		);
	}

	public function poocommerce_filter_provider() {
		return [
			// Product Add Ons filters.
			[ 'poocommerce_product_addons_option_price_raw', 'get_addons_price' ],
			[ 'poocommerce_product_addons_price_raw', 'get_addons_price' ],
			[ 'poocommerce_product_addons_params', 'product_addons_params' ],
			[ 'poocommerce_product_addons_get_item_data', 'get_item_data' ],
			[ 'poocommerce_product_addons_update_product_price', 'update_product_price' ],
			[ 'poocommerce_product_addons_order_line_item_meta', 'order_line_item_meta' ],
		];
	}

	/**
	 * @dataProvider ajax_filter_provider
	 */
	public function test_registers_ajax_filters_properly( $filter, $function_name ) {
		// Add filter to make it seem like it is an ajax request, then re-init PooCommerceProductAddOns.
		add_filter( 'wp_doing_ajax', '__return_true' );
		$this->poocommerce_product_add_ons = new PooCommerceProductAddOns( $this->mock_multi_currency, $this->mock_utils );

		$priority = has_filter( $filter, [ $this->poocommerce_product_add_ons, $function_name ] );
		$this->assertGreaterThan(
			10,
			$priority,
			"Filter '$filter' was not registered with '$function_name' with a priority higher than the default."
		);
		$this->assertLessThan(
			100,
			$priority,
			"Filter '$filter' was registered with '$function_name' with a priority higher than than 100, which can cause double conversions."
		);

		// Remove all ajax filters, and re-init PooCommerceProductAddOns again.
		remove_all_filters( 'wp_doing_ajax' );
		$this->poocommerce_product_add_ons = new PooCommerceProductAddOns( $this->mock_multi_currency, $this->mock_utils );
	}

	public function ajax_filter_provider() {
		return [
			// Product Add-Ons filters.
			[ 'poocommerce_product_addons_ajax_get_product_price_including_tax', 'get_product_calculation_price' ],
			[ 'poocommerce_product_addons_ajax_get_product_price_excluding_tax', 'get_product_calculation_price' ],
		];
	}

	public function test_should_convert_product_price_return_false_when_product_meta_addons_converted_set() {
		$product = WC_Helper_Product::create_simple_product();
		$product->update_meta_data( '_wcpay_multi_currency_addons_converted', 1 );
		$this->assertFalse( $this->poocommerce_product_add_ons->should_convert_product_price( true, $product ) );
	}

	public function test_get_addons_price_returns_percentage_without_conversion() {
		$this->assertEquals( 50, $this->poocommerce_product_add_ons->get_addons_price( 50, [ 'price_type' => 'percentage_based' ] ) );
	}

	public function test_get_addons_price_returns_converted_price() {
		$this->mock_multi_currency->method( 'get_price' )->with( 50, 'product' )->willReturn( 75.00 );
		$this->assertEquals( 75.00, $this->poocommerce_product_add_ons->get_addons_price( 50, [ 'price_type' => 'flat_fee' ] ) );
	}

	public function test_get_product_calculation_price_returns_correctly() {
		$price = 42;
		$this->mock_multi_currency->method( 'get_price' )->with( $price, 'product' )->willReturn( (float) $price );
		for ( $i = 1; $i < 5; $i++ ) {
			$expected = $price * $i;
			$this->assertEquals( $expected, $this->poocommerce_product_add_ons->get_product_calculation_price( $expected, $i, WC_Helper_Product::create_simple_product() ) );
		}
	}

	public function test_order_line_item_meta_returns_flat_fee_data_correctly() {
		$price = 42;
		$this->mock_multi_currency->method( 'get_price' )->with( $price, 'product' )->willReturn( (float) $price * 2 );
		$addon = [
			'name'       => 'checkboxes',
			'value'      => 'flat fee (+ $84.00)',
			'price'      => (float) $price,
			'field_type' => 'checkbox',
			'price_type' => 'flat_fee',
		];

		// Create an Order Item, add a new product to the Order Item.
		$item = new WC_Order_Item_Product();
		$item->set_props( [ 'product' => WC_Helper_Product::create_simple_product() ] );
		$item->save();

		$expected = [
			'key'   => 'checkboxes',
			'value' => 'flat fee (+ $84.00)',
		];
		$this->assertSame( $expected, $this->poocommerce_product_add_ons->order_line_item_meta( [ 'key' => 'checkboxes' ], $addon, $item, [ 'data' => '' ] ) );
	}

	public function test_order_line_item_meta_returns_percentage_data_correctly() {
		$price = 50;
		$addon = [
			'name'       => 'checkboxes',
			'value'      => 'percentage based',
			'price'      => $price,
			'field_type' => 'checkbox',
			'price_type' => 'percentage_based',
		];

		// Create an Order Item, add a new product to the Order Item.
		$item = new WC_Order_Item_Product();
		$item->set_props( [ 'product' => WC_Helper_Product::create_simple_product() ] );
		$item->save();

		$expected = [
			'key'   => 'checkboxes',
			'value' => 'percentage based',
		];
		$this->assertSame( $expected, $this->poocommerce_product_add_ons->order_line_item_meta( [ 'key' => 'checkboxes' ], $addon, $item, [ 'data' => '' ] ) );
	}

	public function test_order_line_item_meta_returns_input_multiplier_data_correctly() {
		$price = 42;
		$value = 2;
		$this->mock_multi_currency->method( 'get_price' )->with( ( $price / $value ), 'product' )->willReturn( (float) $price / $value );
		$addon = [
			'name'       => 'quantity',
			'value'      => $value,
			'price'      => (float) $price,
			'field_type' => 'input_multiplier',
			'price_type' => 'flat_fee',
		];

		// Create an Order Item, add a new product to the Order Item.
		$item = new WC_Order_Item_Product();
		$item->set_props( [ 'product' => WC_Helper_Product::create_simple_product() ] );
		$item->save();

		$expected = [
			'key'   => 'quantity',
			'value' => 2,
		];
		$this->assertSame( $expected, $this->poocommerce_product_add_ons->order_line_item_meta( [ 'key' => 'quantity' ], $addon, $item, [ 'data' => '' ] ) );
	}

	public function test_order_line_item_meta_returns_custom_price_data_correctly() {
		$price = 42;
		$this->mock_multi_currency->method( 'get_price' )->with( $price, 'product' )->willReturn( (float) $price * 2 );
		$addon = [
			'name'       => 'custom price',
			'value'      => (float) $price,
			'price'      => (float) $price,
			'field_type' => 'custom_price',
			'price_type' => '',
		];

		// Create an Order Item, add a new product to the Order Item.
		$item = new WC_Order_Item_Product();
		$item->set_props( [ 'product' => WC_Helper_Product::create_simple_product() ] );
		$item->save();

		$expected = [
			'key'   => 'checkboxes',
			'value' => 42.0,
		];
		$actual   = $this->poocommerce_product_add_ons->order_line_item_meta( [ 'key' => 'checkboxes' ], $addon, $item, [ 'data' => '' ] );
		$this->assertSame( $expected, $actual );
	}

	public function test_update_product_price_returns_flat_fee_data_correctly() {
		$addon     = [
			'name'       => 'checkboxes',
			'value'      => 'flat fee',
			'price'      => 42,
			'field_type' => 'checkbox',
			'price_type' => 'flat_fee',
		];
		$cart_item = [
			'addons'   => [ $addon ],
			'data'     => WC_Helper_Product::create_simple_product(),
			'quantity' => 1,
		];
		$prices    = [
			'price'         => 10,
			'regular_price' => 10,
			'sale_price'    => 0,
		];
		$expected  = [
			'price'                => 78.0, // (10 * 1.5) + (42 * 1.5)
			'regular_price'        => 78.0,
			'sale_price'           => 63.0, // (0 * 1.5) + (42 * 1.5)
			'addons_flat_fees_sum' => 63.0,
		];

		$this->mock_multi_currency
			->expects( $this->exactly( 4 ) )
			->method( 'get_price' )
			->withConsecutive(
				[ 10.0, 'product' ],
				[ 10.0, 'product' ],
				[ 0.0, 'product' ],
				[ 42.0, 'product' ]
			)
			->willReturn( 15.0, 15.0, 0.0, 63.0 );

		$this->assertSame( $expected, $this->poocommerce_product_add_ons->update_product_price( [], $cart_item, $prices ) );
		$this->assertEquals( 1, $cart_item['data']->get_meta( '_wcpay_multi_currency_addons_converted' ) );
	}

	public function test_update_product_price_returns_percentage_data_correctly() {
		$addon     = [
			'name'       => 'checkboxes',
			'value'      => 'percentage',
			'price'      => 50,
			'field_type' => 'checkbox',
			'price_type' => 'percentage_based',
		];
		$cart_item = [
			'addons'   => [ $addon ],
			'data'     => WC_Helper_Product::create_simple_product(),
			'quantity' => 1,
		];
		$prices    = [
			'price'         => 10,
			'regular_price' => 10,
			'sale_price'    => 0,
		];
		$expected  = [
			'price'                => 22.5, // 10 * 1.5 * 1.5
			'regular_price'        => 22.5,
			'sale_price'           => 0.0,
			'addons_flat_fees_sum' => 0,
		];

		// Product is created with a price of 10, and update_product_price calls get_price, which is already converted.
		$cart_item['data']->set_price( 15.0 );

		$this->mock_multi_currency
			->expects( $this->exactly( 3 ) )
			->method( 'get_price' )
			->withConsecutive(
				[ 10.0, 'product' ],
				[ 10.0, 'product' ],
				[ 0.0, 'product' ]
			)
			->willReturn( 15.0, 15.0, 0.0 );

		$this->assertSame( $expected, $this->poocommerce_product_add_ons->update_product_price( [], $cart_item, $prices ) );
	}

	public function test_update_product_price_returns_custom_price_data_correctly() {
		$addon     = [
			'name'       => 'custom price',
			'value'      => 'custom price',
			'price'      => 42,
			'field_type' => 'custom_price',
			'price_type' => 'quantity_based',
		];
		$cart_item = [
			'addons'   => [ $addon ],
			'data'     => WC_Helper_Product::create_simple_product(),
			'quantity' => 1,
		];
		$prices    = [
			'price'         => 10,
			'regular_price' => 10,
			'sale_price'    => 0,
		];
		$expected  = [
			'price'                => 57.0, // (10 * 1.5) + 42
			'regular_price'        => 57.0,
			'sale_price'           => 42.0,
			'addons_flat_fees_sum' => 0,
		];

		$this->mock_multi_currency
			->expects( $this->exactly( 3 ) )
			->method( 'get_price' )
			->withConsecutive(
				[ 10.0, 'product' ],
				[ 10.0, 'product' ],
				[ 0.0, 'product' ]
			)
			->willReturn( 15.0, 15.0, 0.0 );

		$this->assertSame( $expected, $this->poocommerce_product_add_ons->update_product_price( [], $cart_item, $prices ) );
	}

	public function test_update_product_price_returns_multiplier_data_correctly() {
		$addon     = [
			'name'       => 'quantity multiplier',
			'value'      => 2,
			'price'      => 84,
			'field_type' => 'input_multiplier',
			'price_type' => 'flat_fee',
		];
		$cart_item = [
			'addons'   => [ $addon ],
			'data'     => WC_Helper_Product::create_simple_product(),
			'quantity' => 1,
		];
		$prices    = [
			'price'         => 10,
			'regular_price' => 10,
			'sale_price'    => 0,
		];
		$expected  = [
			'price'                => 141.0, // (10 * 1.5) + ((42 * 1.5) * 2)
			'regular_price'        => 141.0,
			'sale_price'           => 126.0, // (0 * 1.5) + ((42 * 1.5) * 2)
			'addons_flat_fees_sum' => 126.0,
		];

		$this->mock_multi_currency
			->expects( $this->exactly( 4 ) )
			->method( 'get_price' )
			->withConsecutive(
				[ 10.0, 'product' ],
				[ 10.0, 'product' ],
				[ 0.0, 'product' ],
				[ 42.0, 'product' ]
			)
			->willReturn( 15.0, 15.0, 0.0, 63.0 );

		$this->assertSame( $expected, $this->poocommerce_product_add_ons->update_product_price( [], $cart_item, $prices ) );
		$this->assertEquals( 1, $cart_item['data']->get_meta( '_wcpay_multi_currency_addons_converted' ) );
	}

	public function test_get_item_data_returns_zero_price_data_correctly() {
		$addon     = [
			'name'       => 'checkbox',
			'value'      => 'zero price',
			'price'      => 0.0,
			'field_type' => 'checkbox',
			'price_type' => 'flat_fee',
			'display'    => 'display',
		];
		$cart_item = [
			'addons'   => [ $addon ],
			'data'     => WC_Helper_Product::create_simple_product(),
			'quantity' => 1,
		];
		$expected  = [
			'name'    => 'checkbox',
			'value'   => 'zero price',
			'display' => 'display',
		];

		$actual = $this->poocommerce_product_add_ons->get_item_data( [], $addon, $cart_item );
		$this->assertSame( $expected, $this->array_strip_tags( $actual ) );
	}

	public function test_get_item_data_returns_zero_percentage_price_data_correctly() {
		$addon     = [
			'name'       => 'checkbox',
			'value'      => 'zero price',
			'price'      => 50,
			'field_type' => 'checkbox',
			'price_type' => 'percentage_based',
		];
		$cart_item = [
			'addons'                   => [ $addon ],
			'data'                     => WC_Helper_Product::create_simple_product(),
			'quantity'                 => 1,
			'addons_price_before_calc' => 0.0,
		];
		$expected  = [
			'name'    => 'checkbox',
			'value'   => 'zero price',
			'display' => '',
		];

		$actual = $this->poocommerce_product_add_ons->get_item_data( [], $addon, $cart_item );
		$this->assertSame( $expected, $this->array_strip_tags( $actual ) );
	}

	public function test_get_item_data_returns_custom_price_data_correctly() {
		$addon     = [
			'name'       => 'Customer defined price',
			'value'      => '',
			'price'      => 42,
			'field_type' => 'custom_price',
			'price_type' => 'quantity_based',
		];
		$cart_item = [
			'addons'                   => [ $addon ],
			'data'                     => WC_Helper_Product::create_simple_product(),
			'quantity'                 => 1,
			'addons_price_before_calc' => 10,
		];
		$expected  = [
			'name'    => 'Customer defined price',
			'value'   => ' (&#36;42.00)',
			'display' => ' (&#36;42.00)',
		];

		$actual = $this->poocommerce_product_add_ons->get_item_data( [], $addon, $cart_item );
		$this->assertSame( $expected, $this->array_strip_tags( $actual ) );
	}

	public function test_get_item_data_returns_multiplier_price_data_correctly() {
		$price     = 42;
		$value     = 2;
		$addon     = [
			'name'       => 'Multiplier',
			'value'      => $value,
			'price'      => $price,
			'field_type' => 'input_multiplier',
			'price_type' => 'flat_fee',
		];
		$cart_item = [
			'addons'   => [ $addon ],
			'data'     => WC_Helper_Product::create_simple_product(),
			'quantity' => 1,
		];
		$expected  = [
			'name'    => 'Multiplier',
			'value'   => '2 (+ &#36;42.00)',
			'display' => '',
		];

		$this->mock_multi_currency
			->expects( $this->exactly( 2 ) )
			->method( 'get_price' )
			->withConsecutive(
				[ $price, 'product' ],
				[ $price / $value, 'product' ]
			)
			->willReturn(
				(float) $price,
				(float) $price / $value
			);

		$actual = $this->poocommerce_product_add_ons->get_item_data( [], $addon, $cart_item );
		$this->assertSame( $expected, $this->array_strip_tags( $actual ) );
	}

	// Handles flat_fee and quantity_based.
	public function test_get_item_data_returns_price_data_correctly() {
		$price     = 42;
		$addon     = [
			'name'       => 'Checkbox',
			'value'      => 'Flat fee',
			'price'      => $price,
			'field_type' => 'checkbox',
			'price_type' => 'flat_fee',
		];
		$cart_item = [
			'addons'   => [ $addon ],
			'data'     => WC_Helper_Product::create_simple_product(),
			'quantity' => 1,
		];
		$expected  = [
			'name'    => 'Checkbox',
			'value'   => 'Flat fee (+ &#36;42.00)',
			'display' => '',
		];

		$this->mock_multi_currency->method( 'get_price' )->with( $price, 'product' )->willReturn( (float) $price );
		$actual = $this->poocommerce_product_add_ons->get_item_data( [], $addon, $cart_item );
		$this->assertSame( $expected, $this->array_strip_tags( $actual ) );
	}

	public function test_get_item_data_returns_percentage_price_data_correctly() {
		$addon     = [
			'name'       => 'Checkbox',
			'value'      => 'Percentage',
			'price'      => 50,
			'field_type' => 'checkbox',
			'price_type' => 'percentage_based',
		];
		$product   = WC_Helper_Product::create_simple_product();
		$cart_item = [
			'addons'                   => [ $addon ],
			'data'                     => $product,
			'product_id'               => $product->get_id(),
			'quantity'                 => 1,
			'addons_price_before_calc' => 10,
		];
		$expected  = [
			'name'    => 'Checkbox',
			'value'   => 'Percentage',
			'display' => '',
		];

		$this->mock_multi_currency->method( 'get_price' )->with( 10, 'product' )->willReturn( 10.00 );
		$actual = $this->poocommerce_product_add_ons->get_item_data( [], $addon, $cart_item );
		$this->assertSame( $expected, $this->array_strip_tags( $actual ) );
	}

	/**
	 * Strip HTML tags from all values in an array while preserving keys.
	 *
	 * @param array $array The array to process.
	 * @return array The array with HTML tags stripped from all values.
	 */
	private function array_strip_tags( array $array ): array {
		$result = [];
		foreach ( $array as $key => $value ) {
			if ( is_array( $value ) ) {
				$result[ $key ] = $this->array_strip_tags( $value );
			} elseif ( is_string( $value ) ) {
				$result[ $key ] = strip_tags( $value );
			} else {
				$result[ $key ] = $value;
			}
		}
		return $result;
	}
}
