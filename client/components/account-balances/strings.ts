/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

export const greetingStrings = {
	withName: {
		/** translators: %s name of the person being greeted. */
		morning: __( 'Good morning, %s', 'poocommerce-payments' ),
		/** translators: %s name of the person being greeted. */
		afternoon: __( 'Good afternoon, %s', 'poocommerce-payments' ),
		/** translators: %s name of the person being greeted. */
		evening: __( 'Good evening, %s', 'poocommerce-payments' ),
	},
	withoutName: {
		morning: __( 'Good morning', 'poocommerce-payments' ),
		afternoon: __( 'Good afternoon', 'poocommerce-payments' ),
		evening: __( 'Good evening', 'poocommerce-payments' ),
	},
};

export const fundLabelStrings = {
	available: __( 'Available funds', 'poocommerce-payments' ),
	total: __( 'Total balance', 'poocommerce-payments' ),
};

export const documentationUrls = {
	depositSchedule:
		'https://poocommerce.com/document/woopayments/payouts/payout-schedule/',
	negativeBalance:
		'https://poocommerce.com/document/woopayments/fees-and-debits/account-showing-negative-balance/',
};
