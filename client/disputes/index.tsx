/** @format **/

/**
 * External dependencies
 */
import React, { useState } from 'react';
import { recordEvent } from 'tracks';
import { _n, __, sprintf } from '@wordpress/i18n';
import moment from 'moment';
import { Button } from '@wordpress/components';
import { TableCard, Link } from '@poocommerce/components';
import { onQueryChange, getQuery, getHistory } from '@poocommerce/navigation';
import {
	downloadCSVFile,
	generateCSVDataFromTable,
	generateCSVFileName,
} from '@poocommerce/csv-export';
import classNames from 'classnames';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import NoticeOutlineIcon from 'gridicons/dist/notice-outline';

/**
 * Internal dependencies.
 */
import { useDisputes, useDisputesSummary } from 'data/index';
import OrderLink from 'components/order-link';
import DisputeStatusChip from 'components/dispute-status-chip';
import ClickableCell from 'components/clickable-cell';
import DetailsLink, { getDetailsURL } from 'components/details-link';
import Page from 'components/page';
import { TestModeNotice } from 'components/test-mode-notice';
import { reasons } from './strings';
import { formatStringValue } from 'utils';
import {
	formatExplicitCurrency,
	formatExportAmount,
} from 'multi-currency/interface/functions';
import DisputesFilters from './filters';
import DownloadButton from 'components/download-button';
import disputeStatusMapping from 'components/dispute-status-chip/mappings';
import { CachedDispute, DisputesTableHeader } from 'wcpay/types/disputes';
import { getDisputesCSV } from 'wcpay/data/disputes/resolvers';
import { applyThousandSeparator } from 'wcpay/utils';
import { useSettings } from 'wcpay/data';
import { isAwaitingResponse } from 'wcpay/disputes/utils';
import './style.scss';
import { formatDateTimeFromString } from 'wcpay/utils/date-time';
import { usePersistedColumnVisibility } from 'wcpay/hooks/use-persisted-table-column-visibility';

