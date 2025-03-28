/**
 * Internal dependencies
 */
import reducer from '../reducer';
import {
	updateSettings,
	updateIsSavingSettings,
	updateIsManualCaptureEnabled,
	updateAccountStatementDescriptor,
	updatePaymentRequestLocations,
	updateIsPaymentRequestEnabled,
	updateAccountBusinessSupportEmail,
	updateAccountBusinessSupportPhone,
	updateIsWooPayEnabled,
	updateWooPayCustomMessage,
	updateWooPayStoreLogo,
} from '../actions';

describe( 'Settings reducer tests', () => {
	test( 'default state equals expected', () => {
		const defaultState = reducer( undefined, { type: 'foo' } );

		expect( defaultState ).toEqual( {
			isSaving: false,
			data: {},
			savingError: null,
			isDirty: false,
		} );
	} );

	describe( 'SET_SETTINGS', () => {
		test( 'sets the `data` field', () => {
			const settings = {
				foo: 'bar',
			};

			const state = reducer( undefined, updateSettings( settings ) );

			expect( state.data ).toEqual( settings );
		} );

		test( 'overwrites existing settings in the `data` field', () => {
			const oldState = {
				data: {
					foo: 'bar',
				},
			};

			const newSettings = {
				baz: 'quux',
			};

			const state = reducer( oldState, updateSettings( newSettings ) );

			expect( state.data ).toEqual( newSettings );
		} );

		test( 'leaves fields other than `data` unchanged', () => {
			const oldState = {
				isDirty: false,
				foo: 'bar',
				data: {
					baz: 'quux',
				},
				savingError: {},
			};

			const newSettings = {
				quuz: 'corge',
			};

			const state = reducer( oldState, updateSettings( newSettings ) );

			expect( state ).toEqual( {
				isDirty: false,
				foo: 'bar',
				data: {
					quuz: 'corge',
				},
				savingError: {},
			} );
		} );
	} );

	describe( 'SET_IS_SAVING', () => {
		test( 'toggles isSaving', () => {
			const oldState = {
				isSaving: false,
				savingError: null,
			};

			const state = reducer(
				oldState,
				updateIsSavingSettings( true, {} )
			);

			expect( state.isSaving ).toBeTruthy();
			expect( state.savingError ).toEqual( {} );
		} );

		test( 'leaves other fields unchanged', () => {
			const oldState = {
				isDirty: false,
				foo: 'bar',
				isSaving: false,
				savingError: {},
			};

			const state = reducer(
				oldState,
				updateIsSavingSettings( true, null )
			);

			expect( state ).toEqual( {
				isDirty: false,
				foo: 'bar',
				savingError: null,
				isSaving: true,
			} );
		} );
	} );

	describe( 'SET_IS_MANUAL_CAPTURE_ENABLED', () => {
		test( 'toggles `data.is_manual_capture_enabled`', () => {
			const oldState = {
				data: {
					is_manual_capture_enabled: false,
				},
			};

			const state = reducer(
				oldState,
				updateIsManualCaptureEnabled( true )
			);

			expect( state.data.is_manual_capture_enabled ).toBeTruthy();
		} );

		test( 'leaves other fields unchanged', () => {
			const oldState = {
				isDirty: false,
				foo: 'bar',
				data: {
					is_manual_capture_enabled: false,
					baz: 'quux',
				},
				savingError: {},
			};

			const state = reducer(
				oldState,
				updateIsManualCaptureEnabled( true )
			);

			expect( state ).toEqual( {
				isDirty: true,
				savingError: null,
				foo: 'bar',
				data: {
					is_manual_capture_enabled: true,
					baz: 'quux',
				},
			} );
		} );
	} );

	describe( 'SET_ACCOUNT_STATEMENT_DESCRIPTOR', () => {
		test( 'toggles `data.account_statement_descriptor`', () => {
			const oldState = {
				data: {
					account_statement_descriptor: 'Statement',
				},
			};

			const state = reducer(
				oldState,
				updateAccountStatementDescriptor( 'New Statement' )
			);

			expect( state.data.account_statement_descriptor ).toEqual(
				'New Statement'
			);
		} );

		test( 'leaves other fields unchanged', () => {
			const oldState = {
				isDirty: false,
				foo: 'bar',
				data: {
					account_statement_descriptor: 'Statement',
					baz: 'quux',
				},
				savingError: {},
			};

			const state = reducer(
				oldState,
				updateAccountStatementDescriptor( 'New Statement' )
			);

			expect( state ).toEqual( {
				isDirty: true,
				foo: 'bar',
				savingError: null,
				data: {
					account_statement_descriptor: 'New Statement',
					baz: 'quux',
				},
			} );
		} );
	} );

	describe( 'SET_IS_PAYMENT_REQUEST_ENABLED', () => {
		test( 'toggles `data.is_payment_request_enabled`', () => {
			const oldState = {
				data: {
					is_payment_request_enabled: false,
				},
				savingError: null,
			};

			const state = reducer(
				oldState,
				updateIsPaymentRequestEnabled( true )
			);

			expect( state.data.is_payment_request_enabled ).toBeTruthy();
		} );

		test( 'leaves other fields unchanged', () => {
			const oldState = {
				isDirty: false,
				foo: 'bar',
				data: {
					is_payment_request_enabled: false,
					baz: 'quux',
				},
				savingError: {},
			};

			const state = reducer(
				oldState,
				updateIsPaymentRequestEnabled( true )
			);

			expect( state ).toEqual( {
				isDirty: true,
				foo: 'bar',
				savingError: null,
				data: {
					is_payment_request_enabled: true,
					baz: 'quux',
				},
			} );
		} );
	} );

	describe( 'SET_PAYMENT_REQUEST_LOCATIONS', () => {
		const initPaymentRequestState = [ 'product' ];
		const enableAllpaymentRequestState = [ 'product', 'checkout', 'cart' ];

		test( 'toggle `data.payment_request_enabled_locations`', () => {
			const oldState = {
				data: {
					payment_request_enabled_locations: initPaymentRequestState,
				},
			};

			const state = reducer(
				oldState,
				updatePaymentRequestLocations( enableAllpaymentRequestState )
			);

			expect( state.data.payment_request_enabled_locations ).toEqual(
				enableAllpaymentRequestState
			);
		} );

		test( 'leaves other fields unchanged', () => {
			const oldState = {
				isDirty: false,
				foo: 'bar',
				data: {
					payment_request_enabled_locations: initPaymentRequestState,
					baz: 'quux',
				},
				savingError: {},
			};

			const state = reducer(
				oldState,
				updatePaymentRequestLocations( enableAllpaymentRequestState )
			);

			expect( state ).toEqual( {
				isDirty: true,
				foo: 'bar',
				data: {
					payment_request_enabled_locations: enableAllpaymentRequestState,
					baz: 'quux',
				},
				savingError: null,
			} );
		} );
	} );

	describe( 'SET_MERCHANT_SETTINGS', () => {
		const merchantSettings = [
			{
				updateFunc: updateAccountBusinessSupportEmail,
				stateKey: 'account_business_support_email',
				settingValue: 'Business email',
			},
			{
				updateFunc: updateAccountBusinessSupportPhone,
				stateKey: 'account_business_support_phone',
				settingValue: 'Business phone',
			},
		];

		test.each( merchantSettings )( 'toggles `%j`', ( setting ) => {
			const oldState = {
				data: {
					[ setting.stateKey ]: setting.settingValue,
				},
			};

			const state = reducer(
				oldState,
				setting.updateFunc( 'New ${setting.settingValue}' )
			);

			expect( state.data[ setting.stateKey ] ).toEqual(
				'New ${setting.settingValue}'
			);
		} );

		test.each( merchantSettings )(
			'leaves other fields unchanged `%j`',
			( setting ) => {
				const oldState = {
					isDirty: false,
					foo: 'bar',
					data: {
						[ setting.stateKey ]: setting.settingValue,
						baz: 'quux',
					},
					savingError: {},
				};

				const state = reducer(
					oldState,
					setting.updateFunc( 'New ${setting.settingValue}' )
				);

				expect( state ).toEqual( {
					isDirty: true,
					foo: 'bar',
					savingError: null,
					data: {
						[ setting.stateKey ]: 'New ${setting.settingValue}',
						baz: 'quux',
					},
				} );
			}
		);
	} );

	describe( 'SET_IS_WOOPAY_ENABLED', () => {
		test( 'toggles `data.is_woopay_enabled`', () => {
			const oldState = {
				isDirty: true,
				data: {
					is_woopay_enabled: false,
				},
				savingError: null,
			};

			const state = reducer( oldState, updateIsWooPayEnabled( true ) );

			expect( state.data.is_woopay_enabled ).toBeTruthy();
		} );

		test( 'leaves other fields unchanged', () => {
			const oldState = {
				isDirty: false,
				foo: 'bar',
				data: {
					is_woopay_enabled: false,
					baz: 'quux',
				},
				savingError: {},
			};

			const state = reducer( oldState, updateIsWooPayEnabled( true ) );

			expect( state ).toEqual( {
				isDirty: true,
				foo: 'bar',
				savingError: null,
				data: {
					is_woopay_enabled: true,
					baz: 'quux',
				},
			} );
		} );
	} );

	describe( 'SET_WOOPAY_CUSTOM_MESSAGE', () => {
		test( 'toggle `data.woopay_custom_message`', () => {
			const oldState = {
				data: {
					woopay_custom_message: '',
				},
			};

			const state = reducer(
				oldState,
				updateWooPayCustomMessage( 'test' )
			);

			expect( state.data.woopay_custom_message ).toEqual( 'test' );
		} );

		test( 'leaves other fields unchanged', () => {
			const oldState = {
				isDirty: false,
				foo: 'bar',
				data: {
					woopay_custom_message: '',
					baz: 'quux',
				},
				savingError: {},
			};

			const state = reducer(
				oldState,
				updateWooPayCustomMessage( 'test' )
			);

			expect( state ).toEqual( {
				isDirty: true,
				foo: 'bar',
				data: {
					woopay_custom_message: 'test',
					baz: 'quux',
				},
				savingError: null,
			} );
		} );
	} );

	describe( 'SET_WOOPAY_STORE_LOGO', () => {
		test( 'toggle `data.woopay_store_logo`', () => {
			const oldState = {
				data: {
					woopay_store_logo: '',
				},
			};

			const state = reducer( oldState, updateWooPayStoreLogo( 'test' ) );

			expect( state.data.woopay_store_logo ).toEqual( 'test' );
		} );

		test( 'leaves other fields unchanged', () => {
			const oldState = {
				isDirty: false,
				foo: 'bar',
				data: {
					woopay_store_logo: '',
					baz: 'quux',
				},
				savingError: {},
			};

			const state = reducer( oldState, updateWooPayStoreLogo( 'test' ) );

			expect( state ).toEqual( {
				isDirty: true,
				foo: 'bar',
				data: {
					woopay_store_logo: 'test',
					baz: 'quux',
				},
				savingError: null,
			} );
		} );
	} );
} );
