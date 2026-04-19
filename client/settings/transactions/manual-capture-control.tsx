/* eslint-disable jsx-a11y/anchor-has-content */
/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { CheckboxControl, Button, ExternalLink } from '@wordpress/components';
import {
	useManualCapture,
	useCardPresentEligible,
	useStripeBilling,
} from 'wcpay/data';
import './style.scss';
import ConfirmationModal from 'wcpay/components/confirmation-modal';
import interpolateComponents from '@automattic/interpolate-components';
import InlineNotice from 'components/inline-notice';

const ManualCaptureControl = (): JSX.Element => {
	const [
		isManualCaptureEnabled,
		setIsManualCaptureEnabled,
	] = useManualCapture();
	const [ isStripeBillingEnabled ] = useStripeBilling();
	const [ isCardPresentEligible ] = useCardPresentEligible();

	const [
		isManualDepositConfirmationModalOpen,
		setIsManualDepositConfirmationModalOpen,
	] = useState( false );

	const handleCheckboxToggle = ( isChecked: boolean ) => {
		// toggling from "manual" capture to "automatic" capture - no need to show the modal.
		if ( ! isChecked ) {
			setIsManualCaptureEnabled( isChecked );
			return;
		}
		setIsManualDepositConfirmationModalOpen( true );
	};

	const handleModalCancel = () => {
		setIsManualDepositConfirmationModalOpen( false );
	};

	const handleModalConfirmation = () => {
		setIsManualCaptureEnabled( true );
		setIsManualDepositConfirmationModalOpen( false );
	};

	return (
		<>
			<CheckboxControl
				checked={ isManualCaptureEnabled }
				disabled={ isStripeBillingEnabled }
				onChange={ handleCheckboxToggle }
				data-testid={ 'capture-later-checkbox' }
				label={ __( 'Enable manual capture', 'poocommerce-payments' ) }
				help={
					<span>
						{ interpolateComponents( {
							mixedString: __(
								'Issue an authorization on checkout and capture later. {{learnMoreLink}}Learn more{{/learnMoreLink}}.',
								'poocommerce-payments'
							),
							components: {
								learnMoreLink: (
									<a
										href="https://poocommerce.com/document/woopayments/settings-guide/authorize-and-capture/"
										target="_blank"
										rel="noreferrer"
									/>
								),
							},
						} ) }
						{ isCardPresentEligible
							? interpolateComponents( {
									mixedString: __(
										/** translators: {{a}}: opening and closing anchor tags. The white space at the beginning of the sentence is intentional. */
										' The setting is not applied to {{a}}In-Person Payments{{/a}} (please note that In-Person Payments should be captured within 2 days of authorization).',
										'poocommerce-payments'
									),
									components: {
										a: (
											// @ts-expect-error: children is provided when interpolating the component
											<ExternalLink href="https://poocommerce.com/in-person-payments/" />
										),
									},
							  } )
							: '' }
					</span>
				}
				__nextHasNoMarginBottom
			/>
			{ isStripeBillingEnabled && (
				<InlineNotice status="warning" isDismissible={ false }>
					{ __(
						'Manual capture is not available when Stripe Billing is active.',
						'poocommerce-payments'
					) }
				</InlineNotice>
			) }
			{ isManualDepositConfirmationModalOpen && (
				<ConfirmationModal
					title={ __(
						'Enable manual capture',
						'poocommerce-payments'
					) }
					className="manual-capture-confirmation-modal"
					actions={
						<>
							<Button onClick={ handleModalCancel } isTertiary>
								{ __( 'Cancel', 'poocommerce-payments' ) }
							</Button>
							<Button
								onClick={ handleModalConfirmation }
								isPrimary
							>
								{ __(
									'Enable manual capture',
									'poocommerce-payments'
								) }
							</Button>
						</>
					}
					onRequestClose={ handleModalCancel }
				>
					<p>
						{ interpolateComponents( {
							mixedString: __(
								'Payments {{strong}}must be captured on the order details screen within 7 days ' +
									'of authorization{{/strong}}, otherwise the authorization and order will be canceled.',
								'poocommerce-payments'
							),
							components: {
								strong: <strong />,
							},
						} ) }
						<br />
						{ interpolateComponents( {
							mixedString: __(
								'{{learnMoreLink}}Learn more about manual capture{{/learnMoreLink}}.',
								'poocommerce-payments'
							),
							components: {
								learnMoreLink: (
									<a
										href="https://poocommerce.com/document/woopayments/settings-guide/authorize-and-capture/"
										target="_blank"
										rel="noreferrer"
									/>
								),
							},
						} ) }
					</p>
					<InlineNotice status="info" isDismissible={ false }>
						{ __(
							"Manual capture is available for card payments only. Payment methods that don't support it will be disabled.",
							'poocommerce-payments'
						) }
					</InlineNotice>
				</ConfirmationModal>
			) }
		</>
	);
};

export default ManualCaptureControl;
