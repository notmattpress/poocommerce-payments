/**
 * Internal dependencies
 */
import {
	getTerms,
	generateCheckoutEventNames,
	getUpeSettings,
	getStripeElementOptions,
	blocksShowLinkButtonHandler,
	getSelectedUPEGatewayPaymentMethod,
	hasPaymentMethodCountryRestrictions,
	isUsingSavedPaymentMethod,
	dispatchChangeEventFor,
	togglePaymentMethodForCountry,
	isBillingInformationMissing,
} from '../upe';

import { getUPEConfig } from 'wcpay/utils/checkout';

jest.mock( 'wcpay/utils/checkout' );

jest.mock( '../../constants', () => {
	return {
		...jest.requireActual( '../../constants' ),
		getPaymentMethodsConstants: jest.fn(),
	};
} );

function buildForm( fields ) {
	const form = document.createElement( 'form' );
	fields.forEach( ( field ) => {
		const input = document.createElement( 'input' );
		input.id = field.id;
		input.value = field.value;
		form.appendChild( input );
	} );
	document.body.appendChild( form );
	return form;
}

describe( 'UPE checkout utils', () => {
	describe( 'isBillingInformationMissing', () => {
		beforeAll( () => {
			window.wc_address_i18n_params = {
				locale: {
					US: {},
					HK: {
						postcode: { required: false },
					},
					default: {
						address_1: { required: true },
						postcode: { required: true },
					},
				},
			};
		} );

		beforeEach( () => {
			const existingCheckoutForm = document.querySelector( 'form' );
			if ( existingCheckoutForm ) {
				existingCheckoutForm.remove();
			}

			getUPEConfig.mockImplementation( ( argument ) => {
				if ( argument === 'enabledBillingFields' ) {
					return {
						billing_first_name: {
							required: true,
						},
						billing_last_name: {
							required: true,
						},
						billing_company: {
							required: false,
						},
						billing_country: {
							required: true,
						},
						billing_address_1: {
							required: true,
						},
						billing_address_2: {
							required: false,
						},
						billing_city: {
							required: true,
						},
						billing_state: {
							required: true,
						},
						billing_postcode: {
							required: true,
						},
						billing_phone: {
							required: true,
						},
						billing_email: {
							required: true,
						},
					};
				}
			} );
		} );

		it( 'should return false when the billing information is not missing', () => {
			buildForm( [
				{ id: 'billing_first_name', value: 'Test' },
				{ id: 'billing_last_name', value: 'User' },
				{ id: 'billing_email', value: 'test@example.com' },
				{ id: 'billing_country', value: 'US' },
				{ id: 'billing_address_1', value: '123 Main St' },
				{ id: 'billing_city', value: 'Anytown' },
				{ id: 'billing_postcode', value: '12345' },
			] );
			expect( isBillingInformationMissing() ).toBe( false );
		} );

		it( 'should return true when the billing information is missing', () => {
			buildForm( [
				{ id: 'billing_first_name', value: 'Test' },
				{ id: 'billing_last_name', value: 'User' },
				{ id: 'billing_email', value: 'test@example.com' },
				{ id: 'billing_country', value: 'US' },
				{ id: 'billing_address_1', value: '123 Main St' },
				{ id: 'billing_city', value: 'Anytown' },
				{ id: 'billing_postcode', value: '' },
			] );
			expect( isBillingInformationMissing() ).toBe( true );
		} );

		it( 'should use the defaults when there is no specific locale data for a country', () => {
			buildForm( [
				{ id: 'billing_first_name', value: 'Test' },
				{ id: 'billing_last_name', value: 'User' },
				{ id: 'billing_email', value: 'test@example.com' },
				{ id: 'billing_country', value: 'MX' },
				{ id: 'billing_address_1', value: '123 Main St' },
				{ id: 'billing_city', value: 'Anytown' },
				{ id: 'billing_postcode', value: '' },
			] );
			expect( isBillingInformationMissing() ).toBe( true );
		} );

		it( 'should return false when the locale data for a country has no required fields', () => {
			buildForm( [
				{ id: 'billing_first_name', value: 'Test' },
				{ id: 'billing_last_name', value: 'User' },
				{ id: 'billing_email', value: 'test@example.com' },
				{ id: 'billing_country', value: 'HK' },
				{ id: 'billing_address_1', value: '123 Main St' },
				{ id: 'billing_city', value: 'Anytown' },
				{ id: 'billing_postcode', value: '' },
			] );
			expect( isBillingInformationMissing() ).toBe( true );
		} );
	} );

	describe( 'getSelectedUPEGatewayPaymentMethod', () => {
		let container;

		beforeEach( () => {
			getUPEConfig.mockImplementation( ( argument ) => {
				if ( argument === 'paymentMethodsConfig' ) {
					return { card: {}, bancontact: {} };
				}

				if ( argument === 'gatewayId' ) {
					return 'poocommerce_payments';
				}
			} );

			// Create container for each test
			container = document.createElement( 'div' );
			document.body.appendChild( container );
		} );

		afterEach( () => {
			// Clean up after each test
			document.body.removeChild( container );
			container = null;
			jest.clearAllMocks();
		} );

		test( 'Selected UPE Payment Method is card', () => {
			container.innerHTML = `<input
				id="payment_method_poocommerce_payments"
				value="poocommerce_payments"
				name="payment_method"
				type="radio"
				class="input-radio"
				checked
			></input>`;
			expect( getSelectedUPEGatewayPaymentMethod() ).toBe( 'card' );
		} );

		test( 'Selected UPE Payment Method is bancontact', () => {
			container.innerHTML = `
				<input
					id="payment_method_poocommerce_payments_bancontact"
					value="poocommerce_payments_bancontact"
					name="payment_method"
					type="radio"
					class="input-radio"
					checked
				></input>
			`;
			expect( getSelectedUPEGatewayPaymentMethod() ).toBe( 'bancontact' );
		} );
	} );

	describe( 'getTerms', () => {
		const paymentMethods = {
			card: {
				isReusable: true,
			},
			bancontact: {
				isReusable: true,
			},
			eps: {
				isReusable: true,
			},
			giropay: {
				isReusable: false,
			},
		};

		const terms = {
			always: {
				card: 'always',
				bancontact: 'always',
				eps: 'always',
			},
			never: {
				card: 'never',
				bancontact: 'never',
				eps: 'never',
			},
		};

		it( 'should only generate a terms parameter for reusable payment methods', () => {
			expect( getTerms( paymentMethods, 'always' ) ).toEqual(
				terms.always
			);
		} );

		it( 'should use a specified value for the terms parameter', () => {
			expect( getTerms( paymentMethods, 'never' ) ).toEqual(
				terms.never
			);
		} );
	} );

	describe( 'hasPaymentMethodCountryRestrictions', () => {
		let container;

		beforeAll( () => {
			container = document.createElement( 'div' );
			container.innerHTML = `
				<ul class="wc_payment_methods payment_methods methods">
					<li class="wc_payment_method payment_method_poocommerce_payments_card" data-payment-method-type="card">
						<input id="payment_method_poocommerce_payments" type="radio" class="input-radio">
					</li>
					<li class="wc_payment_method payment_method_poocommerce_payments_bancontact" data-payment-method-type="bancontact">
						<input id="payment_method_poocommerce_payments_bancontact" type="radio" class="input-radio">
					</li>
				</ul>
			`;
			document.body.appendChild( container );
		} );

		afterAll( () => {
			document.body.removeChild( container );
			container = null;
		} );

		beforeEach( () => {
			jest.clearAllMocks();
			getUPEConfig.mockImplementation( ( argument ) => {
				if ( argument === 'paymentMethodsConfig' ) {
					return {
						card: { countries: [] },
						bancontact: { countries: [ 'BE' ] },
					};
				}
			} );
		} );

		it( 'should be true when the payment method is restricted to the location', () => {
			const bancontactUpeElement = document.querySelector(
				'.payment_method_poocommerce_payments_bancontact'
			);

			expect(
				hasPaymentMethodCountryRestrictions( bancontactUpeElement )
			).toBe( true );
		} );

		it( 'should be false when the payment method is not restricted to the location', () => {
			const cardUpeElement = document.querySelector(
				'.payment_method_poocommerce_payments_card'
			);

			expect(
				hasPaymentMethodCountryRestrictions( cardUpeElement )
			).toBe( false );
		} );
	} );

	describe( 'togglePaymentMethodForCountry', () => {
		let container;

		beforeAll( () => {
			container = document.createElement( 'div' );
			container.innerHTML = `
				<select id="billing_country">
					<option value="US">United States</option>
					<option value="BE">Belgium</option>
				</select>
				<ul class="wc_payment_methods payment_methods methods">
					<li class="wc_payment_method payment_method_poocommerce_payments_card" data-payment-method-type="card">
						<input
							id="payment_method payment_method_poocommerce_payments"
							type="radio"
							class="input-radio"
							name="payment_method"
							value="poocommerce_payments"
						>
						<div class="wcpay-upe-form" data-payment-method-type="card">
							<div class="wcpay-upe-element" data-payment-method-type="card"></div>
						</div>
					</li>
					<li class="wc_payment_method payment_method_poocommerce_payments_bancontact" data-payment-method-type="bancontact">
						<input
							id="payment_method payment_method_poocommerce_payments_bancontact"
							type="radio"
							class="input-radio"
							name="payment_method"
							value="poocommerce_payments_bancontact"
						>
						<div class="wcpay-upe-form" data-payment-method-type="bancontact">
							<div class="wcpay-upe-element" data-payment-method-type="bancontact"></div>
						</div>
					</li>
				</ul>
			`;
			document.body.appendChild( container );
		} );

		afterAll( () => {
			document.body.removeChild( container );
			container = null;
		} );

		beforeEach( () => {
			jest.clearAllMocks();
			getUPEConfig.mockImplementation( ( argument ) => {
				if ( argument === 'paymentMethodsConfig' ) {
					return {
						card: { countries: [ 'US' ] },
						bancontact: { countries: [ 'BE' ] },
					};
				}

				if ( argument === 'gatewayId' ) {
					return 'poocommerce_payments';
				}
			} );
			window.wcpayCustomerData = { billing_country: 'BE' };
		} );

		afterEach( () => {
			window.wcpayCustomerData = null;
		} );

		it( 'should show payment method if country is supported', () => {
			const upeElement = document.querySelector(
				'.payment_method_poocommerce_payments_card'
			);
			document.getElementById( 'billing_country' ).value = 'US';

			togglePaymentMethodForCountry( upeElement );

			expect( upeElement.style.display ).toBe( '' );
		} );

		it( 'should hide payment method if country is not supported', () => {
			const upeElement = document.querySelector(
				'.payment_method_poocommerce_payments_card'
			);
			document.getElementById( 'billing_country' ).value = 'BE';

			togglePaymentMethodForCountry( upeElement );

			expect( upeElement.style.display ).toBe( 'none' );
		} );

		it( 'should fall back to card as the default payment method if the selected payment method is toggled off', () => {
			const input = document.getElementById(
				'payment_method payment_method_poocommerce_payments_bancontact'
			);
			input.setAttribute( 'checked', 'checked' );

			const upeElement = document
				.querySelector(
					`.wcpay-upe-form[data-payment-method-type="bancontact"]`
				)
				.querySelector( '.wcpay-upe-element' );
			const upeContainer = upeElement.closest( '.wc_payment_method' );
			document.getElementById( 'billing_country' ).value = 'US';
			const cardPaymentMethod = document
				.querySelector(
					`.wcpay-upe-form[data-payment-method-type="card"]`
				)
				.closest( '.wc_payment_method' )
				.querySelector(
					`input[name="payment_method"][value="poocommerce_payments"]`
				);

			jest.spyOn( cardPaymentMethod, 'click' );

			togglePaymentMethodForCountry( upeElement );

			expect( upeContainer.style.display ).toBe( 'none' );
			expect( cardPaymentMethod.click ).toHaveBeenCalled();
		} );
	} );

	describe( 'getUPESettings', () => {
		afterEach( () => {
			const checkboxElement = document.getElementById(
				'wc-poocommerce_payments-new-payment-method'
			);
			if ( checkboxElement ) {
				checkboxElement.remove();
			}

			delete window.wcpayCustomerData;
		} );

		it( 'should not provide terms when cart does not contain subscriptions and the saving checkbox is unchecked', () => {
			getUPEConfig.mockImplementation( ( argument ) => {
				if ( argument === 'paymentMethodsConfig' ) {
					return {
						card: {
							label: 'Card',
							isReusable: true,
						},
					};
				}

				if ( argument === 'cartContainsSubscription' ) {
					return false;
				}
			} );

			createCheckboxElementWhich( false );

			const upeSettings = getUpeSettings();

			expect( upeSettings.terms.card ).toEqual( 'never' );
		} );

		it( 'should provide terms when cart does not contain subscriptions but the saving checkbox is checked', () => {
			const container = document.createElement( 'div' );
			container.innerHTML = `
				<div class="wcpay-upe-form" data-payment-method-type="card">
					<div class="wcpay-upe-element" data-payment-method-type="card"></div>
					<input
						type="radio"
						id="wc-poocommerce_payments-new-payment-method"
						name="wc-poocommerce_payments-new-payment-method"
						class="input-radio"
						checked
					>
				</div>
			`;
			document.body.appendChild( container );

			getUPEConfig.mockImplementation( ( argument ) => {
				if ( argument === 'paymentMethodsConfig' ) {
					return {
						card: {
							label: 'Card',
							isReusable: true,
						},
					};
				}

				if ( argument === 'cartContainsSubscription' ) {
					return false;
				}
			} );

			createCheckboxElementWhich( true );

			const upeSettings = getUpeSettings( 'card' );

			expect( upeSettings.terms.card ).toEqual( 'always' );
		} );

		it( 'should provide terms when cart contains subscriptions but the saving checkbox is unchecked', () => {
			getUPEConfig.mockImplementation( ( argument ) => {
				if ( argument === 'paymentMethodsConfig' ) {
					return {
						card: {
							label: 'Card',
							isReusable: true,
						},
					};
				}

				if ( argument === 'cartContainsSubscription' ) {
					return true;
				}
			} );

			createCheckboxElementWhich( false );
			const upeSettings = getUpeSettings();

			expect( upeSettings.terms.card ).toEqual( 'always' );
		} );

		it( 'should define defaultValues when wcpayCustomerData is present', () => {
			window.wcpayCustomerData = {
				name: 'Test Person',
				email: 'test@example.com',
				billing_country: 'US',
			};

			const upeSettings = getUpeSettings();

			expect( upeSettings.defaultValues ).toEqual( {
				billingDetails: {
					name: 'Test Person',
					email: 'test@example.com',
					address: {
						country: 'US',
					},
				},
			} );
		} );

		it( 'should not define defaultValues if wcpayCustomerData is not present', () => {
			window.wcpayCustomerData = null;

			const upeSettings = getUpeSettings();

			expect( upeSettings.defaultValues ).toBeUndefined();
		} );

		function createCheckboxElementWhich( isChecked ) {
			// Create the checkbox element
			const checkboxElement = document.createElement( 'input' );
			checkboxElement.type = 'checkbox';
			checkboxElement.checked = isChecked;
			checkboxElement.id = 'wc-poocommerce_payments-new-payment-method';

			document.body.appendChild( checkboxElement );
		}
	} );

	describe( 'generateCheckoutEventNames', () => {
		it( 'should return empty string when there are no payment methods', () => {
			getUPEConfig.mockImplementation( ( argument ) => {
				if ( argument === 'paymentMethodsConfig' ) {
					return {};
				}
			} );
			const result = generateCheckoutEventNames();

			expect( result ).toEqual( '' );
		} );

		it( 'should generate correct event names when there are payment methods', () => {
			getUPEConfig.mockImplementation( ( argument ) => {
				if ( argument === 'paymentMethodsConfig' ) {
					return {
						test_method_one: {
							gatewayId: 'poocommerce_payments_test_method_one',
						},
						test_method_two: {
							gatewayId: 'poocommerce_payments_test_method_two',
						},
					};
				}
			} );

			const result = generateCheckoutEventNames();

			expect( result ).toEqual(
				'checkout_place_order_poocommerce_payments_test_method_one checkout_place_order_poocommerce_payments_test_method_two'
			);
		} );
	} );
} );

