/**
 * External dependencies
 */
import React, { useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { Card, CheckboxControl } from '@wordpress/components';
import interpolateComponents from '@automattic/interpolate-components';

/**
 * Internal dependencies
 */
import { useTestMode, useTestModeOnboarding } from 'wcpay/data';
import CardBody from '../card-body';
import InlineNotice from 'wcpay/components/inline-notice';
import SetupLivePaymentsModal from 'wcpay/components/sandbox-mode-switch-to-live-notice/modal';
import TestModeConfirmationModal from './test-mode-confirm-modal';
import EnableWooPaymentsCheckbox from './enable-woopayments-checkbox';
import { recordEvent } from 'wcpay/tracks';

const GeneralSettings = () => {
	const [ isEnabled, updateIsTestModeEnabled ] = useTestMode();
	const [ modalVisible, setModalVisible ] = useState( false );
	const isTestModeOnboarding = useTestModeOnboarding();
	const [ testModeModalVisible, setTestModeModalVisible ] = useState( false );

	return (
		<>
			<Card>
				<CardBody>
					<EnableWooPaymentsCheckbox />
					{ ! isTestModeOnboarding && (
						<>
							<h4>
								{ __( 'Test mode', 'poocommerce-payments' ) }
							</h4>
							<CheckboxControl
								checked={ isEnabled }
								onChange={ ( enableTestMode ) => {
									if ( enableTestMode ) {
										setTestModeModalVisible( true );
									} else {
										recordEvent(
											'wcpay_test_mode_disabled',
											{
												source: 'wcadmin-settings-page',
											}
										);

										updateIsTestModeEnabled( false );
									}
								} }
								label={ __(
									'Enable test mode',
									'poocommerce-payments'
								) }
								help={ interpolateComponents( {
									mixedString: __(
										'Use {{testCardHelpLink}}test card numbers{{/testCardHelpLink}} to simulate ' +
											'various transactions. {{learnMoreLink}}Learn more{{/learnMoreLink}}',
										'poocommerce-payments'
									),
									components: {
										testCardHelpLink: (
											// eslint-disable-next-line jsx-a11y/anchor-has-content
											<a
												target="_blank"
												rel="noreferrer"
												/* eslint-disable-next-line max-len */
												href="https://poocommerce.com/document/woopayments/testing-and-troubleshooting/testing/#test-cards"
											/>
										),
										learnMoreLink: (
											// eslint-disable-next-line jsx-a11y/anchor-has-content
											<a
												target="_blank"
												rel="noreferrer"
												href="https://poocommerce.com/document/woopayments/testing-and-troubleshooting/testing/"
											/>
										),
									},
								} ) }
							/>
						</>
					) }
					{ isTestModeOnboarding && (
						<InlineNotice
							status="warning"
							isDismissible={ false }
							actions={ [
								{
									label: __(
										'Set up payments',
										'poocommerce-payments'
									),
									variant: 'secondary',
									onClick: () => {
										recordEvent(
											'wcpay_settings_setup_live_payments_click',
											{
												source: 'wcadmin-settings-page',
											}
										);

										setModalVisible( true );
									},
								},
							] }
							className="wcpay-general-settings__notice"
						>
							<span>
								{ interpolateComponents( {
									mixedString: sprintf(
										/* translators: %s: WooPayments */
										__(
											'{{b}}%1$s is in sandbox mode.{{/b}} You need to set up a live %1$s account before ' +
												'you can accept real transactions. {{learnMoreLink}}Learn more{{/learnMoreLink}}',
											'poocommerce-payments'
										),
										'WooPayments'
									),
									components: {
										b: <b />,
										learnMoreLink: (
											// eslint-disable-next-line jsx-a11y/anchor-has-content
											<a
												target="_blank"
												rel="noreferrer"
												// eslint-disable-next-line max-len
												href="https://poocommerce.com/document/woopayments/testing-and-troubleshooting/sandbox-mode/"
											/>
										),
									},
								} ) }
							</span>
						</InlineNotice>
					) }
				</CardBody>
			</Card>
			{ modalVisible && (
				<SetupLivePaymentsModal
					from="WCPAY_SETTINGS"
					source="wcadmin-settings-page"
					onClose={ () => {
						recordEvent( 'wcpay_setup_live_payments_modal_exit', {
							source: 'wcadmin-settings-page',
						} );

						setModalVisible( false );
					} }
				/>
			) }
			{ testModeModalVisible && (
				<TestModeConfirmationModal
					onClose={ () => {
						recordEvent( 'wcpay_test_mode_modal_exit', {
							source: 'wcadmin-settings-page',
						} );

						setTestModeModalVisible( false );
					} }
					onConfirm={ () => {
						recordEvent( 'wcpay_test_mode_enabled', {
							source: 'wcadmin-settings-page',
						} );

						updateIsTestModeEnabled( true );
						setTestModeModalVisible( false );
					} }
				/>
			) }
		</>
	);
};

export default GeneralSettings;
