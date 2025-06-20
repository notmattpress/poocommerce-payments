/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import FileUploadControl from './file-upload-control';

interface DocumentField {
	key: string;
	label: string;
	fileName?: string;
	onFileChange: ( key: string, file: File ) => Promise< void >;
	onFileRemove: () => Promise< void >;
	uploaded?: boolean;
	readOnly?: boolean;
	isBusy?: boolean;
}

interface RecommendedDocumentsProps {
	fields: DocumentField[];
	readOnly?: boolean;
}

const RecommendedDocuments: React.FC< RecommendedDocumentsProps > = ( {
	fields,
	readOnly = false,
} ) => {
	return (
		<section className="wcpay-dispute-evidence-recommended-documents">
			<h3 className="wcpay-dispute-evidence-recommended-documents__heading">
				{ __( 'Recommended documents', 'poocommerce-payments' ) }
			</h3>
			<div className="wcpay-dispute-evidence-recommended-documents__subheading">
				{ __(
					'We recommend providing the following documents. All fields are optional.',
					'poocommerce-payments'
				) }
			</div>
			<ul className="wcpay-dispute-evidence-recommended-documents__list">
				{ fields.map( ( field ) => (
					<li
						key={ field.key }
						className="wcpay-dispute-evidence-recommended-documents__item"
					>
						<FileUploadControl
							label={ field.label }
							fileName={ field.fileName || '' }
							onFileChange={ async ( file: File ) =>
								field.onFileChange( field.key, file )
							}
							onFileRemove={ async () => field.onFileRemove() }
							disabled={ readOnly || field.readOnly }
							isDone={ !! field.uploaded }
							isBusy={ field.isBusy }
							accept={ '.pdf, image/png, image/jpeg' }
						/>
					</li>
				) ) }
			</ul>
		</section>
	);
};

export default RecommendedDocuments;
