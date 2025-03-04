<?php
/**
 * Class WC_REST_Payments_VAT_Controller
 *
 * @package PooCommerce\Payments\Admin
 */

use WCPay\Core\Server\Request;
use WCPay\Exceptions\API_Exception;

defined( 'ABSPATH' ) || exit;

/**
 * REST controller for vat.
 */
class WC_REST_Payments_VAT_Controller extends WC_Payments_REST_Controller {

	/**
	 * Endpoint path.
	 *
	 * @var string
	 */
	protected $rest_base = 'payments/vat';

	/**
	 * Configure REST API routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<vat_number>[\w\.\%]+)',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'validate_vat' ],
				'permission_callback' => [ $this, 'check_permission' ],
			]
		);
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				'methods'             => WP_REST_Server::EDITABLE,
				'args'                => [
					'vat_number' => [
						'type'     => 'string',
						'format'   => 'text-field',
						'required' => false,
					],
					'name'       => [
						'type'     => 'string',
						'format'   => 'text-field',
						'required' => true,
					],
					'address'    => [
						'type'     => 'string',
						'format'   => 'textarea-field',
						'required' => true,
					],
				],
				'callback'            => [ $this, 'save_vat_details' ],
				'permission_callback' => [ $this, 'check_permission' ],
			]
		);
	}

	/**
	 * Validate VAT number to respond with via API.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 */
	public function validate_vat( $request ) {
		$vat_number     = sanitize_text_field( $request->get_param( 'vat_number' ) );
		$server_request = Request::get( WC_Payments_API_Client::VAT_API, $vat_number );
		$server_request->assign_hook( 'wcpay_validate_vat_request' );
		return $server_request->handle_rest_request();
	}

	/**
	 * Save VAT details and respond via API.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 */
	public function save_vat_details( $request ) {
		$vat_number = $request->get_param( 'vat_number' );
		$name       = $request->get_param( 'name' );
		$address    = $request->get_param( 'address' );
		return $this->forward_request( 'save_vat_details', [ $vat_number, $name, $address ] );
	}
}
