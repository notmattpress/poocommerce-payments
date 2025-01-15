/** @format **/

/**
 * External dependencies
 */
import React, { useState } from 'react';
import { recordEvent } from 'tracks';
import { useMemo } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { TableCard, Link } from '@poocommerce/components';
import { onQueryChange, getQuery } from '@poocommerce/navigation';
import {
	downloadCSVFile,
	generateCSVDataFromTable,
	generateCSVFileName,
} from '@poocommerce/csv-export';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { parseInt } from 'lodash';

/**
 * Internal dependencies.
 */
import type { DepositsTableHeader } from 'wcpay/types/deposits';
import { useDeposits, useDepositsSummary } from 'wcpay/data';
import { useReportingExportLanguage } from 'data/index';
import { displayType, depositStatusLabels } from '../strings';
import {
	formatExplicitCurrency,
	formatExportAmount,
} from 'multi-currency/interface/functions';
import DetailsLink, { getDetailsURL } from 'components/details-link';
import ClickableCell from 'components/clickable-cell';
import Page from '../../components/page';
import DepositsFilters from '../filters';
import DownloadButton from 'components/download-button';
import { getDepositsCSV } from 'wcpay/data/deposits/resolvers';
import { applyThousandSeparator } from '../../utils/index.js';
import DepositStatusChip from 'components/deposit-status-chip';
import {
	isExportModalDismissed,
	getExportLanguage,
	isDefaultSiteLanguage,
} from 'utils';
import CSVExportModal from 'components/csv-export-modal';
import { ReportingExportLanguageHook } from 'wcpay/settings/reporting-settings/interfaces';

import './style.scss';
import { formatDateTimeFromString } from 'wcpay/utils/date-time';

