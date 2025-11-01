/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { Button, Modal } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ProtectionLevelModalNotice from '../protection-level-modal-notice';
import interpolateComponents from '@automattic/interpolate-components';
import './styles.scss';

interface BasicFraudProtectionModalProps {
	level: string;
	setBasicModalOpen: ( isOpen: boolean ) => void;
}

const BasicFraudProtectionModal: React.FC< BasicFraudProtectionModalProps > = ( {
	level,
	setBasicModalOpen,
} ) => {
	const { declineOnAVSFailure, declineOnCVCFailure } = wcpaySettings
		?.accountStatus?.fraudProtection ?? {
		declineOnAVSFailure: true,
		declineOnCVCFailure: true,
	};

	const hasActivePlatformChecks = declineOnAVSFailure || declineOnCVCFailure;
	return (
		<Modal
			title={ __( 'Basic filter level', 'poocommerce-payments' ) }
			isDismissible
			shouldCloseOnClickOutside
			shouldCloseOnEsc
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
	);
};

export default BasicFraudProtectionModal;