describe( 'getStripeElementOptions', () => {
	test( 'should return options with "always" terms for cart containing subscription', () => {
		const shouldSavePayment = false;
		getUPEConfig.mockImplementation( ( argument ) => {
			if ( argument === 'cartContainsSubscription' ) {
				return true;
			}
		} );
		const paymentMethodsConfig = {
			card: {
				isReusable: true,
			},
			bancontact: {
				isReusable: true,
			},
			eps: {
				isReusable: true,
			},
			giropay: {
				isReusable: false,
			},
		};

		const options = getStripeElementOptions(
			shouldSavePayment,
			paymentMethodsConfig
		);

		expect( options ).toEqual( {
			fields: {
				billingDetails: {
					address: {
						city: 'never',
						country: 'never',
						line1: 'never',
						line2: 'never',
						postalCode: 'never',
						state: 'never',
					},
					email: 'never',
					name: 'never',
					phone: 'never',
				},
			},
			terms: { bancontact: 'always', card: 'always', eps: 'always' },
			wallets: { applePay: 'never', googlePay: 'never', link: 'never' },
		} );
	} );

	test( 'should return options with "always" terms when checkbox to save payment method is checked', () => {
		const shouldSavePayment = true;
		getUPEConfig.mockImplementation( ( argument ) => {
			if ( argument === 'cartContainsSubscription' ) {
				return false;
			}
		} );
		const paymentMethodsConfig = {
			card: {
				isReusable: true,
			},
			bancontact: {
				isReusable: true,
			},
			eps: {
				isReusable: true,
			},
			giropay: {
				isReusable: false,
			},
		};

		const options = getStripeElementOptions(
			shouldSavePayment,
			paymentMethodsConfig
		);

		expect( options ).toEqual( {
			fields: {
				billingDetails: {
					address: {
						city: 'never',
						country: 'never',
						line1: 'never',
						line2: 'never',
						postalCode: 'never',
						state: 'never',
					},
					email: 'never',
					name: 'never',
					phone: 'never',
				},
			},
			terms: { bancontact: 'always', card: 'always', eps: 'always' },
			wallets: { applePay: 'never', googlePay: 'never', link: 'never' },
		} );
	} );

	test( 'should return options with "never" for terms when shouldSavePayment is false and no subscription in cart', () => {
		const shouldSavePayment = false;
		const paymentMethodsConfig = {
			card: {
				isReusable: true,
			},
		};

		getUPEConfig.mockImplementation( ( argument ) => {
			if ( argument === 'cartContainsSubscription' ) {
				return false;
			}
		} );

		const options = getStripeElementOptions(
			shouldSavePayment,
			paymentMethodsConfig
		);

		expect( options ).toEqual( {
			fields: {
				billingDetails: {
					address: {
						city: 'never',
						country: 'never',
						line1: 'never',
						line2: 'never',
						postalCode: 'never',
						state: 'never',
					},
					email: 'never',
					name: 'never',
					phone: 'never',
				},
			},
			terms: { card: 'never' },
			wallets: { applePay: 'never', googlePay: 'never', link: 'never' },
		} );
	} );

	test( 'should return options with link: "auto" when both card and link are available', () => {
		const shouldSavePayment = false;
		const paymentMethodsConfig = {
			card: {
				isReusable: true,
			},
			link: {
				isReusable: false,
			},
		};

		getUPEConfig.mockImplementation( ( argument ) => {
			if ( argument === 'cartContainsSubscription' ) {
				return false;
			}
		} );

		const options = getStripeElementOptions(
			shouldSavePayment,
			paymentMethodsConfig
		);

		expect( options ).toEqual( {
			fields: {
				billingDetails: {
					address: {
						city: 'never',
						country: 'never',
						line1: 'never',
						line2: 'never',
						postalCode: 'never',
						state: 'never',
					},
					email: 'never',
					name: 'never',
					phone: 'never',
				},
			},
			terms: { card: 'never' },
			wallets: { applePay: 'never', googlePay: 'never', link: 'auto' },
		} );
	} );
} );

