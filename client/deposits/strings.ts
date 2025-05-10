/** @format **/

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import type { DepositStatus, PayoutFailureCode } from 'wcpay/types/deposits';

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

/**
 * Mapping of payout failure code to display string.
 */
export const payoutFailureMessages: Record< PayoutFailureCode, string > = {
	insufficient_funds: __(
		'Your account has insufficient funds to cover your negative balance.',
		'poocommerce-payments'
	),
	bank_account_restricted: __(
		'The bank account has restrictions on either the type or number of transfers allowed. This normally indicates that the bank account is a savings or other non-checking account.',
		'poocommerce-payments'
	),
	debit_not_authorized: __(
		'Debit transactions are not approved on your bank account. Bank accounts need to be set up for both credit and debit transfers.',
		'poocommerce-payments'
	),
	invalid_card: __(
		'The card used was invalid. This usually means the card number is invalid or the account has been closed.',
		'poocommerce-payments'
	),
	declined: __(
		'The bank has declined this transfer. Please contact the bank for more information.',
		'poocommerce-payments'
	),
	invalid_transaction: __(
		'The transfer was refused by the issuing bank because this type of payment is not permitted for this card. Please contact the issuing bank for clarification.',
		'poocommerce-payments'
	),
	refer_to_card_issuer: __(
		'The transfer was refused by the card issuer. Please contact the issuing bank for clarification.',
		'poocommerce-payments'
	),
	unsupported_card: __(
		'The bank no longer supports transfers to this card.',
		'poocommerce-payments'
	),
	lost_or_stolen_card: __(
		'The card used has been reported lost or stolen. Please contact the issuing bank for clarification.',
		'poocommerce-payments'
	),
	invalid_issuer: __(
		'The issuer specified by the card number does not exist. Please verify card details.',
		'poocommerce-payments'
	),
	expired_card: __(
		'The card used has expired. Please switch to a different card or payment method. Contact the issuing bank for clarification.',
		'poocommerce-payments'
	),
	could_not_process: __(
		// The same failure code is used if processing is failed by the bank or Stripe.
		'The bank or the payment processor could not process this transfer.',
		'poocommerce-payments'
	),
	invalid_account_number: __(
		'The bank account details on file are probably incorrect. While the routing number appears correct, the account number is invalid.',
		'poocommerce-payments'
	),
	incorrect_account_holder_name: __(
		'The bank account holder name on file appears to be incorrect.',
		'poocommerce-payments'
	),
	account_closed: __(
		'The bank account has been closed.',
		'poocommerce-payments'
	),
	no_account: __(
		'The bank account details on file are probably incorrect. No bank account could be located with those details.',
		'poocommerce-payments'
	),
	exceeds_amount_limit: __(
		'The card issuer has declined the transaction as it will exceed the card limit. Please switch to a different card or payment method. Contact the issuing bank for clarification.',
		'poocommerce-payments'
	),
	account_frozen: __(
		'The bank account has been frozen.',
		'poocommerce-payments'
	),
	issuer_unavailable: __(
		'The issuing bank is currently unavailable. Our system will automatically try again on your next payout date, or you can switch to a different payout method.',
		'poocommerce-payments'
	),
	invalid_currency: __(
		'The bank was unable to process this transfer because of its currency. This is probably because the bank account cannot accept payments in that currency.',
		'poocommerce-payments'
	),
	incorrect_account_type: __(
		'The bank account type is incorrect. This value can only be checking or savings in most countries. In Japan, it can only be futsu or toza.',
		'poocommerce-payments'
	),
	incorrect_account_holder_details: __(
		'The bank could not process this transfer. Please check that the entered bank account details match the corresponding account bank statement exactly.',
		'poocommerce-payments'
	),
	bank_ownership_changed: __(
		'The destination bank account is no longer valid because its branch has changed ownership.',
		'poocommerce-payments'
	),
	exceeds_count_limit: __(
		'The selected card has exceeded its card usage frequency limit. Please switch to a different card or payment method. Contact the issuing bank for clarification.',
		'poocommerce-payments'
	),
	incorrect_account_holder_address: __(
		'Your bank notified us that the bank account holder address on file is incorrect.',
		'poocommerce-payments'
	),
	incorrect_account_holder_tax_id: __(
		'Your bank notified us that the bank account holder tax ID on file is incorrect.',
		'poocommerce-payments'
	),
	invalid_account_number_length: __(
		'Your bank notified us that the bank account number is too long.',
		'poocommerce-payments'
	),
};
