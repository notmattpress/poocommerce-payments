/**
 * External dependencies
 */
import React from 'react';

import { Button, Icon, Modal, ExternalLink } from '@wordpress/components';
import {
	createInterpolateElement,
	useEffect,
	useState,
} from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';
import { removeQueryArgs } from '@wordpress/url';
import { __, sprintf } from '@wordpress/i18n';
import { recordEvent } from '../tracks';

import './style.scss';

const {
	connectUrl,
	pluginScope,
} = window.wcpaySubscriptionProductOnboardingModal;

const FinishSetupButton = () => {
	const [ isFinishingSetup, setIsFinishingSetup ] = useState( false );

	return (
		<Button
			disabled={ isFinishingSetup }
			href={ connectUrl }
			isBusy={ isFinishingSetup }
			variant="primary"
			onClick={ () => {
				recordEvent(
					'wcpay_subscriptions_account_not_connected_product_modal_finish_setup'
				);
				setIsFinishingSetup( true );
			} }
			__next40pxDefaultSize
		>
			{ __( 'Finish setup', 'poocommerce-payments' ) }
		</Button>
	);
};

const SubscriptionProductOnboardingModalContent = ( {
	onRequestClose = () => {},
} ) => {
	useEffect( () => {
		recordEvent(
			'wcpay_subscriptions_account_not_connected_product_modal_view'
		);
	}, [] );

	return (
		<Modal
			className="wcpay-subscription-product-modal"
			onRequestClose={ () => {
				recordEvent(
					'wcpay_subscriptions_account_not_connected_product_modal_dismiss'
				);
				onRequestClose();
			} }
			shouldCloseOnClickOutside={ false }
		>
			<p className="wcpay-subscription-product-modal__title">
				{ __(
					'One more step to accept recurring payments',
					'poocommerce-payments'
				) }
			</p>
			<p>
				{ sprintf(
					/* translators: %s: WooPayments */
					__(
						'Verify your business details with %s to accept recurring payments for this subscription product.',
						'poocommerce-payments'
					),
					'WooPayments'
				) }
			</p>
			<p className="wcpay-subscription-product-modal__tos">
				{ createInterpolateElement(
					__(
						'By clicking "Finish setup", you agree to the <a>Terms of Service</a>',
						'poocommerce-payments'
					),
					{
						// @ts-expect-error: children is provided when interpolating the component
						a: <ExternalLink href="https://wordpress.com/tos/" />,
					}
				) }
			</p>
			<div className="wcpay-subscription-product-modal__footer">
				<div className="wcpay-subscription-product-modal__saved-indicator">
					<Icon icon="saved" />
					<p>
						{ __(
							'We’ve saved your product as a draft.',
							'poocommerce-payments'
						) }
					</p>
				</div>
				<FinishSetupButton />
			</div>
		</Modal>
	);
};

const SubscriptionProductOnboardingModal = () => {
	const [ isOpen, setOpen ] = useState( true );

	useEffect( () => {
		if ( window?.history ) {
			window.history.replaceState(
				null,
				null,
				removeQueryArgs(
					window.location.href,
					'wcpay-subscription-saved-as-draft'
				)
			);
		}
	}, [] );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<SubscriptionProductOnboardingModalContent
			onRequestClose={ () => {
				setOpen( false );
			} }
		/>
	);
};

registerPlugin( 'wcpay-subscription-product-onboarding-modal', {
	icon: null,
	render: SubscriptionProductOnboardingModal,
	scope: pluginScope,
} );
