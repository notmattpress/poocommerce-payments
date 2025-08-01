/** @format */
/**
 * External dependencies
 */
import React, { useState } from 'react';
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useGetSettings, useSettings } from '../../data';
import { recordEvent } from '../../tracks';
import SettingsSection from '../settings-section';
import './style.scss';
import WooPayDisableFeedback from '../woopay-disable-feedback';

const SaveSettingsSection = ( { disabled = false } ) => {
	const { saveSettings, isSaving, isLoading, isDirty } = useSettings();
	const settings = useGetSettings();

	// Keep the inital value of is_payment_request_enabled
	// in state for recording its track on change.
	const [
		initialIsPaymentRequestEnabled,
		setInitialIsPaymentRequestEnabled,
	] = useState( null );
	// Keep the inital value of is_woopay_enabled
	// in state for showing the feedback modal on change.
	const [ initialIsWooPayEnabled, setInitialIsWooPayEnabled ] = useState(
		null
	);
	const [
		isWooPayDisableFeedbackOpen,
		setIsWooPayDisableFeedbackOpen,
	] = useState( false );

	if (
		initialIsPaymentRequestEnabled === null &&
		settings &&
		typeof settings.is_payment_request_enabled !== 'undefined'
	) {
		setInitialIsPaymentRequestEnabled(
			settings.is_payment_request_enabled
		);
	}

	if (
		initialIsWooPayEnabled === null &&
		settings &&
		typeof settings.is_woopay_enabled !== 'undefined'
	) {
		setInitialIsWooPayEnabled( settings.is_woopay_enabled );
	}

	const saveOnClick = async () => {
		const isSuccess = await saveSettings();

		if ( ! isSuccess ) {
			return;
		}

		// Track the event when the value changed and the
		// settings were successfully saved.
		if (
			initialIsPaymentRequestEnabled !==
			settings.is_payment_request_enabled
		) {
			recordEvent( 'wcpay_payment_request_settings_change', {
				enabled: settings.is_payment_request_enabled ? 'yes' : 'no',
			} );

			// Update the "initial" value to properly track consecutive saves.
			setInitialIsPaymentRequestEnabled(
				settings.is_payment_request_enabled
			);
		}

		// Show the feedback modal when WooPay is disabled.
		if ( initialIsWooPayEnabled && ! settings.is_woopay_enabled ) {
			const { woopayLastDisableDate } = wcpaySettings;

			// Do not show feedback modal if WooPay
			// was disabled in the last 7 days.
			if ( woopayLastDisableDate ) {
				const date1 = new Date( woopayLastDisableDate );
				const date2 = new Date();
				const diffTime = Math.abs( date2 - date1 );
				const diffDays = Math.ceil(
					diffTime / ( 1000 * 60 * 60 * 24 )
				);

				if ( diffDays < 7 ) {
					return;
				}
			}

			setIsWooPayDisableFeedbackOpen( true );

			// Prevent show modal again.
			setInitialIsPaymentRequestEnabled( true );
			// Set last disable date to prevent feedback window opening up
			// on successive "Save button" clicks. This value is overwritten
			// on page refresh.
			wcpaySettings.woopayLastDisableDate = new Date();
		}
	};

	return (
		<SettingsSection className="save-settings-section">
			<Button
				isPrimary
				isBusy={ isSaving }
				disabled={ isSaving || isLoading || disabled || ! isDirty }
				onClick={ saveOnClick }
			>
				{ __( 'Save changes', 'poocommerce-payments' ) }
			</Button>
			{ isWooPayDisableFeedbackOpen ? (
				<WooPayDisableFeedback
					onRequestClose={ () =>
						setIsWooPayDisableFeedbackOpen( false )
					}
				/>
			) : null }
		</SettingsSection>
	);
};

export default SaveSettingsSection;
