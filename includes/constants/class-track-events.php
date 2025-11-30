<?php
/**
 * Class Track_Events
 *
 * @package PooCommerce\Payments
 */

namespace WCPay\Constants;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Event names for PooCommerce Analytics.
 *
 * @psalm-immutable
 */
class Track_Events extends Base_Constant {
	// Payment method events.
	public const PAYMENT_METHOD_ENABLED  = 'wcpay_payment_method_enabled';
	public const PAYMENT_METHOD_DISABLED = 'wcpay_payment_method_disabled';
}
