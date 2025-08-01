/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import CheckmarkIcon from 'gridicons/dist/checkmark';
import ImageIcon from 'gridicons/dist/image';
import AddOutlineIcon from 'gridicons/dist/add-outline';
import TrashIcon from 'gridicons/dist/trash';

/**
 * Internal dependencies.
 */
import { BaseControl } from 'wcpay/components/wp-components-wrapped/components/base-control';
import { DropZone } from 'wcpay/components/wp-components-wrapped/components/drop-zone';
import { FormFileUpload } from 'wcpay/components/wp-components-wrapped/components/form-file-upload';
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import type { FileUploadControlProps } from 'wcpay/types/disputes';
import FileUploadError from './upload-error';
import FileUploadPreview from './preview';

export const FileUploadControl = ( {
	field,
	fileName,
	disabled,
	isDone,
	isLoading,
	accept,
	error,
	onFileChange,
	onFileRemove,
	help,
	showPreview,
	uploadButtonLabel,
	type = 'file',
}: FileUploadControlProps ): JSX.Element => {
	const hasError = ( error && 0 < error.length ) || false;

	const IconType = type === 'image' ? ImageIcon : AddOutlineIcon;
	const Icon = isDone && ! hasError ? CheckmarkIcon : IconType;

	const handleButtonClick = (
		event: React.MouseEvent< HTMLButtonElement >,
		openFileDialog: () => void
	) => {
		// Get file input next to the button element and clear it's value,
		// allowing to select the same file again in case of
		// connection or general error or just need to select it again.
		// This workaround is useful until we update @wordpress/components to a
		// version the supports this: https://github.com/WordPress/gutenberg/issues/39267
		const fileInput:
			| HTMLInputElement
			| null
			| undefined = ( event.target as HTMLButtonElement )
			.closest( '.components-form-file-upload' )
			?.querySelector( 'input[type="file"]' );

		if ( fileInput ) {
			fileInput.value = '';
		}

		openFileDialog();
	};

	return (
		<BaseControl
			id={ `form-file-upload-base-control-${ field.key }` }
			label={ field.label }
			help={ help }
			__nextHasNoMarginBottom
		>
			<DropZone
				onFilesDrop={ ( files: Array< File > ) =>
					onFileChange( field.key, files[ 0 ] )
				}
			/>
			<div className="file-upload">
				<FormFileUpload
					accept={ accept }
					onChange={ (
						event: React.ChangeEvent< HTMLInputElement >
					): void => {
						onFileChange(
							field.key,
							( event.target.files || new FileList() )[ 0 ]
						);
					} }
					render={ ( { openFileDialog } ) => (
						<Button
							id={ `form-file-upload-${ field.key }` }
							className={
								isDone && ! hasError ? 'is-success' : ''
							}
							isSecondary
							isDestructive={ hasError }
							isBusy={ isLoading }
							disabled={ disabled || isLoading }
							icon={ <Icon size={ 18 } /> }
							onClick={ (
								event: React.MouseEvent< HTMLButtonElement >
							) => handleButtonClick( event, openFileDialog ) }
						>
							{ uploadButtonLabel ||
								__( 'Upload file', 'poocommerce-payments' ) }
						</Button>
					) }
				></FormFileUpload>

				{ hasError ? (
					<FileUploadError error={ error } />
				) : (
					<FileUploadPreview
						fileName={ fileName }
						showPreview={ showPreview }
					/>
				) }

				{ isDone && ! disabled ? (
					<Button
						className="delete-uploaded-file-button"
						aria-label={ __(
							'Remove file',
							'poocommerce-payments'
						) }
						icon={ <TrashIcon size={ 18 } /> }
						onClick={ () => onFileRemove( field.key ) }
					/>
				) : null }
			</div>
		</BaseControl>
	);
};

// Hide upload button and show file name for cases like submitted dispute form
export const UploadedReadOnly = ( {
	field,
	fileName,
	showPreview,
}: FileUploadControlProps ): JSX.Element => {
	return (
		<BaseControl
			id={ `form-file-upload-base-control-${ field.key }` }
			label={ field.label }
			__nextHasNoMarginBottom
		>
			<FileUploadPreview
				fileName={
					fileName
						? `: ${ fileName }`
						: __(
								': Evidence file was not uploaded',
								'poocommerce-payments'
						  )
				}
				showPreview={ showPreview }
			/>
		</BaseControl>
	);
};