const getHeaders = ( sortColumn?: string ): DisputesTableHeader[] => [
	{
		key: 'details',
		label: '',
		required: true,
		cellClassName: classNames( 'info-button', {
			'is-sorted': sortColumn === 'amount',
		} ),
		isLeftAligned: true,
	},
	{
		key: 'amount',
		label: __( 'Amount', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Amount', 'poocommerce-payments' ),
		required: true,
		isSortable: true,
		isLeftAligned: true,
	},
	{
		key: 'currency',
		label: __( 'Currency', 'poocommerce-payments' ),
		visible: false,
		required: true,
	},
	{
		key: 'status',
		label: __( 'Status', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Status', 'poocommerce-payments' ),
		required: true,
		isLeftAligned: true,
	},
	{
		key: 'reason',
		label: __( 'Reason', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Reason', 'poocommerce-payments' ),
		required: true,
		isLeftAligned: true,
	},
	{
		key: 'source',
		label: __( 'Source', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Source', 'poocommerce-payments' ),
		required: true,
		cellClassName: 'is-center-aligned',
	},
	{
		key: 'order',
		label: __( 'Order #', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Order #', 'poocommerce-payments' ),
		required: true,
	},
	{
		key: 'customerName',
		label: __( 'Customer', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Customer', 'poocommerce-payments' ),
		isLeftAligned: true,
	},
	{
		key: 'customerEmail',
		label: __( 'Email', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Email', 'poocommerce-payments' ),
		visible: false,
		isLeftAligned: true,
	},
	{
		key: 'customerCountry',
		label: __( 'Country', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Country', 'poocommerce-payments' ),
		visible: false,
		isLeftAligned: true,
	},
	{
		key: 'created',
		label: __( 'Disputed on', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Disputed on', 'poocommerce-payments' ),
		isLeftAligned: true,
		isSortable: true,
		defaultSort: true,
		defaultOrder: 'desc',
		visible: false,
	},
	{
		key: 'dueBy',
		label: __( 'Respond by', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Respond by', 'poocommerce-payments' ),
		required: true,
		isLeftAligned: true,
		isSortable: true,
	},
	{
		key: 'action',
		label: __( 'Action', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Action', 'poocommerce-payments' ),
		isLeftAligned: false,
		isNumeric: true,
		required: true,
		visible: true,
	},
];

/**
 * Returns a smart date if dispute's due date is within 72 hours.
 * Otherwise, returns a date string.
 *
 * @param {CachedDispute} dispute The dispute to check.
 *
 * @return {JSX.Element | string} If dispute is due within 72 hours, return the element that display smart date. Otherwise, a date string.
 */
const smartDueDate = ( dispute: CachedDispute ) => {
	// if dispute is not awaiting response, return an empty string.
	if ( dispute.due_by === '' || ! isAwaitingResponse( dispute.status ) ) {
		return '';
	}
	// Get current time in UTC.
	const now = moment().utc();
	const dueBy = moment.utc( dispute.due_by );
	const diffHours = dueBy.diff( now, 'hours', false );
	const diffDays = dueBy.diff( now, 'days', false );

	// if the dispute is past due, return an empty string.
	if ( diffHours <= 0 ) {
		return '';
	}
	if ( diffHours <= 72 ) {
		return (
			<span className="due-soon">
				{ diffHours <= 24
					? __( 'Last day today', 'poocommerce-payments' )
					: sprintf(
							// Translators: %s is the number of days left to respond to the dispute.
							_n(
								'%s day left',
								'%s days left',
								diffDays,
								'poocommerce-payments'
							),
							diffDays
					  ) }
				<NoticeOutlineIcon className="due-soon-icon" />
			</span>
		);
	}
	return formatDateTimeFromString( dispute.due_by, {
		includeTime: true,
	} );
};

export const DisputesList = (): JSX.Element => {
	// pre-fetching the settings.
	useSettings();

	const [ isDownloading, setIsDownloading ] = useState( false );
	const { createNotice } = useDispatch( 'core/notices' );
	const { disputes, isLoading } = useDisputes( getQuery() );

	const { disputesSummary, isLoading: isSummaryLoading } = useDisputesSummary(
		getQuery()
	);

	const headers = getHeaders( getQuery().orderby );
	const { columnsToDisplay, onColumnsChange } = usePersistedColumnVisibility<
		DisputesTableHeader
	>( 'wc_payments_disputes_hidden_columns', headers );

	const totalRows = disputesSummary.count || 0;

	const rows = disputes.map( ( dispute ) => {
		const onClickDisputeRow = (
			e: React.MouseEvent< HTMLAnchorElement >
		) => {
			// Use client-side routing to avoid page refresh.
			e.preventDefault();
			recordEvent( 'wcpay_disputes_row_action_click' );
			const history = getHistory();
			history.push( getDetailsURL( dispute.charge_id, 'transactions' ) );
		};
		const clickable = ( children: React.ReactNode ): JSX.Element => (
			<ClickableCell
				href={ getDetailsURL( dispute.charge_id, 'transactions' ) }
				onClick={ onClickDisputeRow }
			>
				{ children }
			</ClickableCell>
		);

		const detailsLink = (
			<DetailsLink
				id={ dispute.charge_id }
				parentSegment="transactions"
			/>
		);

		const reasonMapping = reasons[ dispute.reason ];
		const reasonDisplay = reasonMapping
			? reasonMapping.display
			: formatStringValue( dispute.reason );
		const needsResponse = isAwaitingResponse( dispute.status );
		const data: {
			[ key: string ]: {
				value: number | string;
				display: JSX.Element;
			};
		} = {
			amount: {
				value: formatExportAmount( dispute.amount, dispute.currency ),
				display: clickable(
					formatExplicitCurrency( dispute.amount, dispute.currency )
				),
			},
			currency: {
				value: dispute.currency,
				display: clickable( dispute.currency ),
			},
			status: {
				value: dispute.status,
				display: clickable(
					<DisputeStatusChip
						status={ dispute.status }
						dueBy={ dispute.due_by }
					/>
				),
			},
			reason: {
				value: reasonDisplay,
				display: clickable( reasonDisplay ),
			},
			source: {
				value: dispute.source ?? '',
				display: clickable(
					<span
						className={ `payment-method__brand payment-method__brand--${
							dispute.source ?? ''
						}` }
					/>
				),
			},
			created: {
				value: dispute.created,
				display: clickable(
					formatDateTimeFromString( dispute.created, {
						includeTime: true,
					} )
				),
			},
			dueBy: {
				value: dispute.due_by,
				display: clickable( smartDueDate( dispute ) ),
			},
			order: {
				value: dispute.order_number ?? '',
				display: <OrderLink order={ dispute.order } />,
			},
			customerName: {
				value: dispute.customer_name ?? '',
				display:
					dispute.order && dispute.order.customer_url ? (
						<Link href={ dispute.order.customer_url }>
							{ dispute.customer_name }
						</Link>
					) : (
						clickable( dispute.customer_name )
					),
			},
			customerEmail: {
				value: dispute.customer_email ?? '',
				display: clickable( dispute.customer_email ),
			},
			customerCountry: {
				value: dispute.customer_country ?? '',
				display: clickable( dispute.customer_country ),
			},
			details: { value: dispute.dispute_id, display: detailsLink },
			action: {
				value: '',
				display: (
					<Button
						variant={ needsResponse ? 'secondary' : 'tertiary' }
						href={ getDetailsURL(
							dispute.charge_id,
							'transactions'
						) }
						onClick={ onClickDisputeRow }
					>
						{ needsResponse
							? __( 'Respond', 'poocommerce-payments' )
							: __( 'See details', 'poocommerce-payments' ) }
					</Button>
				),
			},
		};
		return headers.map(
			( { key } ) => data[ key ] || { value: undefined, display: null }
		);
	} );

	const downloadable = !! rows.length;

	const endpointExport = async () => {
		// We destructure page and path to get the right params.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { page, path, ...params } = getQuery();
		const userEmail = wcpaySettings.currentUserEmail;

		const userLocale = wcpaySettings.userLocale.code;
		const {
			date_before: dateBefore,
			date_after: dateAfter,
			date_between: dateBetween,
			match,
			filter,
			status_is: statusIs,
			status_is_not: statusIsNot,
		} = getQuery();

		const isFiltered =
			!! dateBefore ||
			!! dateAfter ||
			!! dateBetween ||
			!! statusIs ||
			!! statusIsNot;

		const confirmThreshold = 1000;
		const confirmMessage = sprintf(
			__(
				"You are about to export %d disputes. If you'd like to reduce the size of your export, you can use one or more filters. Would you like to continue?",
				'poocommerce-payments'
			),
			totalRows
		);

		if (
			isFiltered ||
			totalRows < confirmThreshold ||
			window.confirm( confirmMessage )
		) {
			try {
				const {
					exported_disputes: exportedDisputes,
				} = await apiFetch< {
					/** The total number of disputes that will be exported in the CSV. */
					exported_disputes: number;
				} >( {
					path: getDisputesCSV( {
						userEmail,
						userLocale,
						dateAfter,
						dateBefore,
						dateBetween,
						match,
						filter,
						statusIs,
						statusIsNot,
					} ),
					method: 'POST',
				} );

				createNotice(
					'success',
					sprintf(
						__(
							'Your export will be emailed to %s',
							'poocommerce-payments'
						),
						userEmail
					)
				);

				recordEvent( 'wcpay_disputes_download', {
					exported_disputes: exportedDisputes,
					total_disputes: exportedDisputes,
					download_type: 'endpoint',
				} );
			} catch {
				createNotice(
					'error',
					__(
						'There was a problem generating your export.',
						'poocommerce-payments'
					)
				);
			}
		}
	};

	const onDownload = async () => {
		setIsDownloading( true );
		const title = __( 'Disputes', 'poocommerce-payments' );
		const downloadType = totalRows > rows.length ? 'endpoint' : 'browser';

		if ( 'endpoint' === downloadType ) {
			endpointExport();
		} else {
			const csvColumns = [
				{
					...headers[ 0 ],
					label: __( 'Dispute Id', 'poocommerce-payments' ),
				},
				...headers.slice( 1, -1 ), // Remove details (position 0)  and action (last position) column headers.
			];

			const csvRows = rows.map( ( row ) => {
				return [
					...row.slice( 0, 3 ), // Amount, Currency, Status.
					{
						// Reason.
						...row[ 3 ],
						value:
							disputeStatusMapping[ row[ 3 ].value ?? '' ]
								.message,
					},
					{
						// Source.
						...row[ 4 ],
						value: formatStringValue(
							( row[ 4 ].value ?? '' ).toString()
						),
					},
					...row.slice( 5, 10 ), // Order #, Customer, Email, Country.
					{
						// Disputed On.
						...row[ 10 ],
						value: formatDateTimeFromString(
							row[ 10 ].value as string
						),
					},
					{
						// Respond by.
						...row[ 11 ],
						value: formatDateTimeFromString(
							row[ 11 ].value as string,
							{
								includeTime: true,
							}
						),
					},
				];
			} );

			downloadCSVFile(
				generateCSVFileName( title, getQuery() ),
				generateCSVDataFromTable( csvColumns, csvRows )
			);

			recordEvent( 'wcpay_disputes_download', {
				exported_disputes: csvRows.length,
				total_disputes: disputesSummary.count,
				download_type: 'browser',
			} );
		}

		setIsDownloading( false );
	};

	let summary;
	const isDisputesSummaryDataLoaded =
		disputesSummary.count !== undefined && ! isSummaryLoading;
	if ( isDisputesSummaryDataLoaded ) {
		summary = [
			{
				label: _n(
					'dispute',
					'disputes',
					disputesSummary.count ?? 0,
					'poocommerce-payments'
				),
				value: `${ applyThousandSeparator(
					disputesSummary.count as number
				) }`,
			},
		];
	}

	const isCurrencyFiltered = 'string' === typeof getQuery().store_currency_is;

	const storeCurrencies =
		disputesSummary.currencies ||
		( isCurrencyFiltered ? [ getQuery().store_currency_is ?? '' ] : [] );

	return (
		<Page>
			<TestModeNotice currentPage="disputes" />
			<DisputesFilters storeCurrencies={ storeCurrencies } />
			<TableCard
				className="wcpay-disputes-list"
				title={ __( 'Disputes', 'poocommerce-payments' ) }
				isLoading={ isLoading }
				rowsPerPage={ parseInt( getQuery().per_page ?? '', 10 ) || 25 }
				totalRows={ totalRows }
				headers={ columnsToDisplay }
				rows={ rows }
				summary={ summary }
				query={ getQuery() }
				onQueryChange={ onQueryChange }
				onColumnsChange={ onColumnsChange }
				actions={ [
					downloadable && (
						<DownloadButton
							key="download"
							isDisabled={ isLoading || isDownloading }
							onClick={ onDownload }
						/>
					),
				] }
			/>
		</Page>
	);
};

export default DisputesList;
