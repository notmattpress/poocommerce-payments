/** @format **/

/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { Link } from '@poocommerce/components';

/**
 * Internal dependencies.
 */
import OrderLink from 'components/order-link';
import { getDetailsURL } from 'components/details-link';
import { reasons } from '../strings';
import { formatStringValue } from 'utils';
import { formatExplicitCurrency } from 'multi-currency/interface/functions';
import './style.scss';
import Loadable from 'components/loadable';
import { Dispute } from 'wcpay/types/disputes';
import { formatDateTimeFromTimestamp } from 'wcpay/utils/date-time';

const fields: { key: string; label: string }[] = [
	{ key: 'created', label: __( 'Dispute date', 'poocommerce-payments' ) },
	{ key: 'amount', label: __( 'Disputed amount', 'poocommerce-payments' ) },
	{ key: 'dueBy', label: __( 'Respond by', 'poocommerce-payments' ) },
	{ key: 'reason', label: __( 'Reason', 'poocommerce-payments' ) },
	{ key: 'order', label: __( 'Order', 'poocommerce-payments' ) },
	{ key: 'customer', label: __( 'Customer', 'poocommerce-payments' ) },
	{
		key: 'transactionId',
		label: __( 'Transaction ID', 'poocommerce-payments' ),
	},
];

const composeTransactionIdLink = ( dispute: Dispute ): JSX.Element => {
	const chargeId =
		'object' === typeof dispute.charge ? dispute.charge.id : dispute.charge;
	return (
		<Link href={ getDetailsURL( chargeId, 'transactions' ) }>
			{ chargeId }
		</Link>
	);
};

const composeDisputeReason = ( dispute: Dispute ): string => {
	const reasonMapping = reasons[ dispute.reason ];
	return reasonMapping
		? reasonMapping.display
		: formatStringValue( dispute.reason );
};

const Info = ( {
	dispute,
	isLoading,
}: {
	dispute: Dispute;
	isLoading: boolean;
} ): JSX.Element => {
	const data: Record< string, any > = isLoading
		? {
				created: __( 'Created date', 'poocommerce-payments' ),
				amount: __( 'Amount', 'poocommerce-payments' ),
				dueBy: __( 'Due by date', 'poocommerce-payments' ),
				reason: __( 'Dispute reason', 'poocommerce-payments' ),
				order: __( 'Order link', 'poocommerce-payments' ),
				customer: __( 'Customer name', 'poocommerce-payments' ),
				transactionId: __( 'Transaction link', 'poocommerce-payments' ),
		  }
		: {
				created: formatDateTimeFromTimestamp( dispute.created ),
				amount: formatExplicitCurrency(
					dispute.amount || 0,
					dispute.currency || 'USD'
				),
				dueBy: dispute.evidence_details
					? formatDateTimeFromTimestamp(
							dispute.evidence_details.due_by,
							{ separator: ' - ', includeTime: true }
					  )
					: null,
				reason: composeDisputeReason( dispute ),
				order: dispute.order ? (
					<OrderLink order={ dispute.order } />
				) : null,
				customer:
					'object' === typeof dispute.charge
						? dispute.charge.billing_details.name
						: null,
				transactionId: composeTransactionIdLink( dispute ),
		  };

	return (
		<div className="wcpay-dispute-info">
			{ fields.map( ( { key, label } ) => {
				if ( null == data[ key ] ) {
					return null;
				}
				return (
					<div key={ key } className="wcpay-dispute-info-item">
						<Loadable isLoading={ isLoading } display="inline">
							<span className="wcpay-dispute-info-key">{ `${ label }: ` }</span>
							<span className="wcpay-dispute-info-value">
								{ data[ key ] }
							</span>
						</Loadable>
					</div>
				);
			} ) }
		</div>
	);
};

export default Info;
