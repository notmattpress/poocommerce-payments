/** @format */
/**
 * External dependencies
 */
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { DismissConfirmationModalProps } from './types';

/**
 * Internal dependencies
 */
import ConfirmationModal from 'wcpay/components/confirmation-modal';

const DismissConfirmationModal: React.FC< DismissConfirmationModalProps > = ( {
	onClose,
	onSubmit,
	label,
} ): JSX.Element => {
	const buttonContent = (
		<>
			<Button isSecondary onClick={ onClose }>
				{ __( 'Cancel', 'poocommerce-payments' ) }
			</Button>
			<Button isPrimary onClick={ onSubmit }>
				{ __( 'Yes, continue', 'poocommerce-payments' ) }
			</Button>
		</>
	);

	return (
		<ConfirmationModal
			title={ __( 'Remove', 'poocommerce-payments' ) + ' ' + label }
			isDismissible={ false }
			className="dismiss-confirmation-modal"
			onRequestClose={ onClose }
			actions={ buttonContent }
		>
			<p>
				{ sprintf(
					/** translators: %s is the capability label. */
					__(
						'Choosing to continue will remove the option to accept %s cards from your customers. ' +
							'The option to enable %s will not appear again.',
						'poocommerce-payments'
					),
					label,
					label
				) }
			</p>
		</ConfirmationModal>
	);
};
export default DismissConfirmationModal;
