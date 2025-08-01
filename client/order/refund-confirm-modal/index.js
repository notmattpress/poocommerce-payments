/* global jQuery,poocommerce_admin_meta_boxes */
/** @format */
/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { useState } from '@wordpress/element';
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ConfirmationModal from 'wcpay/components/confirmation-modal';
import './styles.scss';

const RefundConfirmationModal = ( {
	orderStatus,
	refundAmount,
	formattedRefundAmount,
	refundedAmount,
} ) => {
	const [
		isRefundConfirmationModalOpen,
		setIsRefundConfirmationModalOpen,
	] = useState( true );

	const blockUI = () => {
		jQuery( '.refund-confirmation-modal' ).block( {
			message: null,
			overlayCSS: {
				background: '#fff',
				opacity: 0.6,
			},
		} );
	};

	const unblockUI = () => {
		jQuery( '.refund-confirmation-modal' ).unblock();
	};

	const closeModal = () => {
		setIsRefundConfirmationModalOpen( false );
	};

	const resetOrderStatus = () => {
		const orderStatusElement = document.querySelector( '#order_status' );
		orderStatusElement.value = orderStatus;
		orderStatusElement.dispatchEvent( new Event( 'change' ) );
	};

	const handleRefundCancel = () => {
		resetOrderStatus();
		closeModal();
	};

	const handleRefundConfirm = () => {
		jQuery.ajax( {
			type: 'post',
			url: poocommerce_admin_meta_boxes.ajax_url,
			data: {
				action: 'poocommerce_refund_line_items',
				order_id: poocommerce_admin_meta_boxes.post_id,
				security: poocommerce_admin_meta_boxes.order_item_nonce,
				refund_amount: refundAmount,
				refunded_amount: refundedAmount,
				api_refund: true,
			},
			beforeSend: function () {
				blockUI();
			},
			success: function ( response ) {
				if ( response.success === true ) {
					// Refresh the page to show the refunded status
					window.location.reload();
				} else {
					resetOrderStatus();
					dispatch( 'core/notices' ).createErrorNotice(
						response.data.error
					);
				}
			},
			complete: function () {
				unblockUI();
				closeModal();
			},
		} );
	};

	return (
		<>
			{ isRefundConfirmationModalOpen && (
				<ConfirmationModal
					title={ __(
						'Refund order in full',
						'poocommerce-payments'
					) }
					isDismissible={ false }
					className="refund-confirmation-modal"
					actions={
						<>
							<Button isSecondary onClick={ handleRefundCancel }>
								{ __( 'Cancel', 'poocommerce-payments' ) }
							</Button>
							<Button isPrimary onClick={ handleRefundConfirm }>
								{ sprintf(
									__( 'Refund %s', 'poocommerce-payments' ),
									formattedRefundAmount
								) }
							</Button>
						</>
					}
				>
					<p>
						{ sprintf(
							/* translators: %s: WooPayments */
							__(
								"Issue a full refund back to your customer's payment method using %s. " +
									'This action can not be undone. To issue a partial refund, click "Cancel", and use ' +
									'the "Refund" button in the order details below.',
								'poocommerce-payments'
							),
							'WooPayments'
						) }
					</p>
				</ConfirmationModal>
			) }
		</>
	);
};
export default RefundConfirmationModal;
