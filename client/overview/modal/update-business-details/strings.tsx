/* eslint-disable max-len */
/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

export default {
	button: __( 'Finish setup', 'poocommerce-payments' ),

	heading: sprintf(
		/* translators: %s: WooPayments */
		__( 'Update %s business details', 'poocommerce-payments' ),
		'WooPayments'
	),

	restrictedDescription: __(
		'Payments and payouts are disabled for this account until missing information is updated. Please update the following information in the Stripe dashboard.',
		'poocommerce-payments'
	),

	restrictedSoonDescription: __(
		'Additional information is required to verify your business. Update by %s to avoid a disruption in payouts.',
		'poocommerce-payments'
	),

	updateBusinessDetails: __(
		'Update business details',
		'poocommerce-payments '
	),

	cancel: __( 'Cancel', 'poocommerce-payments' ),
};
