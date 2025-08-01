/**
 * External dependencies
 */
import { BaseControl } from 'wcpay/components/wp-components-wrapped/components/base-control';
import { Notice } from 'wcpay/components/wp-components-wrapped/components/notice';
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from 'react';

/**
 * Internal dependencies
 */
import {
	useAccountBusinessSupportPhone,
	useGetSavingError,
	useTestModeOnboarding,
} from 'wcpay/data';
import PhoneNumberInput from 'wcpay/settings/phone-input';

const SupportPhoneInput = ( { setInputVallid } ) => {
	const [ supportPhone, setSupportPhone ] = useAccountBusinessSupportPhone();

	let supportPhoneError = useGetSavingError()?.data?.details
		?.account_business_support_phone?.message;

	const currentPhone = useRef( supportPhone ).current;
	const isEmptyPhoneValid = supportPhone === '' && currentPhone === '';
	const isTestModeOnboarding = useTestModeOnboarding();
	const isTestPhoneValid =
		isTestModeOnboarding && supportPhone === '+10000000000';

	const [ isPhoneValid, setPhoneValidity ] = useState( true );
	if ( supportPhone === '' ) {
		supportPhoneError = __(
			'Support phone number cannot be empty.',
			'poocommerce-payments'
		);
	}
	if ( ! isTestPhoneValid && ! isPhoneValid && ! isEmptyPhoneValid ) {
		supportPhoneError = __(
			'Please enter a valid phone number.',
			'poocommerce-payments'
		);
	}

	if ( supportPhone === '' && currentPhone !== '' ) {
		supportPhoneError = __(
			'Support phone number cannot be empty once it has been set before, please specify.',
			'poocommerce-payments'
		);
	}

	useEffect( () => {
		if ( setInputVallid ) {
			setInputVallid( ! supportPhoneError );
		}
	}, [ supportPhoneError, setInputVallid ] );

	let labelText = __( 'Support phone number', 'poocommerce-payments' );
	if ( isTestModeOnboarding ) {
		labelText += __(
			' (+1 0000000000 can be used for test accounts)',
			'poocommerce-payments'
		);
	}
	return (
		<>
			{ supportPhoneError && (
				<Notice status="error" isDismissible={ false }>
					<span>{ supportPhoneError }</span>
				</Notice>
			) }
			<BaseControl
				className="settings__account-business-support-phone-input no-top-margin"
				help={ __(
					'This may be visible on receipts, invoices, and automated emails from your store.',
					'poocommerce-payments'
				) }
				label={ labelText }
				id="account-business-support-phone-input"
				__nextHasNoMarginBottom
			>
				<PhoneNumberInput
					onValueChange={ setSupportPhone }
					value={ supportPhone }
					onValidationChange={ setPhoneValidity }
					inputProps={ {
						ariaLabel: labelText,
					} }
				/>
			</BaseControl>
		</>
	);
};

export default SupportPhoneInput;
