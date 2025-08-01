/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { Modal } from 'wcpay/components/wp-components-wrapped/components/modal';

/**
 * Internal dependencies
 */
import ProtectionLevelModalNotice from '../protection-level-modal-notice';
import interpolateComponents from '@automattic/interpolate-components';

interface BasicFraudProtectionModalProps {
	level: string;
	isBasicModalOpen: boolean;
	setBasicModalOpen: ( isOpen: boolean ) => void;
}

export const BasicFraudProtectionModal: React.FC< BasicFraudProtectionModalProps > = ( {
	level,
	isBasicModalOpen,
	setBasicModalOpen,
} ) => {
	const { declineOnAVSFailure, declineOnCVCFailure } = wcpaySettings
		?.accountStatus?.fraudProtection ?? {
		declineOnAVSFailure: true,
		declineOnCVCFailure: true,
	};

	const hasActivePlatformChecks = declineOnAVSFailure || declineOnCVCFailure;
	return (
		<>
			{ isBasicModalOpen && (
				<Modal
					title={ __( 'Basic filter level', 'poocommerce-payments' ) }
					isDismissible={ true }
					shouldCloseOnClickOutside={ true }
					shouldCloseOnEsc={ true }
					onRequestClose={ () => setBasicModalOpen( false ) }
					className="fraud-protection-level-modal"
				>
					<div className="components-modal__body--fraud-protection">
						<ProtectionLevelModalNotice level={ level } />
						{ hasActivePlatformChecks && (
							<>
								<p>
									{ interpolateComponents( {
										mixedString: __(
											'Payments will be {{blocked}}blocked{{/blocked}} if:',
											'poocommerce-payments'
										),
										components: {
											blocked: (
												<span className="component-modal__text--blocked" />
											),
										},
									} ) }
								</p>
								<ul>
									{ declineOnAVSFailure && (
										<li>
											{ __(
												'The billing address does not match what is on file with the card issuer.',
												'poocommerce-payments'
											) }
										</li>
									) }
									{ declineOnCVCFailure && (
										<li>
											{ __(
												"The card's issuing bank cannot verify the CVV.",
												'poocommerce-payments'
											) }
										</li>
									) }
								</ul>
							</>
						) }
						<Button
							className="component-modal__button--confirm"
							onClick={ () => setBasicModalOpen( false ) }
							variant="secondary"
						>
							{ __( 'Got it', 'poocommerce-payments' ) }
						</Button>
					</div>
				</Modal>
			) }
		</>
	);
};
