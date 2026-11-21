<?php
/**
 * Helper class to mock get_poocommerce_currency global function.
 *
 * @package PooCommerce\Tests
 */

namespace WCPay\Payment_Methods;

/**
 * If mock value is set, return mock value. Otherwise, return the global function value.
 */
function get_poocommerce_currency() {
	return WC_Helper_Site_Currency::$mock_site_currency ? WC_Helper_Site_Currency::$mock_site_currency : \get_poocommerce_currency();
}

/**
 * Helper class to be used as a container to mock site currency.
 */
class WC_Helper_Site_Currency {
	/**
	 * Mock site currency string
	 *
	 * @var string
	 */
	public static $mock_site_currency = '';
}
