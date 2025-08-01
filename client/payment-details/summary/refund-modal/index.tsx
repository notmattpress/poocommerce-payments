/** @format **/

/**
 * External dependencies
 */
import React from 'react';
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { RadioControl } from 'wcpay/components/wp-components-wrapped/components/radio-control';
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import interpolateComponents from '@automattic/interpolate-components';

/**
 * Internal dependencies.
 */
import ConfirmationModal from 'wcpay/components/confirmation-modal';
import { Charge } from 'wcpay/types/charges';
import { usePaymentIntentWithChargeFallback } from 'wcpay/data';
import { PaymentChargeDetailsResponse } from 'wcpay/payment-details/types';
import { recordEvent } from 'tracks';

interface RefundModalProps {
	charge: Charge;
	formattedAmount: string;
	onModalClose: () => void;
}

const RefundModal: React.FC< RefundModalProps > = ( {
	charge,
	formattedAmount,
	onModalClose,
} ) => {
	const [ reason, setReason ] = useState< string | null >( null );

	const [ isRefundInProgress, setIsRefundInProgress ] = useState< boolean >(
		false
	);

	const { doRefund } = usePaymentIntentWithChargeFallback(
		charge.payment_intent as string
	) as PaymentChargeDetailsResponse;

	const handleModalCancel = () => {
		onModalClose();
	};

	const handleRefund = async () => {
		recordEvent( 'payments_transactions_details_refund_full', {
			payment_intent_id: charge.payment_intent,
		} );
		setIsRefundInProgress( true );
		await doRefund( charge, reason === 'other' ? null : reason );
		setIsRefundInProgress( false );
		handleModalCancel();
	};

	return (
		<ConfirmationModal
			className="missing-order-notice-modal"
			title={ __( 'Refund transaction', 'poocommerce-payments' ) }
			actions={
				<>
					<Button onClick={ handleModalCancel } variant="secondary">
						{ __( 'Cancel', 'poocommerce-payments' ) }
					</Button>
					<Button
						onClick={ handleRefund }
						isPrimary
						isBusy={ isRefundInProgress }
						disabled={ isRefundInProgress }
					>
						{ __( 'Refund transaction', 'poocommerce-payments' ) }
					</Button>
				</>
			}
			onRequestClose={ handleModalCancel }
		>
			<p>
				{ interpolateComponents( {
					mixedString: sprintf(
						__(
							'This will issue a full refund of {{strong}}%s{{/strong}} to the customer.',
							'poocommerce-payments'
						),
						formattedAmount
					),
					components: {
						strong: <strong />,
					},
				} ) }
			</p>
			<RadioControl
				className="missing-order-notice-modal__reason"
				label={ __(
					'Select a reason (Optional)',
					'poocommerce-payments'
				) }
				selected={ reason }
				options={ [
					{
						label: __( 'Duplicate order', 'poocommerce-payments' ),
						value: 'duplicate',
					},
					{
						label: __( 'Fraudulent', 'poocommerce-payments' ),
						value: 'fraudulent',
					},
					{
						label: __(
							'Requested by customer',
							'poocommerce-payments'
						),
						value: 'requested_by_customer',
					},
					{
						label: __( 'Other', 'poocommerce-payments' ),
						value: 'other',
					},
				] }
				onChange={ ( value: string ) => setReason( value ) }
			/>
		</ConfirmationModal>
	);
};

export default RefundModal;