describe( 'blocksShowLinkButtonHandler', () => {
	let container;
	const autofill = {
		launch: ( props ) => {
			return props.email;
		},
	};

	beforeAll( () => {
		const wcpayPaymentElement = document.createElement( 'div' );
		wcpayPaymentElement.className = 'wcpay-payment-element';

		const form = document.createElement( 'form' );
		form.appendChild( wcpayPaymentElement );

		container = document.createElement( 'div' );
		container.innerHTML = `
			<input id="email" type="email" value="">
			<label for="email">Email address</label>
		`;
		form.appendChild( container );

		document.body.appendChild( form );
	} );

	afterAll( () => {
		document.body.innerHTML = '';
	} );

	beforeEach( () => {
		const emailInput = document.getElementById( 'email' );
		if ( emailInput ) {
			emailInput.value = '';
		}
	} );

	afterEach( () => {
		const stripeLinkButton = document.querySelector(
			'.wcpay-stripelink-modal-trigger'
		);
		if ( stripeLinkButton ) {
			stripeLinkButton.remove();
		}
	} );

	test( 'should hide link button if email input is empty', () => {
		blocksShowLinkButtonHandler( autofill );

		const stripeLinkButton = document.querySelector(
			'.wcpay-stripelink-modal-trigger'
		);
		expect( stripeLinkButton ).toBeDefined();
		expect( stripeLinkButton.style.display ).toEqual( 'none' );
	} );

	test( 'should show link button if email input is present', () => {
		document.getElementById( 'email' ).value = 'admin@example.com';

		blocksShowLinkButtonHandler( autofill );

		const linkButton = container.querySelector(
			'.wcpay-stripelink-modal-trigger'
		);
		expect( linkButton ).not.toBeNull();
		expect( linkButton.style.display ).toBe( 'inline-block' );
	} );
} );

