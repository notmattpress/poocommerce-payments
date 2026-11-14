/* eslint-disable max-len */
/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

export default {
	button: __( 'Dismiss', 'poocommerce-payments' ),

	heading: __( "You're ready to accept payments!", 'poocommerce-payments' ),

	description: sprintf(
		__(
			'Great news — your %s account has been activated. You can now start accepting payments on your store.',
			'poocommerce-payments'
		),
		'WooPayments'
	),
};
