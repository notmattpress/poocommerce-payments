/** @format **/

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

// Mapping of transaction types to display string.
export const displayType = {
	charge: __( 'Charge', 'poocommerce-payments' ),
	payment: __( 'Payment', 'poocommerce-payments' ),
	payment_failure_refund: __(
		'Payment failure refund',
		'poocommerce-payments'
	),
	payment_refund: __( 'Payment refund', 'poocommerce-payments' ),
	refund: __( 'Refund', 'poocommerce-payments' ),
	refund_failure: __( 'Refund failure', 'poocommerce-payments' ),
	dispute: __( 'Dispute', 'poocommerce-payments' ),
	dispute_reversal: __( 'Dispute reversal', 'poocommerce-payments' ),
	card_reader_fee: __( 'Reader fee', 'poocommerce-payments' ),
	financing_payout: __( 'Loan disbursement', 'poocommerce-payments' ),
	financing_paydown: __( 'Loan repayment', 'poocommerce-payments' ),
	fee_refund: __( 'Fee refund', 'poocommerce-payments' ),
};

// Mapping of transaction device type string.
export const sourceDevice = {
	android: __( 'Android', 'poocommerce-payments' ),
	ios: __( 'iPhone', 'poocommerce-payments' ),
};

// Mapping of transaction channel type string.
export const channel = {
	online: __( 'Online store', 'poocommerce-payments' ),
	in_person: __( 'In-Person', 'poocommerce-payments' ),
	in_person_pos: __( 'In-Person (POS)', 'poocommerce-payments' ),
};

// Mapping of transaction risk level string.
export const riskLevel = {
	'0': __( 'Normal', 'poocommerce-payments' ),
	'1': __( 'Elevated', 'poocommerce-payments' ),
	'2': __( 'Highest', 'poocommerce-payments' ),
};
