/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { TableCardColumn, TableCardBodyColumn } from '@poocommerce/components';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getDetailsURL } from 'components/details-link';
import ClickableCell from 'components/clickable-cell';
import { formatExplicitCurrency } from 'multi-currency/interface/functions';
import { recordEvent } from 'tracks';
import TransactionStatusPill from 'wcpay/components/transaction-status-pill';
import { FraudOutcomeTransaction } from '../../data';
import { formatDateTimeFromString } from 'wcpay/utils/date-time';

export interface Column extends TableCardColumn {
	key: 'created' | 'amount' | 'customer' | 'status';
	visible?: boolean;
	cellClassName?: string;
}

const rowDataFallback: TableCardBodyColumn = {
	display: null,
};

export const getRiskReviewListColumns = (): Column[] =>
	[
		{
			key: 'created',
			label: __( 'Date / Time', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Date / Time', 'poocommerce-payments' ),
			required: true,
			isLeftAligned: true,
			defaultOrder: 'desc',
			cellClassName: 'date-time',
			isSortable: true,
			defaultSort: true,
		},
		{
			key: 'amount',
			label: __( 'Amount', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Amount', 'poocommerce-payments' ),
			isNumeric: true,
			isSortable: true,
		},
		{
			key: 'customer',
			label: __( 'Customer', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Customer', 'poocommerce-payments' ),
			visible: true,
			isLeftAligned: true,
		},
		{
			key: 'status',
			label: __( 'Status', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Status', 'poocommerce-payments' ),
			visible: true,
			isLeftAligned: true,
		},
		{
			key: 'action',
			label: '',
			screenReaderLabel: '',
			visible: true,
			required: true,
			isNumeric: true,
		},
	].filter( Boolean ) as Column[]; // We explicitly define the type because TypeScript can't infer the type post-filtering.

export const getRiskReviewListRowContent = (
	data: FraudOutcomeTransaction
): Record< string, TableCardBodyColumn > => {
	const detailsURL = getDetailsURL( data.payment_intent.id, 'transactions' );
	const formattedCreatedDate = formatDateTimeFromString( data.created, {
		includeTime: true,
	} );

	const clickable = ( children: React.ReactNode ) => (
		<ClickableCell href={ detailsURL }>{ children }</ClickableCell>
	);

	const handleActionButtonClick = () => {
		recordEvent(
			'payments_transactions_risk_review_list_review_button_click',
			{
				payment_intent_id: data.payment_intent.id,
			}
		);
	};

	return {
		status: {
			value: data.status,
			display: <TransactionStatusPill status="review" />,
		},
		created: {
			value: formattedCreatedDate,
			display: clickable( formattedCreatedDate ),
		},
		amount: {
			value: data.amount,
			display: clickable(
				formatExplicitCurrency( data.amount, data.currency )
			),
		},
		customer: {
			value: data.customer_name,
			display: clickable( data.customer_name ),
		},
		action: {
			display: (
				<Button
					variant="secondary"
					href={ detailsURL }
					onClick={ handleActionButtonClick }
					__next40pxDefaultSize
				>
					{ __( 'Review' ) }
				</Button>
			),
		},
	};
};

export const getRiskReviewListColumnsStructure = (
	data: FraudOutcomeTransaction,
	columns: Column[]
): TableCardBodyColumn[] => {
	const content = getRiskReviewListRowContent( data );

	return columns.map( ( { key } ) => content[ key ] || rowDataFallback );
};
