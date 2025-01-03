<?php
/**
 * Class InvalidCurrencyRateException
 *
 * @package PooCommerce\Payments
 */

namespace WCPay\MultiCurrency\Exceptions;

use Exception;

defined( 'ABSPATH' ) || exit;

/**
 * Exception for throwing errors when an invalid currency rate is used.
 */
class InvalidCurrencyRateException extends Exception {}