describe( 'isUsingSavedPaymentMethod', () => {
	let container;

	beforeAll( () => {
		container = document.createElement( 'div' );
		container.innerHTML = `
			<div class="wcpay-upe-form" data-payment-method-type="card">
			<label>
				<input type="radio" id="wc-poocommerce_payments-payment-token-new" value="new">
				Use a new payment method
				</label>
			</div>
			<div class="wcpay-upe-form" data-payment-method-type="sepa_debit">
				<label>
					<input type="radio" id="wc-poocommerce_payments_sepa_debit-payment-token-new" value="new">
					Use a new payment method
				</label>
			</div>
		`;
		document.body.appendChild( container );
	} );

	afterAll( () => {
		document.body.removeChild( container );
		container = null;
	} );

	test( 'new CC is selected', () => {
		const input = document.querySelector(
			'#wc-poocommerce_payments-payment-token-new'
		);
		input.checked = true;
		const paymentMethodType = 'card';

		expect( isUsingSavedPaymentMethod( paymentMethodType ) ).toBe( false );
	} );

	test( 'saved CC is selected', () => {
		const input = document.querySelector(
			'#wc-poocommerce_payments-payment-token-new'
		);
		input.checked = false;
		const paymentMethodType = 'card';

		expect( isUsingSavedPaymentMethod( paymentMethodType ) ).toBe( true );
	} );

	test( 'new SEPA is selected', () => {
		const input = document.querySelector(
			'#wc-poocommerce_payments_sepa_debit-payment-token-new'
		);
		input.checked = true;
		const paymentMethodType = 'sepa_debit';

		expect( isUsingSavedPaymentMethod( paymentMethodType ) ).toBe( false );
	} );

	test( 'saved SEPA is selected', () => {
		const input = document.querySelector(
			'#wc-poocommerce_payments_sepa_debit-payment-token-new'
		);
		input.checked = false;
		const paymentMethodType = 'sepa_debit';

		expect( isUsingSavedPaymentMethod( paymentMethodType ) ).toBe( true );
	} );

	test( 'non-tokenized payment gateway is selected', () => {
		const paymentMethodType = 'ideal';

		expect( isUsingSavedPaymentMethod( paymentMethodType ) ).toBe( false );
	} );
} );

describe( 'dispatching change event for element', () => {
	it( 'should dispatch a change event with bubbling', () => {
		const mockElement = document.createElement( 'input' );
		jest.spyOn( mockElement, 'dispatchEvent' );

		dispatchChangeEventFor( mockElement );

		expect( mockElement.dispatchEvent ).toHaveBeenCalledWith(
			expect.objectContaining( {
				type: 'change',
				bubbles: true,
			} )
		);
	} );

	it( 'should throw an error when called with an invalid element', () => {
		expect( () => {
			dispatchChangeEventFor( null );
		} ).toThrow();

		expect( () => {
			dispatchChangeEventFor( undefined );
		} ).toThrow();

		expect( () => {
			dispatchChangeEventFor( {} );
		} ).toThrow();

		expect( () => {
			dispatchChangeEventFor( 'not-an-element' );
		} ).toThrow();
	} );
} );
