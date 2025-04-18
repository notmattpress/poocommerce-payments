<?php
/**
 * Class file for WCPay\Core\Server\Request\Create_Intention.
 *
 * @package PooCommerce Payments
 */

namespace WCPay\Core\Server\Request;

use WCPay\Core\Exceptions\Server\Request\Invalid_Request_Parameter_Exception;
use WC_Payments_API_Client;

/**
 * Request class for creating intents.
 */
class Create_And_Confirm_Intention extends Create_Intention {

	const IMMUTABLE_PARAMS = [
		// Those are up to us, we have to decide.
		'amount',
		'currency',
		'payment_method',
		'payment_method_update_data',
		'return_url',
	];

	const REQUIRED_PARAMS = [
		'amount',
		'currency',
		'payment_method',
		'customer',
		'metadata',
	];

	const DEFAULT_PARAMS = [
		'confirm'        => true, // By the definition of the request.
		'capture_method' => 'automatic',
	];

	/**
	 * Specifies the WordPress hook name that will be triggered upon calling the send() method.
	 *
	 * @var string
	 */
	protected $hook = 'wcpay_create_and_confirm_intent_request';

	/**
	 * Returns the request's API.
	 *
	 * @return string
	 */
	public function get_api(): string {
		return WC_Payments_API_Client::INTENTIONS_API;
	}

	/**
	 * Returns the request's HTTP method.
	 */
	public function get_method(): string {
		return 'POST';
	}

	/**
	 * If the payment method should be saved to the store, this enables future usage.
	 */
	public function setup_future_usage() {
		$this->set_param( 'setup_future_usage', 'off_session' );
	}

	/**
	 * Off-session setter.
	 *
	 * @param bool $off_session Whether the payment is off-session (merchant-initiated), or on-session (customer-initiated).
	 */
	public function set_off_session( bool $off_session = true ) {
		// This one is tricky. We can have `true`, but otherwise we need to get rid of the parameter.
		if ( $off_session ) {
			$this->set_param( 'off_session', true );
		} else {
			$this->unset_param( 'off_session' );
		}
	}

	/**
	 * Payment methods setter.
	 *
	 * @param  array $payment_methods               An array of payment methods that might be used for the payment.
	 * @throws Invalid_Request_Parameter_Exception  When there are no payment methods provided.
	 */
	public function set_payment_methods( array $payment_methods ) {
		$this->set_param( 'payment_method_types', $payment_methods );
	}

	/**
	 * Payment method update data setter.
	 *
	 * @param array $payment_method_update_data Data to update on payment method.
	 *
	 * @return void
	 */
	public function set_payment_method_update_data( array $payment_method_update_data ) {
		$this->set_param( 'payment_method_update_data', $payment_method_update_data );
	}

	/**
	 * CVC confirmation setter.
	 *
	 * @param string $cvc_confirmation The CVC confirmation for this payment method (Optional).
	 */
	public function set_cvc_confirmation( $cvc_confirmation = null ) {
		$this->set_param( 'cvc_confirmation', $cvc_confirmation );
	}

	/**
	 * Return URL setter.
	 *
	 * @param string $return_url The URL to redirect the customer back to after they authenticate their payment on the payment method’s site.
	 */
	public function set_return_url( $return_url ) {
		$this->set_param( 'return_url', $return_url );
	}
}
