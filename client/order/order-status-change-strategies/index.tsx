/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import { dispatch } from '@wordpress/data';
import interpolateComponents from '@automattic/interpolate-components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import RefundConfirmationModal from '../refund-confirm-modal';
import { getConfig } from 'utils/order';
import OrderStatusConfirmationModal from '../order-status-confirmation-modal';
import React from 'react';

interface StatusChangeStrategies {
	[ key: string ]: ( orderStatus: string, newOrderStatus: string ) => void;
}

const OrderStatus = {
	CANCELLED: __( 'cancelled', 'poocommerce-payments' ),
	COMPLETED: __( 'completed', 'poocommerce-payments' ),
	FAILED: __( 'failed', 'poocommerce-payments' ),
	ON_HOLD: __( 'on-hold', 'poocommerce-payments' ),
	PENDING: __( 'pending', 'poocommerce-payments' ),
	PROCESSING: __( 'processing', 'poocommerce-payments' ),
	REFUNDED: __( 'refunded', 'poocommerce-payments' ),
	TRASH: __( 'trash', 'poocommerce-payments' ),
};

const OrderStatusCancelled = 'wc-cancelled';
const OrderStatusCompleted = 'wc-completed';
const OrderStatusFailed = 'wc-failed';
const OrderStatusOnHold = 'wc-on-hold';
const OrderStatusPending = 'wc-pending';
const OrderStatusProcessing = 'wc-processing';
const OrderStatusRefunded = 'wc-refunded';
const OrderStatusTrash = 'wc-trash';

const OrderStatusLookup: { [ key: string ]: string } = {
	[ OrderStatusCancelled ]: OrderStatus.CANCELLED,
	[ OrderStatusCompleted ]: OrderStatus.COMPLETED,
	[ OrderStatusFailed ]: OrderStatus.FAILED,
	[ OrderStatusOnHold ]: OrderStatus.ON_HOLD,
	[ OrderStatusPending ]: OrderStatus.PENDING,
	[ OrderStatusProcessing ]: OrderStatus.PROCESSING,
	[ OrderStatusRefunded ]: OrderStatus.REFUNDED,
	[ OrderStatusTrash ]: OrderStatus.TRASH,
};

function renderModal( modalToRender: JSX.Element ) {
	const container = document.createElement( 'div' );
	container.id = 'wcpay-orderstatus-confirm-container';
	document.body.appendChild( container );
	ReactDOM.render( modalToRender, container );
}

function triggerCancelAuthorizationModal(
	orderStatus: string,
	newOrderStatus: string
): void {
	const interpolatedMessage = interpolateComponents( {
		mixedString: __(
			'This order has been {{authorizedNotCaptured/}} yet. Changing the status to ' +
				'{{newOrderStatus/}} will also {{cancelAuthorization/}}. Do you want to continue?',
			'poocommerce-payments'
		),
		components: {
			authorizedNotCaptured: (
				<a
					target="_blank"
					href={
						'https://poocommerce.com/document/woopayments/settings-guide/authorize-and-capture/#authorize-vs-capture'
					}
					rel="noopener noreferrer"
				>
					{ __(
						'authorized but payment has not been captured',
						'poocommerce-payments'
					) }
				</a>
			),
			cancelAuthorization: (
				<a
					target="_blank"
					href="https://poocommerce.com/document/woopayments/settings-guide/authorize-and-capture/#cancelling-authorizations"
					rel="noopener noreferrer"
				>
					{ __( 'cancel the payment', 'poocommerce-payments' ) }
				</a>
			),
			newOrderStatus: <b>{ OrderStatusLookup[ newOrderStatus ] }</b>,
		},
	} );

	renderModal(
		<OrderStatusConfirmationModal
			title={ __( 'Cancel payment', 'poocommerce-payments' ) }
			confirmButtonText={ __(
				'Cancel order and payment',
				'poocommerce-payments'
			) }
			cancelButtonText={ __( 'Cancel', 'poocommerce-payments' ) }
			confirmationMessage={ interpolatedMessage }
			onConfirm={ () => {
				const orderEditForm: HTMLFormElement | null =
					document
						.querySelector( '#order_status' )
						?.closest( 'form' ) || null;
				if ( orderEditForm !== null ) {
					orderEditForm.submit();
				}
			} }
			onCancel={ () => {
				const orderStatusElement: HTMLInputElement | null = document.querySelector(
					'#order_status'
				);
				if ( orderStatusElement !== null ) {
					orderStatusElement.value = orderStatus;
					orderStatusElement.dispatchEvent( new Event( 'change' ) );
				}
			} }
		/>
	);
}

