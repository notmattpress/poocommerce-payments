/** @format */
/**
 * External dependencies
 */
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import interpolateComponents from '@automattic/interpolate-components';

/**
 * Internal dependencies
 */
import PaymentDeleteIllustration from 'wcpay/components/payment-delete-illustration';
import ConfirmationModal from 'wcpay/components/confirmation-modal';

const ConfirmPaymentMethodDeleteModal: React.FunctionComponent< {
	id: string;
	label: string;
	icon: () => JSX.Element;
	onConfirm: () => void;
	onCancel: () => void;
} > = ( { id, label, icon: Icon, onConfirm, onCancel } ): JSX.Element => {
	return (
		<ConfirmationModal
			title={ sprintf(
				__(
					/* translators: %1: Name of the payment method being removed */
					'Remove %1$s from checkout',
					'poocommerce-payments'
				),
				label
			) }
			onRequestClose={ onCancel }
			actions={
				<>
					<Button onClick={ onConfirm } isPrimary isDestructive>
						{ __( 'Remove', 'poocommerce-payments' ) }
					</Button>
					<Button onClick={ onCancel } isSecondary>
						{ __( 'Cancel', 'poocommerce-payments' ) }
					</Button>
				</>
			}
		>
			<PaymentDeleteIllustration
				icon={ Icon }
				hasBorder={ 'card' !== id }
			/>
			<p>
				{ interpolateComponents( {
					mixedString: sprintf(
						__(
							'Are you sure you want to remove {{strong}}%s{{/strong}}? ' +
								'Your customers will no longer be able to pay using %s.',
							'poocommerce-payments'
						),
						label,
						label
					),
					components: {
						strong: <strong />,
					},
				} ) }
			</p>
			<p>
				{ interpolateComponents( {
					mixedString: __(
						'You can add it again at any time in {{wooCommercePaymentsLink /}}.',
						'poocommerce-payments'
					),
					components: {
						wooCommercePaymentsLink: (
							<a href="admin.php?page=wc-settings&tab=checkout&section=poocommerce_payments">
								{ 'WooPayments' }
							</a>
						),
					},
				} ) }
			</p>
		</ConfirmationModal>
	);
};

export default ConfirmPaymentMethodDeleteModal;
