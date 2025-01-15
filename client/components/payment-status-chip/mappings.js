/** @format **/

/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import disputeStatuses from 'components/dispute-status-chip/mappings';

const formattedDisputeStatuses = Object.entries( disputeStatuses ).reduce(
	( statuses, [ status, mapping ] ) => {
		statuses[ 'disputed_' + status ] = {
			type: mapping.type,
			message: status.startsWith( 'warning_' )
				? mapping.message
				: sprintf(
						/** translators: %s dispute status, e.g. Won, Lost, Under review, etc. */
						__( 'Disputed: %s', 'poocommerce-payments' ),
						mapping.message
				  ),
		};
		return statuses;
	},
	{}
);

/* TODO: implement other payment statuses (SCA and authorizations) */
export default {
	refunded_partial: {
		type: 'light',
		message: __( 'Partial refund', 'poocommerce-payments' ),
	},
	refunded_full: {
		type: 'light',
		message: __( 'Refunded', 'poocommerce-payments' ),
	},
	paid: {
		type: 'success',
		message: __( 'Paid', 'poocommerce-payments' ),
	},
	authorized: {
		type: 'primary',
		message: __( 'Payment authorized', 'poocommerce-payments' ),
	},
	refund_failed: {
		type: 'alert',
		message: __( 'Refund failure', 'poocommerce-payments' ),
	},
	failed: {
		type: 'alert',
		message: __( 'Payment failed', 'poocommerce-payments' ),
	},
	blocked: {
		type: 'alert',
		message: __( 'Payment blocked', 'poocommerce-payments' ),
	},
	fraud_outcome_review: {
		type: 'warning',
		message: __( 'Needs review', 'poocommerce-payments' ),
	},
	fraud_outcome_block: {
		type: 'alert',
		message: __( 'Payment blocked', 'poocommerce-payments' ),
	},
	...formattedDisputeStatuses,
};
