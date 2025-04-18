<?php
/**
 * Class Capture_Type
 *
 * @package PooCommerce\Payments
 */

namespace WCPay\Constants;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Enum used in WCPay\Payment_Information to determine whether a payment was
 * initated by a merchant or a customer.
 *
 * @psalm-immutable
 */
class Payment_Capture_Type extends Base_Constant {
	const AUTOMATIC = 'automatic_capture';
	const MANUAL    = 'manual_capture';
}
