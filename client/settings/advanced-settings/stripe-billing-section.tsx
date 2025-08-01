/**
 * External dependencies
 */
import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	useStripeBilling,
	useStripeBillingMigration,
	useSettings,
	useManualCapture,
} from 'wcpay/data';
import ConfirmationModal from 'wcpay/components/confirmation-modal';
import Notices from './stripe-billing-notices/notices';
import StripeBillingMigrationNoticeContext from './stripe-billing-notices/context';
import StripeBillingToggle from './stripe-billing-toggle';

/**
 * Renders a WooPayments Subscriptions Advanced Settings Section.
 *
 * @return {JSX.Element} Rendered subscriptions advanced settings section.
 */
const StripeBillingSection: React.FC = () => {
	const [
		isStripeBillingEnabled,
		updateIsStripeBillingEnabled,
	] = useStripeBilling();
	const [ isManualCaptureEnabled ] = useManualCapture();
	const [
		isMigrationInProgress,
		migratedCount,
		subscriptionCount,
		startMigration,
		isResolving,
		hasResolved,
	] = useStripeBillingMigration();

	/**
	 * Notices are shown and hidden based on whether the settings have been saved.
	 * The following variables track the saving state of the WooPayments settings.
	 */
	const { isLoading, isSaving } = useSettings();
	const [ hasSavedSettings, setHasSavedSettings ] = useState( false );
	const [
		savedIsStripeBillingEnabled,
		setSavedIsStripeBillingEnabled,
	] = useState( isStripeBillingEnabled );

	// The settings have finished saving when the settings are not actively being saved and we've flagged they were being saved.
	const hasFinishedSavingSettings = ! isSaving && hasSavedSettings;

	// When the settings are being saved, set the hasSavedSettings flag to true.
	useEffect( () => {
		if ( isSaving && ! isLoading ) {
			setHasSavedSettings( true );
		}
	}, [ isLoading, isSaving ] );

	// When the settings have finished saving, update the savedIsStripeBillingEnabled value.
	useEffect( () => {
		if ( hasFinishedSavingSettings ) {
			setSavedIsStripeBillingEnabled( isStripeBillingEnabled );
		}
	}, [ hasFinishedSavingSettings, isStripeBillingEnabled ] );

	// Set up the context to be shared between the notices and the toggle.
	const [ isMigrationInProgressShown ] = useState( false );
	const [ isMigrationOptionShown ] = useState( false );

	const noticeContext = {
		isStripeBillingEnabled: isStripeBillingEnabled,
		savedIsStripeBillingEnabled: savedIsStripeBillingEnabled,

		// Notice logic.
		isMigrationOptionShown: isMigrationOptionShown,
		isMigrationInProgressShown: isMigrationInProgressShown,

		// Migration logic.
		isMigrationInProgress: isMigrationInProgress,
		hasSavedSettings: hasFinishedSavingSettings,

		// Migration data.
		subscriptionCount: subscriptionCount,
		migratedCount: migratedCount,

		// Migration actions & state.
		startMigration: startMigration,
		isResolvingMigrateRequest: isResolving,
		hasResolvedMigrateRequest: hasResolved,
	};

	const [
		isStripeBillingManualCaptureConflictModalOpen,
		setStripeBillingManualCaptureConflictModalOpen,
	] = useState( false );
	const openStripeBillingManualCaptureConflictModal = () =>
		setStripeBillingManualCaptureConflictModalOpen( true );
	const closeStripeBillingManualCaptureConflictModal = () =>
		setStripeBillingManualCaptureConflictModalOpen( false );

	// When the toggle is changed, update the WooPayments settings and reset the hasSavedSettings flag.
	const stripeBillingSettingToggle = ( enabled: boolean ) => {
		if ( enabled && isManualCaptureEnabled ) {
			openStripeBillingManualCaptureConflictModal();
			return;
		}
		updateIsStripeBillingEnabled( enabled );
		setHasSavedSettings( false );
	};

	return (
		<StripeBillingMigrationNoticeContext.Provider value={ noticeContext }>
			<h4>{ __( 'Subscriptions', 'poocommerce-payments' ) }</h4>
			<Notices />
			<StripeBillingToggle onChange={ stripeBillingSettingToggle } />
			{ isStripeBillingManualCaptureConflictModalOpen && (
				<ConfirmationModal
					title={ __(
						'Enable Stripe Billing',
						'poocommerce-payments'
					) }
					actions={
						<>
							<Button
								onClick={
									closeStripeBillingManualCaptureConflictModal
								}
								isPrimary
							>
								{ __( 'OK', 'poocommerce-payments' ) }
							</Button>
						</>
					}
					onRequestClose={
						closeStripeBillingManualCaptureConflictModal
					}
				>
					<p>
						{ createInterpolateElement(
							__(
								'Stripe Billing is not available with <b>manual capture enabled</b>. To use Stripe Billing, disable manual capture in your settings list.',
								'poocommerce-payments'
							),
							{
								b: <strong />,
							}
						) }
					</p>
				</ConfirmationModal>
			) }
		</StripeBillingMigrationNoticeContext.Provider>
	);
};

export default StripeBillingSection;
