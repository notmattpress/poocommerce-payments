/**
 * External dependencies
 */
import React, { useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { getAdminUrl } from 'utils';
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { Modal } from 'wcpay/components/wp-components-wrapped/components/modal';
import { Icon, currencyDollar } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockEmbedIcon from 'components/icons/block-embed';
import BlockPostAuthorIcon from 'components/icons/block-post-author';
import './style.scss';
import { recordEvent } from 'wcpay/tracks';

interface Props {
	from: string;
	source: string;
	onClose: () => void;
}

const SetupLivePaymentsModal: React.FC< Props > = ( {
	from,
	source,
	onClose,
}: Props ) => {
	const [ isSubmitted, setSubmitted ] = useState( false );
	const handleSetup = () => {
		setSubmitted( true );

		recordEvent( 'wcpay_onboarding_flow_setup_live_payments', {
			from,
			source,
		} );

		window.location.href = getAdminUrl( {
			page: 'wc-settings',
			tab: 'checkout',
			path: '/woopayments/onboarding',
			source: 'wcpay-setup-live-payments',
			from: from,
		} );
	};

	const trackAndClose = () => {
		setSubmitted( false );

		recordEvent( 'wcpay_setup_live_payments_modal_exit', {
			from,
			source,
		} );

		onClose();
	};

	return (
		<Modal
			title={ __(
				'Activate payments on your store',
				'poocommerce-payments'
			) }
			className="wcpay-setup-real-payments-modal"
			isDismissible={ true }
			onRequestClose={ trackAndClose }
		>
			<div className="wcpay-setup-real-payments-modal__content">
				<div className="wcpay-setup-real-payments-modal__content__item">
					<p>
						{ __(
							"Before continuing, please make sure that you're aware of the following:",
							'poocommerce-payments'
						) }
					</p>
				</div>
				<div className="wcpay-setup-real-payments-modal__content__item-flex">
					<div>
						<Icon icon={ BlockEmbedIcon } />
					</div>
					<p className="wcpay-setup-real-payments-modal__content__item-flex__description">
						{ __(
							'Your test account will be deactivated, but your transactions can be found in your order history.',
							'poocommerce-payments'
						) }
					</p>
				</div>
				<div className="wcpay-setup-real-payments-modal__content__item-flex">
					<div>
						<Icon icon={ BlockPostAuthorIcon } />
					</div>
					<p className="wcpay-setup-real-payments-modal__content__item-flex__description">
						{ sprintf(
							/* translators: %s: WooPayments */
							__(
								'To use %s, you will need to verify your business details.',
								'poocommerce-payments'
							),
							'WooPayments'
						) }
					</p>
				</div>
				<div className="wcpay-setup-real-payments-modal__content__item-flex">
					<div>
						<Icon icon={ currencyDollar } />
					</div>
					<p className="wcpay-setup-real-payments-modal__content__item-flex__description">
						{ __(
							'In order to receive payouts, you will need to provide your bank details.',
							'poocommerce-payments'
						) }
					</p>
				</div>
			</div>
			<div className="wcpay-setup-real-payments-modal__footer">
				<Button
					variant="primary"
					isBusy={ isSubmitted }
					disabled={ isSubmitted }
					onClick={ handleSetup }
				>
					{ __( 'Activate payments', 'poocommerce-payments' ) }
				</Button>
			</div>
		</Modal>
	);
};

export default SetupLivePaymentsModal;
