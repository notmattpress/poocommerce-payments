/** @format **/

/**
 * External dependencies
 */
import React, { useCallback, useEffect, useState } from 'react';
import { __, _n, sprintf } from '@wordpress/i18n';
import { TableCard, TableCardColumn } from '@poocommerce/components';
import { onQueryChange, getQuery } from '@poocommerce/navigation';
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';

/**
 * Internal dependencies
 */
import { displayType } from 'documents/strings';
import { Document, useDocuments, useDocumentsSummary } from 'data/index';
import './style.scss';
import DocumentsFilters from '../filters';
import Page from '../../components/page';
import { getDocumentUrl } from 'wcpay/utils';
import VatFormModal from 'wcpay/vat/form-modal';
import { formatDateTimeFromString } from 'wcpay/utils/date-time';
import { usePersistedColumnVisibility } from 'wcpay/hooks/use-persisted-table-column-visibility';

interface Column extends TableCardColumn {
	key: 'date' | 'type' | 'description' | 'download';
	visible?: boolean;
	cellClassName?: string;
}

const getColumns = (): Column[] =>
	[
		{
			key: 'date',
			label: __( 'Date', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Date and time', 'poocommerce-payments' ),
			required: true,
			isLeftAligned: true,
			defaultOrder: 'desc',
			cellClassName: 'date',
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
			key: 'description',
			label: __( 'Description', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Description', 'poocommerce-payments' ),
		},
		{
			key: 'download',
			label: __( 'Download', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Download', 'poocommerce-payments' ),
			isLeftAligned: false,
			isNumeric: true,
		},
	].filter( Boolean ) as Column[]; // We explicitly define the type because TypeScript can't infer the type post-filtering.

const getDocumentDescription = ( document: Document ) => {
	switch ( document.type ) {
		case 'vat_invoice':
			if ( document.period_from && document.period_to ) {
				return sprintf(
					__( 'Tax invoice for %s to %s', 'poocommerce-payments' ),
					formatDateTimeFromString( document.period_from ),
					formatDateTimeFromString( document.period_to )
				);
			}
			return __(
				'Tax invoice without proper period dates',
				'poocommerce-payments'
			);

		default:
			return __( 'Unknown document type', 'poocommerce-payments' );
	}
};

export const DocumentsList = (): JSX.Element => {
	const { documents, isLoading } = useDocuments( getQuery() );
	const {
		documentsSummary,
		isLoading: isSummaryLoading,
	} = useDocumentsSummary( getQuery() );

	const [ isVatFormModalOpen, setVatFormModalOpen ] = useState( false );

	const [
		interruptedDownloadDocument,
		setInterruptedDownloadDocument,
	] = useState< {
		documentId: Document[ 'document_id' ];
		type: Document[ 'type' ];
		newTab: boolean;
	} | null >( null );

	const handleDocumentDownload = (
		documentId: Document[ 'document_id' ],
		type: Document[ 'type' ],
		newTab: boolean
	): boolean => {
		setInterruptedDownloadDocument( { documentId, type, newTab } );

		if ( 'vat_invoice' === type ) {
			if ( ! wcpaySettings.accountStatus.hasSubmittedVatData ) {
				setVatFormModalOpen( true );
				return false;
			}
		}

		return true;
	};

	const downloadDocument = useCallback(
		(
			documentId: Document[ 'document_id' ],
			type: Document[ 'type' ],
			newTab = true
		) => {
			const url = getDocumentUrl( documentId );
			if ( handleDocumentDownload( documentId, type, newTab ) ) {
				window.open( url, newTab ? '_blank' : '_self' );
			}
		},
		[]
	);

	const onVatFormCompleted = () => {
		setVatFormModalOpen( false );
		// Set the flag to true so that the user can download the document without refreshing the page.
		wcpaySettings.accountStatus.hasSubmittedVatData = true;
		// Attempt to download the previous document, once the VAT details have been submitted.
		if ( interruptedDownloadDocument ) {
			downloadDocument(
				interruptedDownloadDocument.documentId,
				interruptedDownloadDocument.type,
				interruptedDownloadDocument.newTab
			);
		}
	};

	// Check if the page view is requesting a specific document and trigger its download.
	const {
		document_id: requestedDocumentID,
		document_type: requestedDocumentType,
	} = getQuery();

	useEffect( () => {
		if ( requestedDocumentID && requestedDocumentType ) {
			downloadDocument(
				requestedDocumentID,
				requestedDocumentType as Document[ 'type' ],
				false
			);
		}
	}, [ requestedDocumentID, requestedDocumentType, downloadDocument ] );

	const columns = getColumns();

	const { columnsToDisplay, onColumnsChange } = usePersistedColumnVisibility<
		Column
	>( 'wc_payments_documents_hidden_columns', columns );

	const totalRows = documentsSummary.count || 0;
	const rows = documents.map( ( document: Document ) => {
		const documentType =
			displayType[ document.type ] ??
			__( 'Unknown document type', 'poocommerce-payments' );
		// Map document into table row.
		const data = {
			date: {
				value: document.date,
				display: formatDateTimeFromString( document.date ),
			},
			type: {
				value: documentType,
				display: documentType,
			},
			description: {
				value: getDocumentDescription( document ),
				display: getDocumentDescription( document ),
			},
			download: {
				value: getDocumentUrl( document.document_id ),
				display: (
					<Button
						className="documents-list__download-button"
						variant="link"
						onClick={ () =>
							downloadDocument(
								document.document_id,
								document.type
							)
						}
					>
						{ __( 'Download', 'poocommerce-payments' ) }
					</Button>
				),
			},
		};

		return columnsToDisplay.map(
			( { key } ) => data[ key ] || { display: null }
		);
	} );

	const title = __( 'Documents', 'poocommerce-payments' );

	// initializing summary with undefined as we don't want to render the TableSummary component unless we have the data
	let summary;
	const isDocumentsSummaryDataLoaded =
		documentsSummary.count !== undefined && false === isSummaryLoading;

	// Generate summary only if the data has been loaded
	if ( isDocumentsSummaryDataLoaded ) {
		summary = [
			{
				label: _n(
					'document',
					'documents',
					// We've already checked that `.count` is not undefined, but TypeScript doesn't detect
					// that so we remove the `undefined` in the type manually.
					documentsSummary.count as number,
					'poocommerce-payments'
				),
				value: `${ documentsSummary.count }`,
			},
		];
	}

	return (
		<Page>
			<DocumentsFilters />
			<TableCard
				className="documents-list poocommerce-report-table has-search"
				title={ title }
				isLoading={ isLoading }
				rowsPerPage={ parseInt( getQuery().per_page ?? '', 10 ) || 25 }
				totalRows={ totalRows }
				headers={ columnsToDisplay }
				rows={ rows }
				summary={ summary }
				query={ getQuery() }
				onQueryChange={ onQueryChange }
				onColumnsChange={ onColumnsChange }
				actions={ [] }
			/>
			<VatFormModal
				isModalOpen={ isVatFormModalOpen }
				setModalOpen={ setVatFormModalOpen }
				onCompleted={ onVatFormCompleted }
			/>
		</Page>
	);
};

export default DocumentsList;
