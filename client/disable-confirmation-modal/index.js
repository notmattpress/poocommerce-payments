/**
 * External dependencies
 */
import React from 'react';
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { __, sprintf } from '@wordpress/i18n';
import interpolateComponents from '@automattic/interpolate-components';

/**
 * Internal dependencies
 */
import './styles.scss';
import {
	useEnabledPaymentMethodIds,
	usePaymentRequestEnabledSettings,
	useWooPayEnabledSettings,
} from '../data';
import PaymentMethodIcon from '../settings/payment-method-icon';
import PaymentDeleteIllustration from '../components/payment-delete-illustration';
import WooCardIcon from 'assets/images/cards/woo-card.svg?asset';
import ConfirmationModal from '../components/confirmation-modal';
import paymentMethodsMap from 'wcpay/payment-methods-map';
import {
	ApplePayIcon,
	GooglePayIcon,
	LinkIcon,
	WooIconShort,
} from 'wcpay/payment-methods-icons';

const DisableConfirmationModal = ( { onClose, onConfirm } ) => {
	const [ enabledMethodIds ] = useEnabledPaymentMethodIds();
	const [ isWooPayEnabled ] = useWooPayEnabledSettings();
	const [ isPaymentRequestEnabled ] = usePaymentRequestEnabledSettings();
	const isStripeLinkEnabled = Boolean(
		enabledMethodIds.find( ( id ) => id === 'link' )
	);

	return (
		<ConfirmationModal
			title={ sprintf(
				/* translators: %s: WooPayments */
				__( 'Disable %s', 'poocommerce-payments' ),
				'WooPayments'
			) }
			onRequestClose={ onClose }
			actions={
				<>
					<Button onClick={ onConfirm } isPrimary isDestructive>
						Disable
					</Button>
					<Button onClick={ onClose } isSecondary>
						Cancel
					</Button>
				</>
			}
		>
			<PaymentDeleteIllustration
				icon={ ( props ) => (
					<img src={ WooCardIcon } alt="WooCard" { ...props } />
				) }
			/>
			<p>
				{ interpolateComponents( {
					mixedString: sprintf(
						/* translators: %s: WooPayments */
						__(
							'%s is currently powering multiple popular payment methods on your store.' +
								' Without it, they will no longer be available to your customers, which may influence sales.',
							'poocommerce-payments'
						),
						'WooPayments'
					),
					components: {
						strong: <strong />,
					},
				} ) }
			</p>
			<p>
				{ sprintf(
					/* translators: %s: WooPayments */
					__(
						'Payment methods that need %s:',
						'poocommerce-payments'
					),
					'WooPayments'
				) }
			</p>
			<ul className="disable-confirmation-modal__payment-methods-list">
				{ enabledMethodIds
					.filter( ( methodId ) => methodId !== 'link' )
					.map( ( methodId ) => (
						<li key={ methodId }>
							<PaymentMethodIcon
								Icon={ paymentMethodsMap[ methodId ].icon }
								label={ paymentMethodsMap[ methodId ].label }
							/>
						</li>
					) ) }
				{ isPaymentRequestEnabled && (
					<>
						<li>
							<PaymentMethodIcon
								Icon={ GooglePayIcon }
								label={ __(
									'Google Pay',
									'poocommerce-payments'
								) }
							/>
						</li>
						<li>
							<PaymentMethodIcon
								Icon={ ApplePayIcon }
								label={ __(
									'Apple Pay',
									'poocommerce-payments'
								) }
							/>
						</li>
					</>
				) }
				{ isStripeLinkEnabled && (
					<li>
						<PaymentMethodIcon
							Icon={ LinkIcon }
							label={ __(
								'Link by Stripe',
								'poocommerce-payments'
							) }
						/>
					</li>
				) }
				{ isWooPayEnabled && (
					<li>
						<PaymentMethodIcon
							Icon={ WooIconShort }
							label={ __( 'WooPay', 'poocommerce-payments' ) }
						/>
					</li>
				) }
			</ul>
			<p className="no-padding">
				{ interpolateComponents( {
					mixedString: sprintf(
						/* translators: %s: WooPayments */
						__(
							'{{strong}}Need help?{{/strong}} ' +
								'Learn more about {{wooCommercePaymentsLink}}%s{{/wooCommercePaymentsLink}} or ' +
								'{{contactSupportLink}}contact PooCommerce Support{{/contactSupportLink}}.',
							'poocommerce-payments'
						),
						'WooPayments'
					),
					components: {
						strong: <strong />,
						wooCommercePaymentsLink: (
							// eslint-disable-next-line jsx-a11y/anchor-has-content
							<a href="https://poocommerce.com/document/woopayments/" />
						),
						contactSupportLink: (
							// eslint-disable-next-line jsx-a11y/anchor-has-content
							<a href="https://poocommerce.com/my-account/create-a-ticket/?select=5278104" />
						),
					},
				} ) }
			</p>
		</ConfirmationModal>
	);
};

export default DisableConfirmationModal;
