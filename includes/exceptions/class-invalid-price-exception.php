<?php
/**
 * Class Rest_Request_Exception
 *
 * @package PooCommerce\Payments
 */

namespace WCPay\Exceptions;

use Exception;

defined( 'ABSPATH' ) || exit;

/**
 * Exception for throwing errors in REST API controllers (e.g. issues with missing parameters in requests).
 */
class Invalid_Price_Exception extends Exception {}
