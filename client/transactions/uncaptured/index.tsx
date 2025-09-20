/** @format **/

/**
 * External dependencies
 */
import React, { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { TableCard, TableCardColumn } from '@poocommerce/components';
import { onQueryChange, getQuery } from '@poocommerce/navigation';
import moment from 'moment';

/**
 * Internal dependencies
 */
import { useAuthorizations, useAuthorizationsSummary } from 'data/index';
import Page from '../../components/page';
import { getDetailsURL } from 'components/details-link';
import ClickableCell from 'components/clickable-cell';
import { formatExplicitCurrency } from 'multi-currency/interface/functions';
import RiskLevel, { calculateRiskMapping } from 'components/risk-level';
import { recordEvent } from 'tracks';
import CaptureAuthorizationButton from 'wcpay/components/capture-authorization-button';
import { formatDateTimeFromString } from 'wcpay/utils/date-time';
import { usePersistedColumnVisibility } from 'wcpay/hooks/use-persisted-table-column-visibility';

interface Column extends TableCardColumn {
	key:
		| 'authorization_id'
		| 'created'
		| 'capture_by'
		| 'order'
		| 'risk_level'
		| 'amount'
		| 'customer_email'
		| 'customer_country';
	visible?: boolean;
	cellClassName?: string;
}

const getColumns = (): Column[] =>
	[
		{
			key: 'created',
			label: __( 'Authorized on', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Authorized on', 'poocommerce-payments' ),
			required: true,
			isLeftAligned: true,
			defaultOrder: 'asc',
			cellClassName: 'date-time',
			isSortable: true,
			defaultSort: true,
		},
		{
			key: 'capture_by',
			label: __( 'Capture by', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Capture by', 'poocommerce-payments' ),
			required: true,
			isLeftAligned: true,
			cellClassName: 'date-time',
			isSortable: true,
		},
		{
			key: 'order',
			label: __( 'Order', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Order number', 'poocommerce-payments' ),
			required: true,
		},
		{
			key: 'risk_level',
			label: __( 'Risk level', 'poocommerce-payments' ),
			screenReaderLabel: __(
				'Risk level of transaction',
				'poocommerce-payments'
			),
			isLeftAligned: true,
		},
		{
			key: 'amount',
			label: __( 'Amount', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Amount', 'poocommerce-payments' ),
			isNumeric: true,
			isSortable: true,
		},
		{
			key: 'customer_email',
			label: __( 'Email', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Email', 'poocommerce-payments' ),
			visible: false,
			isLeftAligned: true,
		},
		{
			key: 'customer_country',
			label: __( 'Country', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Country', 'poocommerce-payments' ),
			visible: false,
			isLeftAligned: true,
		},
		{
			key: 'action',
			label: __( 'Action', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Action', 'poocommerce-payments' ),
			visible: true,
			required: true,
		},
	].filter( Boolean ) as Column[]; // We explicitly define the type because TypeScript can't infer the type post-filtering.

export const AuthorizationsList = (): JSX.Element => {
	const columns = getColumns();
	const { columnsToDisplay, onColumnsChange } = usePersistedColumnVisibility<
		Column
	>( 'wc_payments_transactions_uncaptured_hidden_columns', columns );

	const {
		authorizationsSummary,
		isLoading: isSummaryLoading,
	} = useAuthorizationsSummary( getQuery() );

	const { authorizations, isLoading } = useAuthorizations( getQuery() );

	const rows = authorizations.map( ( auth ) => {
		const riskLevel = <RiskLevel risk={ auth.risk_level } />;
		const detailsURL = getDetailsURL(
			auth.payment_intent_id,
			'transactions'
		);

		const clickable = ( children: JSX.Element | string ) => (
			<ClickableCell href={ detailsURL }>{ children }</ClickableCell>
		);

		const data = {
			authorization_id: {
				// The authorization id is not exposed. Using the payment intent id as unique identifier
				value: auth.payment_intent_id,
				display: auth.payment_intent_id,
			},
			created: {
				value: formatDateTimeFromString( auth.created, {
					includeTime: true,
				} ),
				display: clickable(
					formatDateTimeFromString( auth.created, {
						includeTime: true,
					} )
				),
			},
			// Payments are authorized for a maximum of 7 days
			capture_by: {
				value: formatDateTimeFromString(
					moment.utc( auth.created ).add( 7, 'd' ).toISOString(),
					{ includeTime: true }
				),
				display: clickable(
					formatDateTimeFromString(
						moment.utc( auth.created ).add( 7, 'd' ).toISOString(),
						{ includeTime: true }
					)
				),
			},
			order: {
				value: auth.order_id,
				display: clickable(
					`#${ auth.order_id } ${ auth.customer_name }`
				),
			},
			risk_level: {
				value: calculateRiskMapping( auth.risk_level ),
				display: clickable( riskLevel ),
			},
			amount: {
				value: auth.amount,
				display: clickable(
					formatExplicitCurrency( auth.amount, auth.currency )
				),
			},
			customer_email: {
				value: auth.customer_email,
				display: clickable( auth.customer_email ),
			},
			customer_country: {
				value: auth.customer_country,
				display: clickable( auth.customer_country ),
			},
			action: {
				display: (
					<CaptureAuthorizationButton
						orderId={ auth.order_id }
						paymentIntentId={ auth.payment_intent_id }
						buttonIsSmall={ false }
						onClick={ () => {
							recordEvent(
								'payments_transactions_uncaptured_list_capture_charge_button_click',
								{
									payment_intent_id: auth.payment_intent_id,
								}
							);
						} }
					/>
				),
			},
		};

		return columnsToDisplay.map(
			( { key } ) =>
				data[ key ] || {
					display: null,
				}
		);
	} );

	let summary;

	const isAuthorizationsSummaryLoaded =
		authorizationsSummary.count !== undefined &&
		authorizationsSummary.total !== undefined &&
		false === isSummaryLoading;
	const totalRows = authorizationsSummary.count || 0;

	if ( isAuthorizationsSummaryLoaded ) {
		summary = [
			{
				label: __( 'authorization(s)', 'poocommerce-payments' ),
				value: String( authorizationsSummary.count ),
			},
		];

		if (
			authorizationsSummary.count &&
			authorizationsSummary.count > 0 &&
			authorizationsSummary.all_currencies &&
			authorizationsSummary.all_currencies.length === 1
		) {
			// Only show the total if there is one currency available
			summary.push( {
				label: __( 'total', 'poocommerce-payments' ),
				value: `${ formatExplicitCurrency(
					// We've already checked that `.total` is not undefined, but TypeScript doesn't detect
					// that so we remove the `undefined` in the type manually.
					authorizationsSummary.total as number,
					authorizationsSummary.currency
				) }`,
			} );
		}
	}

	useEffect( () => {
		recordEvent( 'page_view', {
			path: 'payments_transactions_uncaptured',
		} );
	}, [] );

	return (
		<Page>
			<TableCard
				className="authorizations-list poocommerce-report-table has-search"
				title={ __(
					'Uncaptured transactions',
					'poocommerce-payments'
				) }
				isLoading={ isLoading || isSummaryLoading }
				rowsPerPage={ parseInt( getQuery().per_page ?? '', 10 ) || 25 }
				totalRows={ totalRows }
				headers={ columnsToDisplay }
				rows={ rows }
				summary={ summary }
				query={ getQuery() }
				onQueryChange={ onQueryChange }
				onColumnsChange={ onColumnsChange }
			/>
		</Page>
	);
};

export default AuthorizationsList;
