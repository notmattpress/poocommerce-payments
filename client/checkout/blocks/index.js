/**
 * External dependencies
 */
// Handled as an external dependency: see '/webpack.config.js:83'
import {
	registerPaymentMethod,
	registerExpressPaymentMethod,
	// eslint-disable-next-line import/no-unresolved
} from '@poocommerce/blocks-registry';

/**
 * Internal dependencies
 */
import { getUPEConfig, getConfig } from 'utils/checkout';
import { isLinkEnabled } from '../utils/upe';
import WCPayAPI from '../api';
import { SavedTokenHandler } from './saved-token-handler';
import PaymentMethodLabel from './payment-method-label';
import request from '../utils/request';
import enqueueFraudScripts from 'fraud-scripts';
import {
	expressCheckoutElementApplePay,
	expressCheckoutElementGooglePay,
} from '../../express-checkout/blocks';
import {
	tokenizedExpressCheckoutElementApplePay,
	tokenizedExpressCheckoutElementGooglePay,
} from 'wcpay/tokenized-express-checkout/blocks';

import {
	PAYMENT_METHOD_NAME_CARD,
	PAYMENT_METHOD_NAME_ALIPAY,
	PAYMENT_METHOD_NAME_BANCONTACT,
	PAYMENT_METHOD_NAME_BECS,
	PAYMENT_METHOD_NAME_EPS,
	PAYMENT_METHOD_NAME_GIROPAY,
	PAYMENT_METHOD_NAME_IDEAL,
	PAYMENT_METHOD_NAME_P24,
	PAYMENT_METHOD_NAME_SEPA,
	PAYMENT_METHOD_NAME_SOFORT,
	PAYMENT_METHOD_NAME_AFFIRM,
	PAYMENT_METHOD_NAME_AFTERPAY,
	PAYMENT_METHOD_NAME_KLARNA,
	PAYMENT_METHOD_NAME_MULTIBANCO,
	PAYMENT_METHOD_NAME_GRABPAY,
	PAYMENT_METHOD_NAME_WECHAT_PAY,
} from '../constants.js';
import { getDeferredIntentCreationUPEFields } from './payment-elements';
import { handleWooPayEmailInput } from '../woopay/email-input-iframe';
import { recordUserEvent } from 'tracks';
import wooPayExpressCheckoutPaymentMethod from '../woopay/express-button/woopay-express-checkout-payment-method';
import { isPreviewing } from '../preview';
import '../utils/copy-test-number';

const upeMethods = {
	card: PAYMENT_METHOD_NAME_CARD,
	alipay: PAYMENT_METHOD_NAME_ALIPAY,
	bancontact: PAYMENT_METHOD_NAME_BANCONTACT,
	au_becs_debit: PAYMENT_METHOD_NAME_BECS,
	eps: PAYMENT_METHOD_NAME_EPS,
	giropay: PAYMENT_METHOD_NAME_GIROPAY,
	ideal: PAYMENT_METHOD_NAME_IDEAL,
	p24: PAYMENT_METHOD_NAME_P24,
	sepa_debit: PAYMENT_METHOD_NAME_SEPA,
	sofort: PAYMENT_METHOD_NAME_SOFORT,
	affirm: PAYMENT_METHOD_NAME_AFFIRM,
	afterpay_clearpay: PAYMENT_METHOD_NAME_AFTERPAY,
	klarna: PAYMENT_METHOD_NAME_KLARNA,
	multibanco: PAYMENT_METHOD_NAME_MULTIBANCO,
	grabpay: PAYMENT_METHOD_NAME_GRABPAY,
	wechat_pay: PAYMENT_METHOD_NAME_WECHAT_PAY,
};

const enabledPaymentMethodsConfig = getUPEConfig( 'paymentMethodsConfig' );
const isStripeLinkEnabled = isLinkEnabled( enabledPaymentMethodsConfig );

// Create an API object, which will be used throughout the checkout.
const api = new WCPayAPI(
	{
		publishableKey: getUPEConfig( 'publishableKey' ),
		accountId: getUPEConfig( 'accountId' ),
		forceNetworkSavedCards: getUPEConfig( 'forceNetworkSavedCards' ),
		locale: getUPEConfig( 'locale' ),
		isStripeLinkEnabled,
	},
	request
);

