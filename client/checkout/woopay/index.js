/* global jQuery */
/**
 * External dependencies
 */
import ReactDOM from 'react-dom';

/**
 * External dependencies
 */
import CheckoutPageSaveUser from 'wcpay/components/woopay/save-user/checkout-page-save-user';

const renderSaveUserSection = () => {
	const saveUserSection = document.getElementsByClassName(
		'woopay-save-new-user-container'
	)?.[ 0 ];

	if ( saveUserSection ) {
		return;
	}

	const blocksCheckout = document.getElementsByClassName(
		'wc-block-checkout'
	);

	if ( blocksCheckout.length ) {
		let checkoutPageSaveUserContainer = document.querySelector(
			'#remember-me'
		);

		if ( ! checkoutPageSaveUserContainer ) {
			const paymentOptions = document.getElementsByClassName(
				'wp-block-poocommerce-checkout-payment-block'
			)?.[ 0 ];

			checkoutPageSaveUserContainer = document.createElement(
				'fieldset'
			);

			checkoutPageSaveUserContainer.className =
				'wc-block-checkout__payment-method wp-block-poocommerce-checkout-remember-block wc-block-components-checkout-step ';
			checkoutPageSaveUserContainer.id = 'remember-me';

			if ( paymentOptions ) {
				// Render right after the payment options block, as a sibling element.
				paymentOptions.parentNode.insertBefore(
					checkoutPageSaveUserContainer,
					paymentOptions.nextSibling
				);
			}
		}

		ReactDOM.render(
			<CheckoutPageSaveUser isBlocksCheckout={ true } />,
			checkoutPageSaveUserContainer
		);
	} else {
		const checkoutPageSaveUserContainer = document.createElement( 'div' );
		checkoutPageSaveUserContainer.className =
			'woopay-save-new-user-container';

		const placeOrderButton = document.getElementsByClassName(
			'form-row place-order'
		)?.[ 0 ];
		const buttonParent = placeOrderButton?.parentNode;

		if ( placeOrderButton && buttonParent ) {
			buttonParent.insertBefore(
				checkoutPageSaveUserContainer,
				placeOrderButton
			);

			ReactDOM.render(
				<CheckoutPageSaveUser isBlocksCheckout={ false } />,
				checkoutPageSaveUserContainer
			);
		}
	}
};

window.addEventListener( 'load', () => {
	renderSaveUserSection();
} );

// mount component again if parent fragment if re-rendered after ajax request by poocommerce core
// https://github.com/poocommerce/poocommerce/blob/trunk/plugins/poocommerce/legacy/js/frontend/checkout.js#L372
jQuery( function ( $ ) {
	$( document ).ajaxComplete( function () {
		renderSaveUserSection();
	} );
} );
