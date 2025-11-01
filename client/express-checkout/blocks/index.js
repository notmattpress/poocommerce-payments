/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PAYMENT_METHOD_NAME_EXPRESS_CHECKOUT_ELEMENT } from 'wcpay/checkout/constants';
import { getConfig } from 'wcpay/utils/checkout';
import ExpressCheckoutContainer from './components/express-checkout-container';
import { checkPaymentMethodIsAvailable } from '../utils/checkPaymentMethodIsAvailable';

export const expressCheckoutElementApplePay = ( api ) => ( {
	paymentMethodId: PAYMENT_METHOD_NAME_EXPRESS_CHECKOUT_ELEMENT,
	name: PAYMENT_METHOD_NAME_EXPRESS_CHECKOUT_ELEMENT + '_applePay',
	title: 'WooPayments - Apple Pay',
	description: __(
		"An easy, secure way to pay that's accepted on millions of stores.",
		'poocommerce-payments'
	),
	gatewayId: 'poocommerce_payments',
	content: (
		<ExpressCheckoutContainer api={ api } expressPaymentMethod="applePay" />
	),
	edit: (
		<ExpressCheckoutContainer
			api={ api }
			expressPaymentMethod="applePay"
			isPreview
		/>
	),
	supports: {
		features: getConfig( 'features' ),
		style: [ 'height', 'borderRadius' ],
	},
	canMakePayment: ( { cart } ) => {
		if ( typeof wcpayExpressCheckoutParams === 'undefined' ) {
			return false;
		}

		return checkPaymentMethodIsAvailable( 'applePay', cart, api );
	},
} );

export const expressCheckoutElementGooglePay = ( api ) => ( {
	paymentMethodId: PAYMENT_METHOD_NAME_EXPRESS_CHECKOUT_ELEMENT,
	name: PAYMENT_METHOD_NAME_EXPRESS_CHECKOUT_ELEMENT + '_googlePay',
	title: 'WooPayments - Google Pay',
	description: __(
		'Simplify checkout with fewer steps to pay.',
		'poocommerce-payments'
	),
	gatewayId: 'poocommerce_payments',
	content: (
		<ExpressCheckoutContainer
			api={ api }
			expressPaymentMethod="googlePay"
		/>
	),
	edit: (
		<ExpressCheckoutContainer
			api={ api }
			expressPaymentMethod="googlePay"
			isPreview
		/>
	),
	supports: {
		features: getConfig( 'features' ),
		style: [ 'height', 'borderRadius' ],
	},
	canMakePayment: ( { cart } ) => {
		if ( typeof wcpayExpressCheckoutParams === 'undefined' ) {
			return false;
		}

		return checkPaymentMethodIsAvailable( 'googlePay', cart, api );
	},
} );
