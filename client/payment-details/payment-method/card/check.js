/** @format **/

/**
 * External dependencies
 */

import { __ } from '@wordpress/i18n';

const PaymentDetailsPaymentMethodCheck = ( props ) => {
	const { checked } = props;

	switch ( checked ) {
		case 'pass':
			return __( 'Passed', 'poocommerce-payments' );
		case 'fail':
			return __( 'Failed', 'poocommerce-payments' );
		case 'unavailable':
			return __( 'Unavailable', 'poocommerce-payments' );
		default:
			return __( 'Not checked', 'poocommerce-payments' );
	}
};

export default PaymentDetailsPaymentMethodCheck;