const getColumns = ( sortByDate?: boolean ): DepositsTableHeader[] => [
	{
		key: 'details',
		label: '',
		required: true,
		cellClassName: 'info-button ' + ( sortByDate ? 'is-sorted' : '' ),
		isLeftAligned: true,
	},
	{
		key: 'date',
		label: __( 'Date', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Date', 'poocommerce-payments' ),
		required: true,
		isLeftAligned: true,
		defaultOrder: 'desc',
		cellClassName: 'date-time',
		isSortable: true,
		defaultSort: true,
	},
	{
		key: 'type',
		label: __( 'Type', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Type', 'poocommerce-payments' ),
		required: true,
		isLeftAligned: true,
	},
	{
		key: 'amount',
		label: __( 'Amount', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Amount', 'poocommerce-payments' ),
		isNumeric: true,
		required: true,
		isSortable: true,
	},
	{
		key: 'status',
		label: __( 'Status', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Status', 'poocommerce-payments' ),
		required: true,
		isLeftAligned: true,
	},
	// TODO { key: 'transactions', label: __( 'Transactions', 'poocommerce-payments' ), isNumeric: true },
	{
		key: 'bankAccount',
		label: __( 'Bank account', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Bank account', 'poocommerce-payments' ),
		isLeftAligned: true,
	},
	{
		key: 'bankReferenceId',
		label: __( 'Bank reference ID', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Bank reference ID', 'poocommerce-payments' ),
	},
];

export const DepositsList = (): JSX.Element => {
	const [
		exportLanguage,
	] = useReportingExportLanguage() as ReportingExportLanguageHook;

	const [ isDownloading, setIsDownloading ] = useState( false );
	const { createNotice } = useDispatch( 'core/notices' );
	const { deposits, isLoading } = useDeposits( getQuery() );
	const { depositsSummary, isLoading: isSummaryLoading } = useDepositsSummary(
		getQuery()
	);

	const [ isCSVExportModalOpen, setCSVExportModalOpen ] = useState( false );

	const sortByDate = ! getQuery().orderby || 'date' === getQuery().orderby;
	const columns = useMemo( () => getColumns( sortByDate ), [ sortByDate ] );
	const totalRows = depositsSummary.count || 0;

	const rows = deposits.map( ( deposit ) => {
		const clickable = ( children: React.ReactNode ): JSX.Element => (
			<ClickableCell
				href={ getDetailsURL( deposit.id, 'payouts' ) }
				onClick={ () => recordEvent( 'wcpay_deposits_row_click' ) }
			>
				{ children }
			</ClickableCell>
		);
		const detailsLink = (
			<DetailsLink id={ deposit.id } parentSegment="payouts" />
		);

		const dateDisplay = (
			<Link
				href={ getDetailsURL( deposit.id, 'payouts' ) }
				onClick={ () => recordEvent( 'wcpay_deposits_row_click' ) }
			>
				{ formatDateTimeFromString( deposit.date ) }
			</Link>
		);

		// Map deposit to table row.
		const data = {
			details: { value: deposit.id, display: detailsLink },
			date: { value: deposit.date, display: dateDisplay },
			type: {
				value: displayType[ deposit.type ],
				display: clickable( displayType[ deposit.type ] ),
			},
			amount: {
				value: formatExportAmount( deposit.amount, deposit.currency ),
				display: clickable(
					formatExplicitCurrency( deposit.amount, deposit.currency )
				),
			},
			status: {
				value: depositStatusLabels[ deposit.status ],
				display: clickable( <DepositStatusChip deposit={ deposit } /> ),
			},
			bankAccount: {
				value: deposit.bankAccount,
				display: clickable( deposit.bankAccount ),
			},
			bankReferenceId: {
				value: deposit.bank_reference_key,
				display: clickable( deposit.bank_reference_key ?? 'N/A' ),
			},
		};

		return columns.map( ( { key } ) => data[ key ] || { display: null } );
	} );

	const isCurrencyFiltered = 'string' === typeof getQuery().store_currency_is;
	const isSingleCurrency =
		2 > ( depositsSummary.store_currencies || [] ).length;

	// initializing summary with undefined as we don't want to render the TableSummary component unless we have the data
	let summary;
	const isDespositsSummaryDataLoaded =
		depositsSummary.count !== undefined &&
		depositsSummary.total !== undefined &&
		false === isSummaryLoading;

	// Generate summary only if the data has been loaded
	if ( isDespositsSummaryDataLoaded ) {
		summary = [
			{
				label: _n(
					'payout',
					'payouts',
					depositsSummary.count,
					'poocommerce-payments'
				),
				value: `${ applyThousandSeparator(
					depositsSummary.count as number
				) }`,
			},
		];

		if ( isSingleCurrency || isCurrencyFiltered ) {
			summary.push( {
				label: __( 'total', 'poocommerce-payments' ),
				value: `${ formatExplicitCurrency(
					depositsSummary.total,
					depositsSummary.currency
				) }`,
			} );
		}
	}

	const storeCurrencies =
		depositsSummary.store_currencies ||
		( isCurrencyFiltered ? [ getQuery().store_currency_is ] : [] );

	const title = __( 'Payouts', 'poocommerce-payments' );

	const downloadable = !! rows.length;

	const endpointExport = async ( language: string ) => {
		// We destructure page and path to get the right params.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { page, path, ...params } = getQuery();
		const userEmail = wcpaySettings.currentUserEmail;
		const locale = getExportLanguage( language, exportLanguage );

		const {
			date_before: dateBefore,
			date_after: dateAfter,
			date_between: dateBetween,
			match,
			status_is: statusIs,
			status_is_not: statusIsNot,
			store_currency_is: storeCurrencyIs,
		} = getQuery();

		const isFiltered =
			!! dateBefore ||
			!! dateAfter ||
			!! dateBetween ||
			!! statusIs ||
			!! statusIsNot ||
			!! storeCurrencyIs;

		const confirmThreshold = 1000;
		const confirmMessage = sprintf(
			__(
				"You are about to export %d deposits. If you'd like to reduce the size of your export, you can use one or more filters. Would you like to continue?",
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
				const { exported_deposits: exportedDeposits } = await apiFetch(
					{
						path: getDepositsCSV( {
							userEmail,
							locale,
							dateAfter,
							dateBefore,
							dateBetween,
							match,
							statusIs,
							statusIsNot,
							storeCurrencyIs,
						} ),
						method: 'POST',
					}
				);

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

				recordEvent( 'wcpay_deposits_download', {
					exported_deposits: exportedDeposits,
					total_deposits: exportedDeposits,
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
		const downloadType = totalRows > rows.length ? 'endpoint' : 'browser';

		if ( 'endpoint' === downloadType ) {
			if ( ! isDefaultSiteLanguage() && ! isExportModalDismissed() ) {
				setCSVExportModalOpen( true );
			} else {
				endpointExport( '' );
			}
		} else {
			const params = getQuery();

			const csvColumns = [
				{
					...columns[ 0 ],
					label: __( 'Payout Id', 'poocommerce-payments' ),
				},
				...columns.slice( 1 ),
			];

			const csvRows = rows.map( ( row ) => [
				row[ 0 ],
				{
					...row[ 1 ],
					value: formatDateTimeFromString( row[ 1 ].value as string ),
				},
				...row.slice( 2 ),
			] );

			downloadCSVFile(
				generateCSVFileName( title, params ),
				generateCSVDataFromTable( csvColumns, csvRows )
			);

			recordEvent( 'wcpay_deposits_download', {
				exported_deposits: rows.length,
				total_deposits: depositsSummary.count,
				download_type: 'browser',
			} );
		}

		setIsDownloading( false );
	};

	const closeModal = () => {
		setCSVExportModalOpen( false );
	};

	const exportDeposits = ( language: string ) => {
		endpointExport( language );

		closeModal();
	};

	return (
		<Page>
			<DepositsFilters storeCurrencies={ storeCurrencies } />
			<TableCard
				className="wcpay-deposits-list poocommerce-report-table"
				title={ __( 'Payout history', 'poocommerce-payments' ) }
				isLoading={ isLoading }
				rowsPerPage={ parseInt( getQuery().per_page ?? '' ) || 25 }
				totalRows={ totalRows }
				headers={ columns }
				rows={ rows }
				summary={ summary }
				query={ getQuery() }
				onQueryChange={ onQueryChange }
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
			{ ! isDefaultSiteLanguage() &&
				! isExportModalDismissed() &&
				isCSVExportModalOpen && (
					<CSVExportModal
						onClose={ closeModal }
						onSubmit={ exportDeposits }
						totalItems={ totalRows }
						exportType={ 'deposits' }
					/>
				) }
		</Page>
	);
};

export default DepositsList;
