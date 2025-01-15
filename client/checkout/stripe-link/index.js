/**
 * Internal dependencies
 */
import { dispatchChangeEventFor } from '../utils/upe';

export const switchToNewPaymentTokenElement = () => {
	// Switch to card payment method before enabling new payment token element
	document
		.querySelector(
			'input[name="payment_method"][value="poocommerce_payments"]'
		)
		?.click();

	const newPaymentTokenElement = document.getElementById(
		'wc-poocommerce_payments-payment-token-new'
	);
	if ( newPaymentTokenElement && ! newPaymentTokenElement.checked ) {
		newPaymentTokenElement.checked = true;
		dispatchChangeEventFor( newPaymentTokenElement );
	}
};

export const removeLinkButton = () => {
	const stripeLinkButton = document.querySelector(
		'.wcpay-stripelink-modal-trigger'
	);
	if ( stripeLinkButton ) {
		stripeLinkButton.remove();
	}
};

const transformStripeLinkAddress = ( address ) => {
	// when clicking "use another address" or "use another payment method", the returned value for shipping/billing might be `null`.
	if ( ! address ) return null;

	const [ firstName, lastName ] = address.name.split( / (.*)/s, 2 );
	return {
		first_name: firstName || '',
		last_name: lastName || '',
		address_1: address.address.line1 || '',
		address_2: address.address.line2 || '',
		city: address.address.city || '',
		country: address.address.country || '',
		postcode: address.address.postal_code || '',
		state: address.address.state || '',
		// missing fields from Stripe autofill: phone, company
	};
};

const enableStripeLinkPaymentMethod = async ( options ) => {
	const emailField = document.getElementById( options.emailId );

	if ( ! emailField ) {
		return Promise.resolve( () => null );
	}

	const stripe = await options.api.getStripe();
	// https://stripe.com/docs/payments/link/autofill-modal
	const linkAutofill = stripe.linkAutofillModal( options.elements );

	const handleKeyup = ( event ) => {
		linkAutofill.launch( { email: event.target.value } );
	};
	emailField.addEventListener( 'keyup', handleKeyup );

	options.onButtonShow( linkAutofill );

	linkAutofill.on( 'autofill', ( event ) => {
		const { billingAddress, shippingAddress } = event.value;
		options.onAutofill(
			transformStripeLinkAddress( billingAddress ),
			transformStripeLinkAddress( shippingAddress )
		);
		switchToNewPaymentTokenElement();
	} );

	return () => {
		emailField.removeEventListener( 'keyup', handleKeyup );
		removeLinkButton();
	};
};

export default enableStripeLinkPaymentMethod;
