/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import ExpressCheckoutOrderApi from '../order-api';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

global.wcpayExpressCheckoutParams = {};
global.wcpayExpressCheckoutParams.nonce = {};
global.wcpayExpressCheckoutParams.nonce.store_api_nonce =
	'global_store_api_nonce';

describe( 'ExpressCheckoutOrderApi', () => {
	afterEach( () => {
		jest.resetAllMocks();
	} );

	it( 'gets order data with the provided arguments', async () => {
		const api = new ExpressCheckoutOrderApi( {
			orderId: '1',
			key: 'key_123',
			billingEmail: 'cheese@toast.com',
		} );

		await api.getCart();
		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				method: 'GET',
				path: expect.stringMatching(
					// I am using a regex to ensure the order of the parameters doesn't matter.
					/(?=.*\/wc\/store\/v1\/order\/1)(?=.*billing_email=cheese%40toast.com)(?=.*key=key_123)/
				),
			} )
		);
	} );

	it( 'places an order', async () => {
		const api = new ExpressCheckoutOrderApi( {
			orderId: '1',
			key: 'key_123',
			billingEmail: 'cheese@toast.com',
		} );

		await api.placeOrder( {
			billing_address: {
				first_name: 'Fake',
			},
			shipping_address: {
				first_name: 'Test',
			},
			anythingElse: 'passedThrough',
		} );
		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				method: 'POST',
				path: '/wc/store/v1/checkout/1',
				headers: expect.objectContaining( {
					Nonce: 'global_store_api_nonce',
				} ),
				data: expect.objectContaining( {
					key: 'key_123',
					billing_email: 'cheese@toast.com',
					billing_address: undefined,
					shipping_address: undefined,
					anythingElse: 'passedThrough',
				} ),
			} )
		);
	} );

	it( 'places an order with the previous API request data', async () => {
		const api = new ExpressCheckoutOrderApi( {
			orderId: '1',
			key: 'key_123',
			billingEmail: 'cheese@toast.com',
		} );

		apiFetch.mockResolvedValueOnce( {
			billing_address: {
				first_name: 'Fake',
				last_name: 'Test',
			},
			shipping_address: {
				first_name: 'Test',
				last_name: 'Fake',
			},
		} );
		await api.getCart();

		await api.placeOrder( {
			billing_address: {
				first_name: 'Fake',
			},
			shipping_address: {
				first_name: 'Test',
			},
			anythingElse: 'passedThrough',
		} );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				method: 'POST',
				path: '/wc/store/v1/checkout/1',
				headers: expect.objectContaining( {
					Nonce: 'global_store_api_nonce',
				} ),
				data: expect.objectContaining( {
					key: 'key_123',
					billing_email: 'cheese@toast.com',
					billing_address: expect.objectContaining( {
						first_name: 'Fake',
						last_name: 'Test',
					} ),
					shipping_address: expect.objectContaining( {
						first_name: 'Test',
						last_name: 'Fake',
					} ),
					anythingElse: 'passedThrough',
				} ),
			} )
		);
	} );
} );
