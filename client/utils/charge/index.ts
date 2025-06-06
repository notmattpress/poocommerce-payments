/** @format **/

/**
 * External dependencies
 */
import { sumBy, get } from 'lodash';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Dispute } from 'types/disputes';
import { Charge, ChargeAmounts } from 'types/charges';
import { PaymentIntent } from '../../types/payment-intents';

const failedOutcomeTypes = [ 'issuer_declined', 'invalid' ];
const blockedOutcomeTypes = [ 'blocked' ];

export const getDisputeStatus = (
	dispute: null | Dispute = <Dispute>{}
): string => dispute?.status || '';

export const getChargeOutcomeType = ( charge: Charge = <Charge>{} ): string =>
	charge.outcome ? charge.outcome.type : '';

export const isChargeSuccessful = ( charge: Charge = <Charge>{} ): boolean =>
	'succeeded' === charge.status && true === charge.paid;

export const isChargeFailed = ( charge: Charge = <Charge>{} ): boolean =>
	'failed' === charge.status &&
	failedOutcomeTypes.includes( getChargeOutcomeType( charge ) );

export const isChargeBlocked = ( charge: Charge = <Charge>{} ): boolean =>
	'failed' === charge.status &&
	blockedOutcomeTypes.includes( getChargeOutcomeType( charge ) );

export const isChargeCaptured = ( charge: Charge = <Charge>{} ): boolean =>
	true === charge.captured;

export const isChargeDisputed = ( charge: Charge = <Charge>{} ): boolean =>
	true === charge.disputed;

export const isChargeRefunded = ( charge: Charge = <Charge>{} ): boolean =>
	0 < charge.amount_refunded;

export const isChargeRefundFailed = ( charge: Charge = <Charge>{} ): boolean =>
	false === charge.refunded && get( charge, 'refunds.data', [] ).length > 0;

export const isChargeFullyRefunded = ( charge: Charge = <Charge>{} ): boolean =>
	true === charge.refunded;

export const isChargePartiallyRefunded = (
	charge: Charge = <Charge>{}
): boolean => isChargeRefunded( charge ) && ! isChargeFullyRefunded( charge );

const getFraudMetaBoxType = (
	charge?: Charge,
	paymentIntent?: PaymentIntent
): string =>
	charge?.order?.fraud_meta_box_type ||
	paymentIntent?.order?.fraud_meta_box_type ||
	'';

export const isOnHoldByFraudTools = (
	charge?: Charge,
	paymentIntent?: PaymentIntent
): boolean => {
	const fraudMetaBoxType = getFraudMetaBoxType( charge, paymentIntent );

	if ( ! fraudMetaBoxType ) {
		return false;
	}

	return (
		paymentIntent?.status === 'requires_capture' &&
		'review' === fraudMetaBoxType
	);
};

export const isBlockedByFraudTools = (
	charge?: Charge,
	paymentIntent?: PaymentIntent
): boolean => {
	const fraudMetaBoxType = getFraudMetaBoxType( charge, paymentIntent );

	if ( ! fraudMetaBoxType ) {
		return false;
	}

	return [ 'block', 'review_blocked' ].includes( fraudMetaBoxType );
};

/* TODO: implement authorization and SCA charge statuses */
export const getChargeStatus = (
	charge: Charge = <Charge>{},
	paymentIntent?: PaymentIntent
): string => {
	if ( isOnHoldByFraudTools( charge, paymentIntent ) ) {
		return 'fraud_outcome_review';
	}

	if ( isBlockedByFraudTools( charge, paymentIntent ) ) {
		return 'fraud_outcome_block';
	}

	if ( isChargeFailed( charge ) ) {
		return 'failed';
	}
	if ( isChargeBlocked( charge ) ) {
		return 'blocked';
	}
	if ( isChargeDisputed( charge ) ) {
		return 'disputed_' + getDisputeStatus( charge.dispute );
	}
	if ( isChargePartiallyRefunded( charge ) ) {
		return 'refunded_partial';
	}
	if ( isChargeFullyRefunded( charge ) ) {
		return 'refunded_full';
	}
	if ( isChargeRefundFailed( charge ) ) {
		return 'refund_failed';
	}
	if ( isChargeSuccessful( charge ) ) {
		return isChargeCaptured( charge ) ? 'paid' : 'authorized';
	}
	return charge.status;
};

