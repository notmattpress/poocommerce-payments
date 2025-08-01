/**
 * External dependencies
 */
import React, { ComponentProps, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import interpolateComponents from '@automattic/interpolate-components';
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { Notice } from 'wcpay/components/wp-components-wrapped/components/notice';
import { Modal } from 'wcpay/components/wp-components-wrapped/components/modal';
import { ExternalLink } from 'wcpay/components/wp-components-wrapped/components/external-link';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { getPaymentMethodsUrl } from 'utils';
import {
	makeTosAcceptanceRequest,
	maybeTrackStripeConnected,
} from '../request';
import './style.scss';

const TosLink = ( props: ComponentProps< typeof ExternalLink > ) => (
	<ExternalLink { ...props } href="https://wordpress.com/tos" />
);

const TosModalUI = ( {
	onAccept,
	onDecline,
	isBusy,
	hasError,
}: {
	onAccept: () => void;
	onDecline: () => void;
	isBusy: boolean;
	hasError: boolean;
} ) => {
	const title = sprintf(
		/* translators: %s: WooPayments */
		__( '%s: Terms of Service', 'poocommerce-payments' ),
		'WooPayments'
	);
	const message = interpolateComponents( {
		mixedString: sprintf(
			/* translators: %s: WooPayments */
			__(
				'To continue using %s, please review and agree to our {{link}}Terms of Service{{/link}}.' +
					' By clicking “Accept” you agree to the Terms of Service.',
				'poocommerce-payments'
			),
			'WooPayments'
		),
		components: { link: <TosLink /> },
	} );

	return (
		<Modal
			title={ title }
			isDismissible={ false }
			shouldCloseOnClickOutside={ false }
			shouldCloseOnEsc={ false }
			onRequestClose={ onDecline }
			className="poocommerce-payments__tos-modal"
		>
			{ hasError && (
				<Notice
					status="error"
					isDismissible={ false }
					className="poocommerce-payments__tos-error"
				>
					{ __(
						'Something went wrong. Please try accepting the Terms of Service again!',
						'poocommerce-payments'
					) }
				</Notice>
			) }
			<div className="poocommerce-payments__tos-wrapper">
				<div className="poocommerce-payments__tos-modal-message">
					{ message }
				</div>
				<div className="poocommerce-payments__tos-footer">
					<Button
						isSecondary
						onClick={ onDecline }
						disabled={ isBusy }
					>
						{ __( 'Decline', 'poocommerce-payments' ) }
					</Button>

					<Button isPrimary onClick={ onAccept } isBusy={ isBusy }>
						{ __( 'Accept', 'poocommerce-payments' ) }
					</Button>
				</div>
			</div>
		</Modal>
	);
};

const DisableModalUI = ( {
	onDisable,
	onCancel,
	isBusy,
	hasError,
}: {
	onDisable: () => void;
	onCancel: () => void;
	isBusy: boolean;
	hasError: boolean;
} ) => {
	const title = sprintf(
		/* translators: %s: WooPayments */
		__( 'Disable %s', 'poocommerce-payments' ),
		'WooPayments'
	);
	const message = interpolateComponents( {
		mixedString: sprintf(
			/* translators: %s: WooPayments */
			__(
				'By declining our {{link}}Terms of Service{{/link}},' +
					' you’ll no longer be able to capture credit card payments using %s.' +
					' Your previous transaction and payout data will still be available.',
				'poocommerce-payments'
			),
			'WooPayments'
		),
		components: { link: <TosLink /> },
	} );

	return (
		<Modal
			title={ title }
			isDismissible={ false }
			shouldCloseOnClickOutside={ false }
			shouldCloseOnEsc={ false }
			onRequestClose={ onDisable }
			className="poocommerce-payments__tos-modal"
		>
			{ hasError && (
				<Notice
					status="error"
					isDismissible={ false }
					className="poocommerce-payments__tos-error"
				>
					{ __(
						'Something went wrong. Please try again!',
						'poocommerce-payments'
					) }
				</Notice>
			) }

			<div className="poocommerce-payments__tos-wrapper">
				<div className="poocommerce-payments__tos-modal-message">
					{ message }
				</div>
				<div className="poocommerce-payments__tos-footer">
					<Button isTertiary onClick={ onCancel } isBusy={ isBusy }>
						{ __( 'Back', 'poocommerce-payments' ) }
					</Button>

					<Button isPrimary onClick={ onDisable } isBusy={ isBusy }>
						{ __( 'Disable', 'poocommerce-payments' ) }
					</Button>
				</div>
			</div>
		</Modal>
	);
};

const TosModal = () => {
	const [ isTosModalOpen, setIsTosModalOpen ] = useState( true );
	const [ isDisableModalOpen, setIsDisableModalOpen ] = useState( false );
	const [ isBusy, setIsBusy ] = useState( false );
	const [ hasAcceptanceError, setAcceptanceError ] = useState( false );
	const [ hasDeclineError, setDeclineError ] = useState( false );

	const closeTosModal = () => setIsTosModalOpen( false );
	const closeDisableModal = () => setIsDisableModalOpen( false );

	const declineTos = () => {
		closeTosModal();
		setIsDisableModalOpen( true );
	};

	const acceptTos = async () => {
		try {
			setAcceptanceError( false );
			setIsBusy( true );
			await makeTosAcceptanceRequest( { accept: true } );
			maybeTrackStripeConnected();
			closeTosModal();
		} catch ( err ) {
			setAcceptanceError( true );
		} finally {
			setIsBusy( false );
		}
	};
	const disablePlugin = async () => {
		try {
			setDeclineError( false );
			setIsBusy( true );
			await makeTosAcceptanceRequest( { accept: false } );
			closeDisableModal();
			window.location.href = addQueryArgs( getPaymentMethodsUrl(), {
				'tos-disabled': 1,
			} );
		} catch ( err ) {
			setDeclineError( true );
		} finally {
			setIsBusy( false );
		}
	};

	const cancelPluginDisable = () => {
		closeDisableModal();
		setIsTosModalOpen( true );
	};

	if ( isDisableModalOpen ) {
		return (
			<DisableModalUI
				onDisable={ disablePlugin }
				onCancel={ cancelPluginDisable }
				isBusy={ isBusy }
				hasError={ hasDeclineError }
			/>
		);
	}

	if ( isTosModalOpen ) {
		return (
			<TosModalUI
				onAccept={ acceptTos }
				onDecline={ declineTos }
				isBusy={ isBusy }
				hasError={ hasAcceptanceError }
			/>
		);
	}

	return null;
};

export default TosModal;