function triggerCaptureAuthorizationModal(
	orderStatus: string,
	newOrderStatus: string
): void {
	const interpolatedMessage = interpolateComponents( {
		mixedString: __(
			'This order has been {{authorizedNotCaptured/}} yet. Changing the status to ' +
				'{{newOrderStatus/}} will also {{captureAuthorization/}}. Do you want to continue?',
			'poocommerce-payments'
		),
		components: {
			authorizedNotCaptured: (
				<a
					target="_blank"
					href={
						'https://poocommerce.com/document/woopayments/settings-guide/authorize-and-capture/#authorize-vs-capture'
					}
					rel="noopener noreferrer"
				>
					{ __(
						'authorized but payment has not been captured',
						'poocommerce-payments'
					) }
				</a>
			),
			captureAuthorization: (
				<a
					target="_blank"
					href={
						'https://poocommerce.com/document/woopayments/settings-guide/authorize-and-capture/#capturing-authorized-payments'
					}
					rel="noopener noreferrer"
				>
					{ __( 'capture the payment', 'poocommerce-payments' ) }
				</a>
			),
			newOrderStatus: <b>{ OrderStatusLookup[ newOrderStatus ] }</b>,
		},
	} );

	renderModal(
		<OrderStatusConfirmationModal
			title={ __( 'Capture payment', 'poocommerce-payments' ) }
			confirmButtonText={ __(
				'Complete order and capture payment',
				'poocommerce-payments'
			) }
			cancelButtonText={ __( 'Cancel', 'poocommerce-payments' ) }
			confirmationMessage={ interpolatedMessage }
			onConfirm={ () => {
				const orderEditForm: HTMLFormElement | null =
					document
						.querySelector( '#order_status' )
						?.closest( 'form' ) || null;
				if ( orderEditForm !== null ) {
					orderEditForm.submit();
				}
			} }
			onCancel={ () => {
				const orderStatusElement: HTMLInputElement | null = document.querySelector(
					'#order_status'
				);
				if ( orderStatusElement !== null ) {
					orderStatusElement.value = orderStatus;
					orderStatusElement.dispatchEvent( new Event( 'change' ) );
				}
			} }
		/>
	);
}

function renderRefundConfirmationModal(
	orderStatus: string,
	canRefund: boolean,
	refundAmount: number
): void {
	if ( ! canRefund ) {
		dispatch( 'core/notices' ).createErrorNotice(
			__( 'Order cannot be refunded', 'poocommerce-payments' )
		);
		return;
	}
	if ( refundAmount <= 0 ) {
		dispatch( 'core/notices' ).createErrorNotice(
			__( 'Invalid Refund Amount', 'poocommerce-payments' )
		);
		return;
	}
	renderModal(
		<RefundConfirmationModal
			orderStatus={ orderStatus }
			refundAmount={ refundAmount }
			formattedRefundAmount={ getConfig( 'formattedRefundAmount' ) }
			refundedAmount={ getConfig( 'refundedAmount' ) }
		/>
	);
}

function handleRefundedStatus( orderStatus: string ): void {
	if ( orderStatus === OrderStatusRefunded ) {
		return;
	}
	const canRefund = getConfig( 'canRefund' );
	const refundAmount = getConfig( 'refundAmount' );

	renderRefundConfirmationModal( orderStatus, canRefund, refundAmount );
}

