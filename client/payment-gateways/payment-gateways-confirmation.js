/* global jQuery, poocommerce_admin */
/**
 * External dependencies
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Internal dependencies
 */
import DisableConfirmationModal from '../disable-confirmation-modal';
import { useSettings } from 'wcpay/data';
import { recordEvent } from 'tracks';

const PaymentGatewaysConfirmation = () => {
	// pre-fetching the settings (and available payment methods) _before_ the modal is displayed,
	// so that there isn't a delay in the modal rendering
	useSettings();

	const [
		isConfirmationModalVisible,
		setIsConfirmationModalVisible,
	] = useState( false );
	const hasUserConfirmedDeactivation = useRef( false );

	const handleDialogConfirmation = useCallback( () => {
		setIsConfirmationModalVisible( false );
		hasUserConfirmedDeactivation.current = true;
		jQuery(
			'tr[data-gateway_id="poocommerce_payments"] .wc-payment-gateway-method-toggle-enabled'
		).trigger( 'click' );

		recordEvent( 'wcpay_gateway_toggle', {
			action: 'disable',
			context: 'wc-payments-settings',
		} );
	}, [ setIsConfirmationModalVisible ] );

	const handleDialogDismissal = useCallback( () => {
		setIsConfirmationModalVisible( false );
	}, [ setIsConfirmationModalVisible ] );

	useEffect( () => {
		const handler = ( event, request, settings ) => {
			if ( hasUserConfirmedDeactivation.current === true ) {
				// if the user does an "deactivate > confirm > activate > deactivate" step, we need to show the dialog again
				hasUserConfirmedDeactivation.current = false;
				return;
			}

			if ( poocommerce_admin.ajax_url !== settings.url ) {
				return;
			}

			if (
				! settings.data.includes(
					'action=poocommerce_toggle_gateway_enabled'
				) ||
				! settings.data.includes( 'gateway_id=poocommerce_payments' )
			) {
				return;
			}

			// Is the user trying to enable it or disable it?
			// if they're trying to enable it (i.e.: it's currently disabled), no need to show the modal
			if (
				jQuery(
					'tr[data-gateway_id="poocommerce_payments"] .poocommerce-input-toggle--disabled'
				).length === 1
			) {
				return;
			}

			// we arrived at this point.
			// it means that the user clicked on the deactivation of the WC Payments gateway
			// we need to show the confirmation dialog

			// first off, we need to prevent WC Core from disabling the payment method by interrupting the request
			request.abort();

			// after the request is aborted, the toggle keeps the "loading" state
			// removing the class, just to ensure the UI isn't in a _weird_ state
			jQuery(
				'tr[data-gateway_id="poocommerce_payments"] .poocommerce-input-toggle--loading'
			).removeClass( 'poocommerce-input-toggle--loading' );

			// finally, we're showing the confirmation dialog
			setIsConfirmationModalVisible( true );
		};

		jQuery( document ).on( 'ajaxSend', handler );

		return () => {
			jQuery( document ).off( 'ajaxSend', handler );
		};
	}, [] );

	if ( ! isConfirmationModalVisible ) {
		return null;
	}

	return (
		<DisableConfirmationModal
			onClose={ handleDialogDismissal }
			onConfirm={ handleDialogConfirmation }
		/>
	);
};

export default PaymentGatewaysConfirmation;