Object.entries( enabledPaymentMethodsConfig )
	.filter( ( [ upeName ] ) => upeName !== 'link' )
	.forEach( ( [ upeName, upeConfig ] ) => {
		registerPaymentMethod( {
			name: upeMethods[ upeName ],
			content: getDeferredIntentCreationUPEFields(
				upeName,
				upeMethods,
				api,
				upeConfig.testingInstructions
			),
			edit: getDeferredIntentCreationUPEFields(
				upeName,
				upeMethods,
				api,
				upeConfig.testingInstructions
			),
			savedTokenComponent: <SavedTokenHandler api={ api } />,
			canMakePayment: ( cartData ) => {
				const billingCountry = cartData.billingAddress.country;
				const needsPayment = cartData.cart.cartNeedsPayment;
				const isRestrictedInAnyCountry = !! upeConfig.countries.length;
				const isAvailableInTheCountry =
					! isRestrictedInAnyCountry ||
					upeConfig.countries.includes( billingCountry );
				// We used to check if stripe was loaded with `getStripeForUPE`, but we can't guarantee it will be loaded synchronously.
				return needsPayment && isAvailableInTheCountry;
			},
			paymentMethodId: upeMethods[ upeName ],
			// see .wc-block-checkout__payment-method styles in blocks/style.scss
			label: (
				<PaymentMethodLabel
					api={ api }
					title={ upeConfig.title }
					countries={ upeConfig.countries }
					iconLight={ upeConfig.icon }
					iconDark={ upeConfig.darkIcon }
					upeName={ upeName }
				/>
			),
			ariaLabel: 'WooPayments',
			supports: {
				showSavedCards: getUPEConfig( 'isSavedCardsEnabled' ) ?? false,
				showSaveOption: upeConfig.showSaveOption ?? false,
				features: getUPEConfig( 'features' ),
			},
		} );
	} );

const addCheckoutTracking = () => {
	const placeOrderButton = document.getElementsByClassName(
		'wc-block-components-checkout-place-order-button'
	);
	if ( placeOrderButton.length ) {
		placeOrderButton[ 0 ].addEventListener( 'click', () => {
			const blocksCheckbox = document.getElementById(
				'radio-control-wc-payment-method-options-poocommerce_payments'
			);
			if ( ! blocksCheckbox?.checked ) {
				return;
			}

			recordUserEvent( 'checkout_place_order_button_click' );
		} );
	}
};

// Call handleWooPayEmailInput if woopay is enabled and this is the checkout page.
if ( getUPEConfig( 'isWooPayEnabled' ) ) {
	if (
		document.querySelector( '[data-block-name="poocommerce/checkout"]' ) &&
		getUPEConfig( 'isWooPayEmailInputEnabled' ) &&
		! isPreviewing()
	) {
		handleWooPayEmailInput( '#email', api, true );
	}

	if ( getUPEConfig( 'shouldShowWooPayButton' ) ) {
		registerExpressPaymentMethod( wooPayExpressCheckoutPaymentMethod() );
	}
}

if ( getUPEConfig( 'isPaymentRequestEnabled' ) ) {
	if ( getUPEConfig( 'isTokenizedCartEceEnabled' ) ) {
		registerExpressPaymentMethod(
			tokenizedExpressCheckoutElementApplePay( api )
		);
		registerExpressPaymentMethod(
			tokenizedExpressCheckoutElementGooglePay( api )
		);
	} else {
		registerExpressPaymentMethod( expressCheckoutElementApplePay( api ) );
		registerExpressPaymentMethod( expressCheckoutElementGooglePay( api ) );
	}
}
window.addEventListener( 'load', () => {
	enqueueFraudScripts( getUPEConfig( 'fraudServices' ) );
	addCheckoutTracking();
} );

// If multi-currency is enabled, add currency code to total amount in cart and checkout blocks.
if ( getConfig( 'isMultiCurrencyEnabled' ) ) {
	const { registerCheckoutFilters } = window.wc.blocksCheckout;

	const modifyTotalsPrice = ( defaultValue, extensions, args ) => {
		const { cart } = args;

		if ( cart?.cartTotals?.currency_code ) {
			return `<price/> ${ cart.cartTotals.currency_code }`;
		}

		return defaultValue;
	};

	registerCheckoutFilters( 'poocommerce-payments', {
		totalValue: modifyTotalsPrice,
	} );
}
