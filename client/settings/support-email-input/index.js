/**
 * External dependencies
 */
import { TextControl, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useAccountBusinessSupportEmail, useGetSavingError } from 'wcpay/data';
import { useEffect, useRef } from 'react';

const SupportEmailInput = ( { setInputVallid } ) => {
	const [ supportEmail, setSupportEmail ] = useAccountBusinessSupportEmail();

	let supportEmailError = useGetSavingError()?.data?.details
		?.account_business_support_email?.message;

	const currentEmail = useRef( supportEmail ).current;
	if ( supportEmail === '' && currentEmail !== '' ) {
		supportEmailError = __(
			'Support email cannot be empty once it has been set before, please specify.',
			'poocommerce-payments'
		);
	}

	useEffect( () => {
		if ( setInputVallid ) {
			setInputVallid( ! supportEmailError );
		}
	}, [ supportEmailError, setInputVallid ] );

	return (
		<>
			{ supportEmailError && (
				<Notice status="error" isDismissible={ false }>
					<span>{ supportEmailError }</span>
				</Notice>
			) }

			<TextControl
				className="settings__account-business-support-email-input"
				help={ __(
					'This may be visible on receipts, invoices, and automated emails from your store.',
					'poocommerce-payments'
				) }
				label={ __( 'Support email', 'poocommerce-payments' ) }
				value={ supportEmail }
				onChange={ setSupportEmail }
				data-testid={ 'account-business-support-email-input' }
			/>
		</>
	);
};

export default SupportEmailInput;
