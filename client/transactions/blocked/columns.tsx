/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { TableCardColumn, TableCardBodyColumn } from '@poocommerce/components';

/**
 * Internal dependencies
 */
import { formatExplicitCurrency } from 'multi-currency/interface/functions';
import TransactionStatusPill from 'wcpay/components/transaction-status-pill';
import { FraudOutcomeTransaction } from '../../data';
import { getDetailsURL } from '../../components/details-link';
import ClickableCell from '../../components/clickable-cell';
import { formatDateTimeFromString } from 'wcpay/utils/date-time';

interface Column extends TableCardColumn {
	key: 'created' | 'amount' | 'customer' | 'status';
	visible?: boolean;
	cellClassName?: string;
}

const rowDataFallback: TableCardBodyColumn = {
	display: null,
};

export const getBlockedListColumns = (): Column[] =>
	[
		{
			key: 'created',
			label: __( 'Date / Time', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Date / Time', 'poocommerce-payments' ),
			labelInCsv: __( 'Date / Time (UTC)', 'poocommerce-payments' ),
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
	].filter( Boolean ) as Column[]; // We explicitly define the type because TypeScript can't infer the type post-filtering.

export const getBlockedListRowContent = (
	data: FraudOutcomeTransaction
): Record< string, TableCardBodyColumn > => {
	const detailsURL = getDetailsURL(
		data.payment_intent.id || data.order_id.toString(),
		'transactions'
	);
	const formattedCreatedDate = formatDateTimeFromString( data.created, {
		includeTime: true,
	} );

	const clickable = ( children: JSX.Element | string ) => (
		<ClickableCell href={ detailsURL }>{ children }</ClickableCell>
	);

	return {
		status: {
			value: data.status,
			display: <TransactionStatusPill status="block" />,
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
	};
};

export const getBlockedListColumnsStructure = (
	data: FraudOutcomeTransaction,
	columns: Column[]
): TableCardBodyColumn[] => {
	const content = getBlockedListRowContent( data );

	return columns.map( ( { key } ) => content[ key ] || rowDataFallback );
};
