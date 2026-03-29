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
						{ __(
							'Charge must be captured on the order details screen within 7 days of authorization, ' +
								'otherwise the authorization and order will be canceled.',
							'poocommerce-payments'
						) }
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
					actions={
						<>
							<Button onClick={ handleModalCancel } isSecondary>
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
					<strong>
						{ __(
							'Payments must be captured within 7 days or the authorization will expire and money will be returned to the shopper.',
							'poocommerce-payments'
						) }
					</strong>
					<p>
						{ __(
							'Additionally, only card payments support manual capture. Non-card payments will be hidden from checkout.',
							'poocommerce-payments'
						) }
					</p>
					<p>
						{ __(
							'Do you want to continue?',
							'poocommerce-payments'
						) }
					</p>
				</ConfirmationModal>
			) }
		</>
	);
};

export default ManualCaptureControl;
