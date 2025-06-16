/** @format **/

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import type { ChipType } from '../chip';

const status: {
	[ key: string ]: {
		type: ChipType;
		message: string;
	};
} = {
	warning_needs_response: {
		type: 'warning',
		message: __( 'Inquiry: Needs response', 'poocommerce-payments' ),
	},
	warning_under_review: {
		type: 'primary',
		message: __( 'Inquiry: Under review', 'poocommerce-payments' ),
	},
	warning_closed: {
		type: 'light',
		message: __( 'Inquiry: Closed', 'poocommerce-payments' ),
	},
	needs_response: {
		type: 'warning',
		message: __( 'Needs response', 'poocommerce-payments' ),
	},
	under_review: {
		type: 'primary',
		message: __( 'Under review', 'poocommerce-payments' ),
	},
	charge_refunded: {
		type: 'light',
		message: __( 'Charge refunded', 'poocommerce-payments' ),
	},
	won: {
		type: 'success',
		message: __( 'Won', 'poocommerce-payments' ),
	},
	lost: {
		type: 'light',
		message: __( 'Lost', 'poocommerce-payments' ),
	},
};

export default status;
