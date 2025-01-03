/** @format */
/**
 * External dependencies
 */
import { React, useLayoutEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { TextControl, Notice } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useAccountBusinessName, useAccountBusinessURL } from '../../../data';

const BusinessDetailsSection = ( { setInputsValid } ) => {
	const [ hasError, setHasError ] = useState( false );

	const [
		accountBusinessName,
		setAccountBusinessName,
	] = useAccountBusinessName();

	const [
		accountBusinessURL,
		setAccountBusinessURL,
	] = useAccountBusinessURL();

	useLayoutEffect( () => {
		const businessUrl = document.querySelector(
			'.card-readers-business-url-input input'
		);
		businessUrl.focus();
		businessUrl.blur();
	}, [] );

	const validateBusinessURL = ( event ) => {
		if ( event.target.checkValidity() ) {
			setHasError( false );
			setInputsValid( true );
		} else {
			setHasError( true );
			setInputsValid( false );
		}
	};

	return (
		<>
			<h4>{ __( 'Business details', 'poocommerce-payments' ) }</h4>
			<TextControl
				className="card-readers-business-name-input"
				label={ __( 'Business name', 'poocommerce-payments' ) }
				value={ accountBusinessName }
				onChange={ setAccountBusinessName }
			/>
			{ hasError && (
				<Notice status="error" isDismissible={ false }>
					<span>
						{ __(
							'Error: Invalid business URL, should start with http:// or https:// prefix.',
							'poocommerce-payments'
						) }
					</span>
				</Notice>
			) }
			<TextControl
				className="card-readers-business-url-input"
				label={ __( 'Business URL', 'poocommerce-payments' ) }
				value={ accountBusinessURL }
				onChange={ setAccountBusinessURL }
				onBlur={ validateBusinessURL }
				type="url"
			/>
		</>
	);
};

export default BusinessDetailsSection;