function handleCancelledStatus(
	orderStatus: string,
	newOrderStatus: string
): void {
	if ( orderStatus === OrderStatusCancelled ) {
		return;
	}
	const hasOpenAuthorization = getConfig( 'hasOpenAuthorization' );
	const canRefund = getConfig( 'canRefund' );
	const refundAmount = getConfig( 'refundAmount' );

	// Confirm that merchant indeed wants to cancel both the order
	// and the authorization.
	if ( hasOpenAuthorization ) {
		triggerCancelAuthorizationModal( orderStatus, newOrderStatus );
	}

	// If it is possible to refund an order, double check that
	// merchants indeed wants to cancel, or if they just want to
	// refund.
	if ( ! hasOpenAuthorization && canRefund && refundAmount > 0 ) {
		const confirmationMessage = interpolateComponents( {
			mixedString: __(
				'Are you trying to issue a refund for this order? If so, please click ' +
					'{{doNothingBold/}} and see our documentation on {{howtoIssueRefunds/}}. If you want ' +
					'to mark this order as Cancelled without issuing a refund, click {{cancelOrderBold/}}.',
				'poocommerce-payments'
			),
			components: {
				doNothingBold: (
					<b>{ __( 'Do Nothing', 'poocommerce-payments' ) }</b>
				),
				cancelOrderBold: (
					<b>{ __( 'Cancel order', 'poocommerce-payments' ) }</b>
				),
				howtoIssueRefunds: (
					<a
						target="_blank"
						href="https://poocommerce.com/document/woopayments/managing-money/#refunds"
						rel="noopener noreferrer"
					>
						{ __( 'how to issue refunds', 'poocommerce-payments' ) }
					</a>
				),
			},
		} );

		renderModal(
			<OrderStatusConfirmationModal
				title={ __( 'Cancel order', 'poocommerce-payments' ) }
				confirmButtonText={ __(
					'Cancel order',
					'poocommerce-payments'
				) }
				cancelButtonText={ __( 'Do Nothing', 'poocommerce-payments' ) }
				confirmationMessage={ confirmationMessage }
				onConfirm={ () => {
					const orderEditForm: HTMLFormElement | null =
						document
							.querySelector( '#order_status' )
							?.closest( 'form' ) || null;
					if ( orderEditForm !== null ) {
						orderEditForm.submit();
					}
				} }
				onCancel={ () => {
					const orderStatusElement: HTMLInputElement | null = document.querySelector(
						'#order_status'
					);
					if ( orderStatusElement !== null ) {
						orderStatusElement.value = orderStatus;
						orderStatusElement.dispatchEvent(
							new Event( 'change' )
						);
					}
				} }
			/>
		);
	}
}

function handleGenericStatusChange(): void {
	// Generic handler for any other status changes
	// eslint-disable-next-line no-console
	console.log( 'No specific action defined for this status change.' );
}

function maybeTriggerCaptureAuthorizationModal(
	orderStatus: string,
	newOrderStatus: string
): void {
	if ( orderStatus === OrderStatusCompleted ) {
		return;
	}

	if ( getConfig( 'hasOpenAuthorization' ) ) {
		triggerCaptureAuthorizationModal( orderStatus, newOrderStatus );
	}
}

// Map status changes to strategies.
// If some status needs more complex logic, feel free to create a new function
// and add it to the map.
const statusChangeStrategies: StatusChangeStrategies = {
	[ OrderStatusCancelled ]: handleCancelledStatus,
	[ OrderStatusCompleted ]: maybeTriggerCaptureAuthorizationModal,
	[ OrderStatusRefunded ]: handleRefundedStatus,
};

export default function getStatusChangeStrategy(
	orderStatus: string
): ( orderStatus: string, newOrderStatus: string ) => void {
	return statusChangeStrategies[ orderStatus ] || handleGenericStatusChange;
}
