/* global jQuery */
/**
 * External dependencies
 */
import { addFilter, doAction } from '@wordpress/hooks';

jQuery( ( $ ) => {
	$( 'input[name=wc_deposit_option],input[name=wc_deposit_payment_plan]' ).on(
		'change',
		() => {
			doAction( 'wcpay.express-checkout.update-button-data' );
		}
	);
} );
addFilter(
	'wcpay.express-checkout.cart-add-item',
	'automattic/wcpay/express-checkout',
	( productData ) => {
		const depositsData = {};
		if ( jQuery( 'input[name=wc_deposit_option]' ).length ) {
			depositsData.wc_deposit_option = jQuery(
				'input[name=wc_deposit_option]:checked'
			).val();
		}
		if ( jQuery( 'input[name=wc_deposit_payment_plan]' ).length ) {
			depositsData.wc_deposit_payment_plan = jQuery(
				'input[name=wc_deposit_payment_plan]:checked'
			).val();
		}

		return { ...productData, ...depositsData };
	}
);
