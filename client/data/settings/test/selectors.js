/**
 * Internal dependencies
 */
import {
	getSettings,
	getIsWCPayEnabled,
	getEnabledPaymentMethodIds,
	getIsManualCaptureEnabled,
	getAccountStatementDescriptor,
	isSavingSettings,
	getPaymentRequestLocations,
	getIsPaymentRequestEnabled,
	getAccountBusinessSupportEmail,
	getAccountBusinessSupportPhone,
	getIsWooPayEnabled,
	getWooPayCustomMessage,
	getWooPayStoreLogo,
	getDuplicatedPaymentMethodIds,
} from '../selectors';

describe( 'Settings selectors tests', () => {
	describe( 'getSettings()', () => {
		test( 'returns the value of state.settings.data', () => {
			const state = {
				settings: {
					data: {
						foo: 'bar',
					},
				},
			};

			expect( getSettings( state ) ).toEqual( { foo: 'bar' } );
		} );

		test.each( [ [ undefined ], [ {} ], [ { settings: {} } ] ] )(
			'returns {} if key is missing (tested state: %j)',
			( state ) => {
				expect( getSettings( state ) ).toEqual( {} );
			}
		);
	} );

	describe( 'getIsWCPayEnabled()', () => {
		test( 'returns the value of state.settings.data.is_wcpay_enabled', () => {
			const state = {
				settings: {
					data: {
						is_wcpay_enabled: true,
					},
				},
			};

			expect( getIsWCPayEnabled( state ) ).toBeTruthy();
		} );

		test.each( [
			[ undefined ],
			[ {} ],
			[ { settings: {} } ],
			[ { settings: { data: {} } } ],
		] )( 'returns false if missing (tested state: %j)', ( state ) => {
			expect( getIsWCPayEnabled( state ) ).toBeFalsy();
		} );
	} );

	describe( 'getEnabledPaymentMethodIds()', () => {
		test( 'returns the value of state.settings.data.enabled_payment_method_ids', () => {
			const state = {
				settings: {
					data: {
						enabled_payment_method_ids: [ 'foo', 'bar' ],
					},
				},
			};

			expect( getEnabledPaymentMethodIds( state ) ).toEqual( [
				'foo',
				'bar',
			] );
		} );

		test.each( [
			[ undefined ],
			[ {} ],
			[ { settings: {} } ],
			[ { settings: { data: {} } } ],
		] )( 'returns [] if missing (tested state: %j)', ( state ) => {
			expect( getEnabledPaymentMethodIds( state ) ).toEqual( [] );
		} );
	} );

	describe( 'isSavingSettings()', () => {
		test( 'returns the value of state.settings.isSaving', () => {
			const state = {
				settings: {
					isSaving: true,
				},
			};

			expect( isSavingSettings( state ) ).toBeTruthy();
		} );

		test.each( [ [ undefined ], [ {} ], [ { settings: {} } ] ] )(
			'returns false if missing (tested state: %j)',
			( state ) => {
				expect( isSavingSettings( state ) ).toBeFalsy();
			}
		);
	} );

	describe( 'getIsManualCaptureEnabled()', () => {
		test( 'returns the value of state.settings.data.is_manual_capture_enabled', () => {
			const state = {
				settings: {
					data: {
						is_manual_capture_enabled: true,
					},
				},
			};

			expect( getIsManualCaptureEnabled( state ) ).toBeTruthy();
		} );

		test.each( [
			[ undefined ],
			[ {} ],
			[ { settings: {} } ],
			[ { settings: { data: {} } } ],
		] )( 'returns false if missing (tested state: %j)', ( state ) => {
			expect( getIsManualCaptureEnabled( state ) ).toBeFalsy();
		} );
	} );

	describe( 'getAccountStatementDescriptor()', () => {
		test( 'returns the value of state.settings.data.account_statement_descriptor', () => {
			const state = {
				settings: {
					data: {
						account_statement_descriptor: 'my account statement',
					},
				},
			};

			expect( getAccountStatementDescriptor( state ) ).toEqual(
				'my account statement'
			);
		} );

		test.each( [
			[ undefined ],
			[ {} ],
			[ { settings: {} } ],
			[ { settings: { data: {} } } ],
		] )( 'returns false if missing (tested state: %j)', ( state ) => {
			expect( getAccountStatementDescriptor( state ) ).toEqual( '' );
		} );
	} );

	describe( 'getIsPaymentRequestEnabled()', () => {
		test( 'returns the value of state.settings.data.is_payment_request_enabled', () => {
			const state = {
				settings: {
					data: {
						is_payment_request_enabled: true,
					},
				},
			};

			expect( getIsPaymentRequestEnabled( state ) ).toBeTruthy();
		} );

		test.each( [
			[ undefined ],
			[ {} ],
			[ { settings: {} } ],
			[ { settings: { data: {} } } ],
		] )( 'returns false if missing (tested state: %j)', ( state ) => {
			expect( getIsPaymentRequestEnabled( state ) ).toBeFalsy();
		} );
	} );

	describe( 'getPaymentRequestLocations()', () => {
		test( 'returns the value of state.settings.data.payment_request_enabled_locations', () => {
			const state = {
				settings: {
					data: {
						payment_request_enabled_locations: [
							'product',
							'cart',
						],
					},
				},
			};

			expect( getPaymentRequestLocations( state ) ).toEqual( [
				'product',
				'cart',
			] );
		} );

		test.each( [
			[ undefined ],
			[ {} ],
			[ { settings: {} } ],
			[ { settings: { data: {} } } ],
		] )( 'returns [] if missing (tested state: %j)', ( state ) => {
			expect( getPaymentRequestLocations( state ) ).toEqual( [] );
		} );
	} );

	describe( 'getIsWooPayEnabled()', () => {
		test( 'returns the value of state.settings.data.is_woopay_enabled', () => {
			const state = {
				settings: {
					data: {
						is_woopay_enabled: true,
					},
				},
			};

			expect( getIsWooPayEnabled( state ) ).toBeTruthy();
		} );

		test.each( [
			[ undefined ],
			[ {} ],
			[ { settings: {} } ],
			[ { settings: { data: {} } } ],
		] )( 'returns false if missing (tested state: %j)', ( state ) => {
			expect( getIsWooPayEnabled( state ) ).toBeFalsy();
		} );
	} );

	describe( 'getWooPayCustomMessage()', () => {
		test( 'returns the value of state.settings.data.woopay_custom_message', () => {
			const state = {
				settings: {
					data: {
						woopay_custom_message: 'test',
					},
				},
			};

			expect( getWooPayCustomMessage( state ) ).toEqual( 'test' );
		} );

		test.each( [
			[ undefined ],
			[ {} ],
			[ { settings: {} } ],
			[ { settings: { data: {} } } ],
		] )( 'returns [] if missing (tested state: %j)', ( state ) => {
			expect( getWooPayCustomMessage( state ) ).toEqual( '' );
		} );
	} );

	describe( 'getWooPayStoreLogo()', () => {
		test( 'returns the value of state.settings.data.woopay_store_logo', () => {
			const state = {
				settings: {
					data: {
						woopay_store_logo: 'test',
					},
				},
			};

			expect( getWooPayStoreLogo( state ) ).toEqual( 'test' );
		} );

		test.each( [
			[ undefined ],
			[ {} ],
			[ { settings: {} } ],
			[ { settings: { data: {} } } ],
		] )( 'returns [] if missing (tested state: %j)', ( state ) => {
			expect( getWooPayStoreLogo( state ) ).toEqual( '' );
		} );
	} );

	describe.each( [
		{
			getFunc: getAccountBusinessSupportEmail,
			setting: 'account_business_support_email',
		},
		{
			getFunc: getAccountBusinessSupportPhone,
			setting: 'account_business_support_phone',
		},
	] )( 'Test get method: %j', ( setting ) => {
		test( 'returns the value of state.settings.data.${setting.setting}', () => {
			const state = {
				settings: {
					data: {
						[ setting.setting ]: setting.setting,
					},
				},
			};

			expect( setting.getFunc( state ) ).toEqual( setting.setting );
		} );

		test.each( [
			[ undefined ],
			[ {} ],
			[ { settings: {} } ],
			[ { settings: { data: {} } } ],
		] )( 'returns false if missing (tested state: %j)', ( state ) => {
			expect( setting.getFunc( state ) ).toEqual( '' );
		} );
	} );

	describe( 'getDuplicatedPaymentMethodIds()', () => {
		test( 'returns the value of state.settings.data.duplicated_payment_method_ids', () => {
			const state = {
				settings: {
					data: {
						duplicated_payment_method_ids: [ 'card', 'bancontact' ],
					},
				},
			};

			expect( getDuplicatedPaymentMethodIds( state ) ).toEqual( [
				'card',
				'bancontact',
			] );
		} );

		test.each( [
			[ undefined ],
			[ {} ],
			[ { settings: {} } ],
			[ { settings: { data: {} } } ],
			[ { settings: { data: { duplicated_payment_method_ids: null } } } ],
		] )(
			'returns {} if missing or undefined (tested state: %j)',
			( state ) => {
				expect( getDuplicatedPaymentMethodIds( state ) ).toEqual( {} );
			}
		);
	} );
} );
