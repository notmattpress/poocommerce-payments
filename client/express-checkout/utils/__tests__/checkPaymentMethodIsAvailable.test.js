/**
 * External dependencies
 */
import React from 'react';
import { Elements, ExpressCheckoutElement } from '@stripe/react-stripe-js';

/**
 * Internal dependencies
 */
import { checkPaymentMethodIsAvailable } from '../checkPaymentMethodIsAvailable';

jest.mock( '@stripe/react-stripe-js', () => ( {
	Elements: jest.fn().mockReturnValue( null ),
	ExpressCheckoutElement: jest.fn().mockReturnValue( null ),
} ) );

describe( 'checkPaymentMethodIsAvailable', () => {
	let mockApi;
	let onReadySpy;

	beforeEach( () => {
		jest.useFakeTimers();
		mockApi = {
			loadStripeForExpressCheckout: jest.fn().mockResolvedValue( {} ),
		};
		onReadySpy = jest.fn();

		Elements.mockImplementation( ( { children } ) => (
			<div data-testid="stripe-elements">{ children }</div>
		) );
		ExpressCheckoutElement.mockImplementation( ( { onReady, options } ) => {
			// simulating a brief delay
			React.useEffect( () => {
				setTimeout( () => {
					const paymentMethods = options?.paymentMethods || {};
					const availablePaymentMethods = {};

					// Set availability based on 'always' configuration
					Object.keys( paymentMethods ).forEach( ( method ) => {
						availablePaymentMethods[ method ] =
							paymentMethods[ method ] === 'always';
					} );

					onReadySpy();
					onReady( { availablePaymentMethods } );
				}, 10 );
			}, [ onReady, options ] );

			return <div data-testid="express-checkout-element" />;
		} );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	const createCart = ( totalPrice, currencyCode ) => ( {
		cartTotals: {
			total_price: totalPrice,
			currency_code: currencyCode,
		},
	} );

	it( 'should return the same result for subsequent calls with identical cart contents', async () => {
		// the two cart objects are two different objects, but they have the same contents.
		const result1Promise = checkPaymentMethodIsAvailable(
			'applePay',
			createCart( '100.00', 'USD' ),
			mockApi
		);

		// advancing the timers to trigger the `setTimeout`.
		jest.runAllTimers();
		const result1 = await result1Promise;

		const result2Promise = checkPaymentMethodIsAvailable(
			'applePay',
			createCart( '100.00', 'USD' ),
			mockApi
		);

		// advancing the timers again.
		jest.runAllTimers();
		const result2 = await result2Promise;

		expect( result1 ).toBe( true );
		expect( result2 ).toBe( true );

		// onReady should only be called once due to memoization
		expect( onReadySpy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should handle different cart contents correctly', async () => {
		// Clear the spy to start fresh for this test
		onReadySpy.mockClear();

		// the two cart objects are two different objects with different contents
		const result1Promise = checkPaymentMethodIsAvailable(
			'applePay',
			createCart( '150.00', 'USD' ),
			mockApi
		);
		jest.runAllTimers();
		const result1 = await result1Promise;

		const result2Promise = checkPaymentMethodIsAvailable(
			'applePay',
			createCart( '250.00', 'USD' ),
			mockApi
		);
		jest.runAllTimers();
		const result2 = await result2Promise;

		expect( result1 ).toBe( true );
		expect( result2 ).toBe( true );

		// onReady should be called twice for different cart contents (different cache keys)
		expect( onReadySpy ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should return results for different payment methods', async () => {
		// Clear the spy to start fresh for this test
		onReadySpy.mockClear();

		const cart = createCart( '80.00', 'EUR' );

		const applePayPromise = checkPaymentMethodIsAvailable(
			'applePay',
			cart,
			mockApi
		);
		jest.runAllTimers();
		const applePayResult = await applePayPromise;

		const googlePayPromise = checkPaymentMethodIsAvailable(
			'googlePay',
			cart,
			mockApi
		);
		jest.runAllTimers();
		const googlePayResult = await googlePayPromise;

		expect( applePayResult ).toBe( true );
		expect( googlePayResult ).toBe( true );

		// onReady should be called twice for different payment methods (separate caches)
		expect( onReadySpy ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should handle cases where payment method is not available', async () => {
		ExpressCheckoutElement.mockImplementation( ( { onReady } ) => {
			React.useEffect( () => {
				setTimeout( () => {
					// returning no methods
					onReady( {} );
				}, 10 );
			}, [ onReady ] );

			return <div data-testid="express-checkout-element" />;
		} );

		const resultPromise = checkPaymentMethodIsAvailable(
			'applePay',
			createCart( '300.00', 'AUD' ),
			mockApi
		);
		jest.runAllTimers();
		const result = await resultPromise;

		expect( result ).toBe( false );
	} );
} );
