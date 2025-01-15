/** @format **/

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import type { DepositStatus } from 'wcpay/types/deposits';

export const displayType = {
	deposit: __( 'Payout', 'poocommerce-payments' ),
	withdrawal: __( 'Withdrawal', 'poocommerce-payments' ),
};

/**
 * Labels to display for each deposit status.
 *
 * 'deducted' represents a deposit of the type 'withdrawal' and status 'paid'.
 */
export const depositStatusLabels: Record<
	DepositStatus | 'deducted',
	string
> = {
	paid: __( 'Completed (paid)', 'poocommerce-payments' ),
	deducted: __( 'Completed (deducted)', 'poocommerce-payments' ),
	pending: __( 'Pending', 'poocommerce-payments' ),
	in_transit: __( 'In transit', 'poocommerce-payments' ),
	canceled: __( 'Canceled', 'poocommerce-payments' ),
	failed: __( 'Failed', 'poocommerce-payments' ),
};
