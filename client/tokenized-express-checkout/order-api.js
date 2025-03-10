/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { getExpressCheckoutData } from './utils';

export default class ExpressCheckoutOrderApi {
	// parameters used in every request, just in different ways.
	orderId;
	key;
	billingEmail = '';

	// needed to replay the cart data to the `placeOrder` endpoint when placing the order.
	cachedCartData = {};

	/**
	 * Creates an instance of class to query for order data.
	 *
	 * @param {string} orderId The order ID,
	 * @param {string} key The order key, used to verify the order ID.
	 * @param {string?} billingEmail The billing email address, used for guest orders.
	 */
	constructor( { orderId, key, billingEmail = '' } ) {
		this.orderId = orderId;
		this.key = key;
		this.billingEmail = billingEmail;
	}

	/**
	 * Creates an order from the cart object.
	 * See https://github.com/poocommerce/poocommerce/blob/trunk/plugins/poocommerce/src/StoreApi/docs/checkout-order.md
	 *
	 * @param {{
	 *          billing_address: Object,
	 *          shipping_address: Object,
	 *          payment_method: string,
	 *          payment_data: Array,
	 *        }} paymentData Additional payment data to place the order.
	 * @return {Promise} Result of the order creation request.
	 */
	async placeOrder( paymentData ) {
		return await apiFetch( {
			method: 'POST',
			path: `/wc/store/v1/checkout/${ this.orderId }`,
			headers: {
				Nonce: getExpressCheckoutData( 'nonce' ).store_api_nonce,
			},
			data: {
				...paymentData,
				key: this.key,
				billing_email: this.billingEmail,
				// preventing billing and shipping address from being overwritten in the request to the store - we don't want to update them
				billing_address: this.cachedCartData.billing_address,
				shipping_address: this.cachedCartData.shipping_address,
			},
		} );
	}

	/**
	 * Returns the customer's order object.
	 * See https://github.com/poocommerce/poocommerce/blob/trunk/plugins/poocommerce/src/StoreApi/docs/order.md
	 *
	 * @return {Promise} Cart response object.
	 */
	async getCart() {
		return ( this.cachedCartData = await apiFetch( {
			method: 'GET',
			path: addQueryArgs( `/wc/store/v1/order/${ this.orderId }`, {
				key: this.key,
				billing_email: this.billingEmail,
			} ),
		} ) );
	}
}
