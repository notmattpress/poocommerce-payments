/** @format */

/**
 * External dependencies
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import user from '@testing-library/user-event';
import { getQuery, updateQueryString } from '@poocommerce/navigation';
import { useUserPreferences } from '@poocommerce/data';

/**
 * Internal dependencies
 */
import Authorizations, { AuthorizationsList } from '..';
import { useAuthorizations, useAuthorizationsSummary } from 'data/index';
import { Authorization } from 'wcpay/types/authorizations';

// Workaround for mocking @wordpress/data.
// See https://github.com/WordPress/gutenberg/issues/15031
jest.mock( '@wordpress/data', () => ( {
	createRegistryControl: jest.fn(),
	dispatch: jest.fn( () => ( {
		setIsMatching: jest.fn(),
		onLoad: jest.fn(),
	} ) ),
	registerStore: jest.fn(),
	select: jest.fn(),
	useDispatch: jest.fn( () => ( { createNotice: jest.fn() } ) ),
	withDispatch: jest.fn( () => jest.fn() ),
	withSelect: jest.fn( () => jest.fn() ),
} ) );

jest.mock( 'data/index', () => ( {
	useAuthorizations: jest.fn(),
	useAuthorizationsSummary: jest.fn(),
	useAuthorization: jest.fn( () => ( {
		doCaptureAuthorization: jest.fn(),
	} ) ),
} ) );

jest.mock( '@poocommerce/data', () => {
	const actualModule = jest.requireActual( '@poocommerce/data' );

	return {
		...actualModule,
		useUserPreferences: jest.fn(),
	};
} );

const mockUseAuthorizations = useAuthorizations as jest.MockedFunction<
	typeof useAuthorizations
>;

const mockUseAuthorizationsSummary = useAuthorizationsSummary as jest.MockedFunction<
	typeof useAuthorizationsSummary
>;

const mockUseUserPreferences = useUserPreferences as jest.MockedFunction<
	typeof useUserPreferences
>;

declare const global: {
	wcpaySettings: {
		isSubscriptionsActive: boolean;
		featureFlags: {
			customSearch: boolean;
		};
		zeroDecimalCurrencies: string[];
		currentUserEmail: string;
		connect: {
			country: string;
		};
		currencyData: {
			[ key: string ]: {
				code: string;
				symbol: string;
				symbolPosition: string;
				thousandSeparator: string;
				decimalSeparator: string;
				precision: number;
			};
		};
		dateFormat: string;
		timeFormat: string;
	};
};

const getMockAuthorizations: () => Authorization[] = () => [
	{
		created: '2020-01-02 17:46:02',
		captured: false,
		order_id: 24,
		risk_level: 2,
		amount: 1455,
		customer_email: 'good_boy@doge.com',
		customer_country: 'Kingdom of Dogs',
		customer_name: 'Good boy',
		payment_intent_id: 'pi_4242',
		charge_id: 'ch_mock',
		currency: 'usd',
	},
	{
		created: '2020-01-03 17:46:02',
		captured: false,
		order_id: 25,
		risk_level: 0,
		amount: 2010,
		customer_email: 'good_boy@doge.com',
		customer_country: 'Kingdom of Dogs',
		customer_name: 'Good boy',
		payment_intent_id: 'pi_4243',
		charge_id: 'ch_mock',
		currency: 'usd',
	},
];

describe( 'Authorizations list', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		// the query string is preserved across tests, so we need to reset it
		updateQueryString( {}, '/', {} );

		mockUseUserPreferences.mockReturnValue( {
			updateUserPreferences: jest.fn(),
			wc_payments_transactions_uncaptured_hidden_columns: '',
			isRequesting: false,
		} as any );

		global.wcpaySettings = {
			featureFlags: {
				customSearch: true,
			},
			isSubscriptionsActive: false,
			zeroDecimalCurrencies: [],
			currentUserEmail: 'mock@example.com',
			connect: {
				country: 'US',
			},
			currencyData: {
				US: {
					code: 'USD',
					symbol: '$',
					symbolPosition: 'left',
					thousandSeparator: ',',
					decimalSeparator: '.',
					precision: 2,
				},
			},
			dateFormat: 'M j, Y',
			timeFormat: 'g:iA',
		};
	} );

	test( 'renders correctly', () => {
		mockUseAuthorizations.mockReturnValue( {
			authorizations: getMockAuthorizations(),
			authorizationsError: undefined,
			isLoading: false,
		} );

		mockUseAuthorizationsSummary.mockReturnValue( {
			authorizationsSummary: {
				count: 3,
				currency: 'usd',
				all_currencies: [ 'usd' ],
				total: 300,
			},
			isLoading: false,
		} );

		const { container } = render( <AuthorizationsList /> );
		expect( container ).toMatchSnapshot();
	} );

	describe( 'filters', () => {
		let container: Element;
		let rerender: ( ui: React.ReactElement ) => void;
		beforeEach( () => {
			mockUseAuthorizations.mockReturnValue( {
				authorizations: getMockAuthorizations(),
				isLoading: false,
				authorizationsError: undefined,
			} );

			mockUseAuthorizationsSummary.mockReturnValue( {
				authorizationsSummary: {
					count: 3,
					currency: 'usd',
					all_currencies: [ 'usd' ],
					total: 300,
				},
				isLoading: false,
			} );

			( { container, rerender } = render( <Authorizations /> ) );
		} );

		function expectSortingToBe( field: string, direction: string ) {
			expect( getQuery().orderby ).toEqual( field );
			expect( getQuery().order ).toEqual( direction );
			const useTransactionsCall =
				mockUseAuthorizations.mock.calls[
					mockUseAuthorizations.mock.calls.length - 1
				];
			expect( useTransactionsCall[ 0 ].orderby ).toEqual( field );
			expect( useTransactionsCall[ 0 ].order ).toEqual( direction );
		}

		function sortBy( field: string ) {
			user.click( screen.getByRole( 'button', { name: field } ) );
			rerender( <Authorizations /> );
		}

		test( 'sorts by authorized on field', () => {
			sortBy( 'Authorized on' );
			expectSortingToBe( 'created', 'desc' );

			sortBy( 'Authorized on' );
			expectSortingToBe( 'created', 'asc' );
		} );

		test( 'sorts by capture by field', () => {
			sortBy( 'Capture by' );
			expectSortingToBe( 'capture_by', 'desc' );

			sortBy( 'Capture by' );
			expectSortingToBe( 'capture_by', 'asc' );
		} );

		test( 'renders table summary only when the authorization summary data is available', () => {
			mockUseAuthorizationsSummary.mockReturnValue( {
				authorizationsSummary: {},
				isLoading: true,
			} );

			( { container } = render( <Authorizations /> ) );
			let tableSummaryIsLoading = container.querySelector(
				'.poocommerce-table__summary.is-loading'
			);
			expect( tableSummaryIsLoading ).toBeInTheDocument();

			mockUseAuthorizationsSummary.mockReturnValue( {
				authorizationsSummary: {
					count: 3,
					currency: 'usd',
					all_currencies: [ 'usd' ],
					total: 300,
				},
				isLoading: false,
			} );

			( { container } = render( <Authorizations /> ) );
			tableSummaryIsLoading = container.querySelector(
				'.poocommerce-table__summary.is-loading'
			);
			expect( tableSummaryIsLoading ).not.toBeInTheDocument();
			const tableSummary = container.querySelectorAll(
				'.poocommerce-table__summary'
			);

			expect( tableSummary ).toHaveLength( 1 );
		} );
	} );
} );
