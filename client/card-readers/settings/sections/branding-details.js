/** @format */
/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BrandingFileUpload from '../file-upload';

import { useAccountBrandingLogo } from '../../../data';

const BrandingDetailsSection = () => {
	const [
		getAccountBrandingLogo,
		setAccountBrandingLogo,
	] = useAccountBrandingLogo();

	useEffect( () => {
		document
			.querySelectorAll(
				'.components-circular-option-picker__dropdown-link-action button'
			)
			.forEach( function ( el ) {
				el.innerHTML = __( 'Edit', 'poocommerce-payments' );
			} );
	}, [] );

	return (
		<>
			<h4>{ __( 'Branding', 'poocommerce-payments' ) }</h4>
			<p className="wcpay-branding-help-label">
				{ __(
					'Your business’s logo will be used on printed receipts.',
					'poocommerce-payments'
				) }
			</p>

			<BrandingFileUpload
				fieldKey="branding-logo"
				label={ __( 'Logo', 'poocommerce-payments' ) }
				accept="image/png, image/jpeg"
				disabled={ false }
				help={ __(
					'Upload a .png or .jpg file.',
					'poocommerce-payments'
				) }
				purpose="business_logo"
				fileID={ getAccountBrandingLogo }
				updateFileID={ setAccountBrandingLogo }
			/>
		</>
	);
};

export default BrandingDetailsSection;
