/** @format */
/**
 * External dependencies
 */
import React from 'react';
import { recordEvent } from 'tracks';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import TrashIcon from 'gridicons/dist/trash';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import { BaseControl } from 'wcpay/components/wp-components-wrapped/components/base-control';
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { FileUploadControl } from 'wcpay/components/file-upload';

interface WooPayFileUploadProps {
	fieldKey: string;
	label: string;
	accept: string;
	disabled?: boolean;
	help?: string;
	purpose: string;
	fileID: string;
	updateFileID: ( id: string ) => void;
}

const WooPayFileUpload: React.FunctionComponent< WooPayFileUploadProps > = ( {
	fieldKey,
	label,
	accept,
	disabled,
	help,
	purpose,
	fileID,
	updateFileID,
} ) => {
	const [ isLoading, setLoading ] = useState( false );
	const [ uploadError, setUploadError ] = useState< boolean | string >(
		false
	);

	const { createErrorNotice } = useDispatch( 'core/notices' );

	const fileSizeExceeded = ( size: number ) => {
		const fileSizeLimitInBytes = 510000;
		if ( fileSizeLimitInBytes < size ) {
			createErrorNotice(
				__(
					'The file you have attached is exceeding the maximum limit.',
					'poocommerce-payments'
				)
			);

			return true;
		}
	};

	const handleFileChange = async ( key: string, file: File ) => {
		if ( ! file ) {
			return;
		}

		if ( fileSizeExceeded( file.size ) ) {
			return;
		}

		setLoading( true );

		recordEvent( 'wcpay_merchant_settings_file_upload_started', {
			type: key,
		} );

		const body = new FormData();
		body.append( 'file', file );
		body.append( 'purpose', purpose );

		try {
			const uploadedFile: unknown = await apiFetch( {
				path: '/wc/v3/payments/file',
				method: 'post',
				body,
			} );

			if ( uploadedFile ) {
				// Store uploaded file ID.
				updateFileID( ( uploadedFile as any ).id );
			}

			setLoading( false );
			setUploadError( false );

			recordEvent( 'wcpay_merchant_settings_file_upload_success', {
				type: key,
			} );
		} catch ( { err } ) {
			recordEvent( 'wcpay_merchant_settings_upload_failed', {
				message: ( err as Error ).message,
			} );

			// Remove file ID
			updateFileID( '' );

			setLoading( false );
			setUploadError( ( err as Error ).message || '' );

			// Show error notice
			createErrorNotice( ( err as Error ).message );
		}
	};

	const handleFileRemove = () => {
		updateFileID( '' );

		setLoading( false );
		setUploadError( false );
	};

	const openFileDialog = ( event: React.MouseEvent< HTMLButtonElement > ) => {
		const fileInput:
			| HTMLInputElement
			| null
			| undefined = ( event.target as HTMLButtonElement )
			.closest( '.woopay-settings__update-store-logo' )
			?.querySelector( 'input[type="file"]' );

		fileInput?.click();
	};

	const isDone = ( ! isLoading && fileID && 0 < fileID.length ) as boolean;
	const error = ( uploadError || '' ) as string;

	return (
		<div className="wcpay-branding-upload-field__wrapper">
			<div
				className={ clsx(
					'woopay-settings__update-store-logo',
					fileID && 'has-file'
				) }
			>
				<FileUploadControl
					field={ {
						key: fieldKey,
						label: label,
					} }
					fileName={ fileID }
					isLoading={ isLoading }
					accept={ accept }
					disabled={ disabled }
					isDone={ false }
					error={ error }
					onFileChange={ handleFileChange }
					onFileRemove={ handleFileRemove }
					showPreview={ true }
					type="image"
					uploadButtonLabel={ __(
						'Upload custom logo',
						'poocommerce-payments'
					) }
				/>

				<div
					style={ {
						display: 'flex',
						alignItems: 'center',
					} }
				>
					{ isDone && (
						<>
							<Button onClick={ openFileDialog } isLink>
								{ __( 'Replace', 'poocommerce-payments' ) }
							</Button>
							<Button
								className="delete-uploaded-file-button"
								aria-label={ __(
									'Remove file',
									'poocommerce-payments'
								) }
								icon={ <TrashIcon size={ 18 } /> }
								onClick={ handleFileRemove }
							/>
						</>
					) }
				</div>
			</div>

			<BaseControl id="test" help={ help } __nextHasNoMarginBottom>
				{ ' ' }
			</BaseControl>
		</div>
	);
};

export default WooPayFileUpload;