/**
 * Calculates display values for charge amounts in settlement currency.
 *
 * @param {Charge} charge The full charge object.
 * @return {ChargeAmounts} An object, containing the `currency`, `amount`, `net`, `fee`, and `refunded` amounts in Stripe format (*100).
 */
export const getChargeAmounts = ( charge: Charge ): ChargeAmounts => {
	const balance = charge.balance_transaction
		? {
				currency: charge.balance_transaction.currency,
				amount: charge.balance_transaction.amount,
				fee: charge.balance_transaction.fee,
				refunded: 0,
				net: 0,
		  }
		: {
				currency: charge.currency,
				amount: charge.amount,
				fee: charge.application_fee_amount,
				refunded: 0,
				net: 0,
		  };

	if ( isChargeRefunded( charge ) ) {
		// Refund balance_transactions have negative amount.
		balance.refunded -= sumBy(
			charge.refunds?.data,
			'balance_transaction.amount'
		);
	}

	if ( isChargeDisputed( charge ) && typeof charge.dispute !== 'undefined' ) {
		balance.fee += sumBy( charge.dispute?.balance_transactions, 'fee' );
		balance.refunded -= sumBy(
			charge.dispute?.balance_transactions,
			'amount'
		);
	}

	// The final net amount equals the original amount, decreased by the fee(s) and refunded amount.
	balance.net = balance.amount - balance.fee - balance.refunded;

	return balance;
};

/**
 * Displays the transaction's sales channel: Online store | In-Person | In-Person (POS).
 * This method is called on the list of transactions page.
 *
 * In the list of transactions, the type holds the brand of the payment method, so we aren't passing it.
 * Instead, we pass the transaction.channel directly, which might be in_person|in_person_pos|online.
 *
 * @param {string} channel The transaction channel.
 * @return {string} Online store, In-Person, or In-Person (POS).
 */
export const getTransactionChannel = ( channel: string ): string => {
	switch ( channel ) {
		case 'in_person':
			return __( 'In-Person', 'poocommerce-payments' );
		case 'in_person_pos':
			return __( 'In-Person (POS)', 'poocommerce-payments' );
		default:
			return __( 'Online store', 'poocommerce-payments' );
	}
};

/**
 * Displays the sales channel based on the charge data from Stripe and metadata for a transaction: Online store | In-Person | In-Person (POS).
 * This method is called in the individual transaction page.
 *
 * In the individual transaction page, we are getting the data from Stripe, so we pass the charge.type
 * which can be card_present or interac_present for In-Person payments. In addition, we pass the transaction metadata
 * whose ipp_channel value can be mobile_store_management or mobile_pos that indicates whether the channel is from store
 * management or POS in the mobile apps.
 *
 * @param {string} type The transaction charge type, which can be card_present or interac_present for In-Person payments.
 * @param {Record<string, any>} metadata The transaction metadata, which may include ipp_channel indicating the channel source.
 * @return {string} Returns 'Online store', 'In-Person', or 'In-Person (POS)' based on the transaction type and metadata.
 */
export const getChargeChannel = (
	type: string,
	metadata: Record< string, any >
): string => {
	if ( type === 'card_present' || type === 'interac_present' ) {
		if ( metadata?.ipp_channel === 'mobile_pos' ) {
			return __( 'In-Person (POS)', 'poocommerce-payments' );
		}
		return __( 'In-Person', 'poocommerce-payments' );
	}

	return __( 'Online store', 'poocommerce-payments' );
};

/**
 * Returns the bank name for a charge.
 *
 * @param {Charge} charge - The charge to get the bank name for.
 *
 * @return {string | null} The bank name for the charge.
 */
export const getBankName = ( charge: Charge ): string | null => {
	const { payment_method_details: paymentMethodDetails } = charge;
	const methodType = paymentMethodDetails?.type?.toLowerCase();

	// For card payments, get the issuer from card details
	if ( methodType === 'card' && paymentMethodDetails?.type === 'card' ) {
		// Type assertion is safe here because we've checked the type
		const cardDetails = paymentMethodDetails.card as {
			issuer?: string;
		};
		return cardDetails.issuer || null;
	}

	// For BNPL (affirm, afterpay_clearpay, klarna) disputes are all handled directly through the BNPL provider.
	// For example, with an Affirm dispute, the `issuer` is actually Affirm
	switch ( methodType ) {
		case 'affirm':
			return 'Affirm';
		case 'afterpay_clearpay':
			return 'Afterpay / Clearpay';
		case 'klarna':
			return 'Klarna';
		default:
			return null;
	}
};
