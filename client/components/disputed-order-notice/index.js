import moment from 'moment';
import React, { useEffect } from 'react';
import { __, _n, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InlineNotice from 'wcpay/components/inline-notice';
import { formatExplicitCurrency } from 'multi-currency/interface/functions';
import { reasons } from 'wcpay/disputes/strings';
import { getDetailsURL } from 'wcpay/components/details-link';
import {
	isAwaitingResponse,
	isInquiry,
	isRefundable,
	isUnderReview,
} from 'wcpay/disputes/utils';
import { useCharge } from 'wcpay/data';
import { recordEvent } from 'tracks';
import './style.scss';
import { formatDateTimeFromString } from 'wcpay/utils/date-time';

const DisputedOrderNoticeHandler = ( { chargeId, onDisableOrderRefund } ) => {
	const { data: charge } = useCharge( chargeId );
	const disputeDetailsUrl = getDetailsURL( chargeId, 'transactions' );

	// Disable the refund button if there's an active dispute.
	useEffect( () => {
		const { dispute } = charge;
		if ( ! charge?.dispute ) {
			return;
		}
		if ( ! isRefundable( dispute.status ) ) {
			onDisableOrderRefund( dispute.status );
		}
	}, [ charge, onDisableOrderRefund ] );

	const { dispute } = charge;
	if ( ! charge?.dispute ) {
		return null;
	}

	// Special case the dispute "under review" notice which is much simpler.
	// (And return early.)
	if ( isUnderReview( dispute.status ) && ! isInquiry( dispute.status ) ) {
		return (
			<DisputeOrderLockedNotice
				message={ __(
					'This order has an active payment dispute. Refunds and order editing are disabled.',
					'poocommerce-payments'
				) }
				disputeDetailsUrl={ disputeDetailsUrl }
			/>
		);
	}

	// Special case lost disputes.
	// (And return early.)
	// I suspect this is unnecessary, as any lost disputes will have already been
	// refunded as part of `charge.dispute.closed` webhook handler.
	// This may be dead code. Leaving in for now as this is consistent with
	// the logic before this PR.
	// https://github.com/Automattic/poocommerce-payments/pull/7557
	if ( dispute.status === 'lost' ) {
		return (
			<DisputeOrderLockedNotice
				message={ __(
					'Refunds and order editing have been disabled as a result of a lost dispute.',
					'poocommerce-payments'
				) }
				disputeDetailsUrl={ disputeDetailsUrl }
			/>
		);
	}

	// Only show the notice if the dispute is awaiting a response.
	if ( ! isAwaitingResponse( dispute.status ) ) {
		return null;
	}

	// Bail if we don't have due_by for whatever reason.
	if ( ! dispute.evidence_details?.due_by ) {
		return null;
	}

	// Get current time in UTC for consistent timezone-independent comparison
	const now = moment().utc();
	// Parse the Unix timestamp as UTC since it's stored that way in the API
	const dueBy = moment.unix( dispute.evidence_details?.due_by ).utc();

	// If the dispute is due in the past, don't show notice.
	if ( ! now.isBefore( dueBy ) ) {
		return null;
	}

	return (
		<DisputeNeedsResponseNotice
			chargeId={ chargeId }
			disputeReason={ dispute.reason }
			formattedAmount={ formatExplicitCurrency(
				dispute.amount,
				dispute.currency
			) }
			isPreDisputeInquiry={ isInquiry( dispute.status ) }
			dueBy={ dueBy }
			countdownDays={ Math.floor( dueBy.diff( now, 'days', true ) ) }
			disputeDetailsUrl={ disputeDetailsUrl }
		/>
	);
};

const UrgentDisputeNoticeBody = ( {
	isPreDisputeInquiry,
	disputeReason,
	formattedAmount,
	dueBy,
	countdownDays,
} ) => {
	const formatString = isPreDisputeInquiry
		? __(
				// Translators: %1$s is the formatted dispute amount, %2$s is the dispute reason, %3$s is the due date.
				"Please resolve the inquiry on this order of %1$s labeled '%2$s' by %3$s.",
				'poocommerce-payments'
		  )
		: __(
				// Translators: %1$s is the formatted dispute amount, %2$s is the dispute reason, %3$s is the due date.
				"Please resolve the dispute on this order of %1$s labeled '%2$s' by %3$s.",
				'poocommerce-payments'
		  );

	const message = sprintf(
		formatString,
		formattedAmount,
		reasons[ disputeReason ].display,
		formatDateTimeFromString( dueBy.toISOString() )
	);

	let suffix = sprintf(
		// Translators: %s is the number of days left to respond to the dispute.
		_n(
			'(%s day left)',
			'(%s days left)',
			countdownDays,
			'poocommerce-payments'
		),
		countdownDays
	);
	if ( countdownDays < 1 ) {
		suffix = __( '(Last day today)', 'poocommerce-payments' );
	}

	return (
		<>
			<strong>{ message }</strong> { suffix }
		</>
	);
};

const RegularDisputeNoticeBody = ( {
	isPreDisputeInquiry,
	disputeReason,
	formattedAmount,
	dueBy,
} ) => {
	const formatString = isPreDisputeInquiry
		? __(
				// Translators: %1$s is the formatted dispute amount, %2$s is the dispute reason.
				"Please resolve the inquiry on this order of %1$s with reason '%2$s'.",
				'poocommerce-payments'
		  )
		: __(
				// Translators: %1$s is the formatted dispute amount, %2$s is the dispute reason.
				"This order has a payment dispute for %1$s for the reason '%2$s'. ",
				'poocommerce-payments'
		  );

	const boldMessage = sprintf(
		formatString,
		formattedAmount,
		reasons[ disputeReason ].display
	);

	const suffix = sprintf(
		// Translators: %1$s is the dispute due date.
		__( 'Please respond before %1$s.', 'poocommerce-payments' ),
		formatDateTimeFromString( dueBy.toISOString() )
	);

	return (
		<>
			<strong>{ boldMessage }</strong> { suffix }
		</>
	);
};

const DisputeNeedsResponseNotice = ( {
	disputeReason,
	formattedAmount,
	isPreDisputeInquiry,
	dueBy,
	countdownDays,
	disputeDetailsUrl,
} ) => {
	useEffect( () => {
		recordEvent( 'wcpay_order_dispute_notice_view', {
			is_inquiry: isPreDisputeInquiry,
			dispute_reason: disputeReason,
			due_by_days: countdownDays,
		} );
	}, [ isPreDisputeInquiry, disputeReason, countdownDays ] );

	const isUrgent = countdownDays < 7;

	const buttonLabel =
		countdownDays < 1
			? __( 'Respond today', 'poocommerce-payments' )
			: __( 'Respond now', 'poocommerce-payments' );

	const noticeBody = isUrgent ? (
		<UrgentDisputeNoticeBody
			isPreDisputeInquiry={ isPreDisputeInquiry }
			disputeReason={ disputeReason }
			formattedAmount={ formattedAmount }
			dueBy={ dueBy }
			countdownDays={ countdownDays }
		/>
	) : (
		<RegularDisputeNoticeBody
			isPreDisputeInquiry={ isPreDisputeInquiry }
			disputeReason={ disputeReason }
			formattedAmount={ formattedAmount }
			dueBy={ dueBy }
		/>
	);

	return (
		<InlineNotice
			status={ countdownDays < 3 ? 'error' : 'warning' }
			isDismissible={ false }
			actions={ [
				{
					label: buttonLabel,
					variant: 'secondary',
					onClick: () => {
						recordEvent(
							'wcpay_order_dispute_notice_action_click',
							{
								due_by_days: countdownDays,
							}
						);
						window.location = disputeDetailsUrl;
					},
				},
			] }
		>
			{ noticeBody }
		</InlineNotice>
	);
};

const DisputeOrderLockedNotice = ( { message, disputeDetailsUrl } ) => {
	return (
		<InlineNotice status="warning" isDismissible={ false }>
			{ message }
			{ createInterpolateElement(
				__( ' <a>View details</a>', 'poocommerce-payments' ),
				{
					// createInterpolateElement is incompatible with this eslint rule as the <a> is decoupled from content.
					// eslint-disable-next-line jsx-a11y/anchor-has-content
					a: <a href={ disputeDetailsUrl } />,
				}
			) }
		</InlineNotice>
	);
};

export default DisputedOrderNoticeHandler;
