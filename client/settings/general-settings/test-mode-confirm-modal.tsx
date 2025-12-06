/** @format **/

/**
 * External dependencies
 */
import React from 'react';
import { Button, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ConfirmationModal from '../../components/confirmation-modal';

interface TestModeConfirmationModalProps {
	onClose: () => void;
	onConfirm: () => void;
}

const TestModeConfirmationModal: React.FC< TestModeConfirmationModalProps > = ( {
	onClose,
	onConfirm,
} ) => {
	return (
		<ConfirmationModal
			title={ __( 'Enable test mode', 'poocommerce-payments' ) }
			onRequestClose={ onClose }
			actions={
				<>
					<Button onClick={ onClose } variant="secondary">
						{ __( 'Cancel', 'poocommerce-payments' ) }
					</Button>
					<Button onClick={ onConfirm } variant="primary">
						{ __( 'Enable', 'poocommerce-payments' ) }
					</Button>
				</>
			}
		>
			<h3>
				{ __(
					'Are you sure you want to enable test mode?',
					'poocommerce-payments'
				) }
			</h3>
			<p>
				{ __(
					"Test mode lets you try out payments, refunds, disputes and other such processes as you're working on your store " +
						'without handling live payment information. ' +
						'All incoming orders will be simulated, and test mode will have to be disabled before you can accept real orders.',
					'poocommerce-payments'
				) }
			</p>
			<ExternalLink
				// eslint-disable-next-line max-len
				href="https://poocommerce.com/document/woopayments/testing-and-troubleshooting/testing/"
			>
				{ __( 'Learn more about test mode', 'poocommerce-payments' ) }
			</ExternalLink>
		</ConfirmationModal>
	);
};

export default TestModeConfirmationModal;
