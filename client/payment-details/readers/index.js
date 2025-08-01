/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { Card } from 'wcpay/components/wp-components-wrapped/components/card';
import { CardBody } from 'wcpay/components/wp-components-wrapped/components/card-body';
import { getQuery } from '@poocommerce/navigation';
import {
	downloadCSVFile,
	generateCSVDataFromTable,
	generateCSVFileName,
} from '@poocommerce/csv-export';
import { TableCard } from '@poocommerce/components';

/**
 * Internal dependencies
 */
import { useCardReaderStats } from 'wcpay/data';
import { TestModeNotice } from 'components/test-mode-notice';
import Page from 'components/page';
import DownloadButton from 'components/download-button';
import {
	formatExplicitCurrency,
	formatExportAmount,
} from 'multi-currency/interface/functions';

const PaymentCardReaderChargeDetails = ( props ) => {
	const { readers, chargeError, isLoading } = useCardReaderStats(
		props.chargeId,
		props.transactionId
	);

	// Check instance of chargeError because its default value is empty object
	if ( ! isLoading && chargeError instanceof Error ) {
		return (
			<Page maxWidth={ 1032 } className="wcpay-payment-details">
				<TestModeNotice currentPage="payments" isDetailsView={ true } />
				<Card>
					<CardBody>
						{ __(
							'Readers details not loaded',
							'poocommerce-payments'
						) }
					</CardBody>
				</Card>
			</Page>
		);
	}

	return (
		<RenderPaymentCardReaderChargeDetails
			readers={ readers }
			isLoading={ isLoading }
		/>
	);
};

const RenderPaymentCardReaderChargeDetails = ( props ) => {
	const readers = props.readers;
	const isLoading = props.isLoading;

	const headers = [
		{
			key: 'reader_id',
			label: __( 'Reader id', 'poocommerce-payments' ),
			visible: true,
			isLeftAligned: true,
		},
		{
			key: 'status',
			label: __( 'Status', 'poocommerce-payments' ),
			visible: true,
			isLeftAligned: true,
		},
		{
			key: 'count',
			label: __( 'Transactions', 'poocommerce-payments' ),
			visible: true,
			isLeftAligned: true,
		},
		{
			key: 'fee',
			label: __( 'Fee', 'poocommerce-payments' ),
			visible: true,
			isLeftAligned: true,
		},
	];

	const rows =
		readers.length > 0
			? readers.map( ( reader ) => {
					return [
						{
							value: reader.reader_id,
							display: reader.reader_id,
						},
						{
							value: reader.status,
							display: reader.status,
						},
						{
							value: reader.count,
							display: reader.count,
						},
						{
							value: reader.fee
								? formatExportAmount(
										reader.fee.amount,
										reader.fee.currency
								  )
								: 0,
							display: reader.fee
								? formatExplicitCurrency(
										reader.fee.amount,
										reader.fee.currency
								  )
								: 0,
						},
					];
			  } )
			: [];

	const onDownload = () => {
		// We destructure page and path to get the right params.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { page, path, ...params } = getQuery();

		downloadCSVFile(
			generateCSVFileName( 'Card Readers', params ),
			generateCSVDataFromTable( headers, rows )
		);
	};

	const downloadable = !! rows.length;
	return (
		<Page maxWidth={ 1032 } className="wcpay-payment-details">
			<TestModeNotice currentPage="payments" isDetailsView={ true } />
			<TableCard
				className="transactions-list poocommerce-report-table has-search"
				title={ __( 'Card readers', 'poocommerce-payments' ) }
				isLoading={ isLoading }
				rowsPerPage={ parseInt( getQuery().per_page ?? '', 10 ) || 25 }
				totalRows={ rows.length }
				headers={ headers }
				rows={ rows }
				actions={ [
					downloadable && (
						<DownloadButton
							key="download"
							isDisabled={ isLoading }
							onClick={ onDownload }
						/>
					),
				] }
			/>
		</Page>
	);
};

export default PaymentCardReaderChargeDetails;
