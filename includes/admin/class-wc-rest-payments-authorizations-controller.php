<?php
/**
 * Class WC_REST_Payments_Authorizations_Controller
 *
 * @package PooCommerce\Payments\Admin
 */

use WCPay\Core\Server\Request;
use WCPay\Core\Server\Request\List_Authorizations;

defined( 'ABSPATH' ) || exit;

/**
 * REST controller for authorizations.
 */
class WC_REST_Payments_Authorizations_Controller extends WC_Payments_REST_Controller {

	/**
	 * Endpoint path.
	 *
	 * @var string
	 */
	protected $rest_base = 'payments/authorizations';

	/**
	 * Configure REST API routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'get_authorizations' ],
				'permission_callback' => [ $this, 'check_permission' ],
			]
		);
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/summary',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'get_authorizations_summary' ],
				'permission_callback' => [ $this, 'check_permission' ],
			]
		);
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<payment_intent_id>\w+)',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'get_authorization' ],
				'permission_callback' => [ $this, 'check_permission' ],
			]
		);
	}

	/**
	 * Retrieve authorizations to respond with via API.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 */
	public function get_authorizations( WP_REST_Request $request ) {
		$wcpay_request = List_Authorizations::from_rest_request( $request );

		return $wcpay_request->handle_rest_request();
	}

	/**
	 * Retrieve authorization to respond with via API.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 */
	public function get_authorization( WP_REST_Request $request ) {
		$payment_intent_id = $request->get_param( 'payment_intent_id' );
		$request           = Request::get( WC_Payments_API_Client::AUTHORIZATIONS_API, $payment_intent_id );
		$request->assign_hook( 'wcpay_get_authorization_request' );
		return $request->handle_rest_request();
	}

	/**
	 * Retrieve authorizations summary to respond with via API.
	 */
	public function get_authorizations_summary() {
		$request = Request::get( WC_Payments_API_Client::AUTHORIZATIONS_API . '/summary' );
		$request->assign_hook( 'wc_pay_get_authorizations_summary' );
		return $request->handle_rest_request();
	}
}
