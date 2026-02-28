/**
 * External dependencies
 */

import React from 'react';
import { __ } from '@wordpress/i18n';
import interpolateComponents from '@automattic/interpolate-components';
import { getPaymentMethodSettingsUrl } from '../../utils';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button, CheckboxControl } from '@wordpress/components';
import {
	useEnabledPaymentMethodIds,
	useWooPayEnabledSettings,
	useWooPayShowIncompatibilityNotice,
} from 'wcpay/data';
import WCPaySettingsContext from '../wcpay-settings-context';
import { WooPayIncompatibilityNotice } from '../settings-warnings/incompatibility-notice';

import { WooIcon } from 'wcpay/payment-methods-icons';
import InlineNotice from 'wcpay/components/inline-notice';

const WooPayExpressCheckoutItem = (): React.ReactElement | null => {
	const [ enabledMethodIds ] = useEnabledPaymentMethodIds();

	const [
		isWooPayEnabled,
		updateIsWooPayEnabled,
	] = useWooPayEnabledSettings();

	const isStripeLinkEnabled = enabledMethodIds.includes( 'link' );

	const showIncompatibilityNotice =
		useWooPayShowIncompatibilityNotice() && ! isStripeLinkEnabled;

	const {
		featureFlags: { woopay: isWooPayFeatureFlagEnabled },
	} = useContext( WCPaySettingsContext );

	if ( ! isWooPayFeatureFlagEnabled ) {
		return null;
	}

	return (
		<li className="express-checkout" id="express-checkouts-woopay">
			<div className="express-checkout__row">
				<div className="express-checkout__checkbox">
					<CheckboxControl
						label={ __( 'WooPay', 'poocommerce-payments' ) }
						checked={ isWooPayEnabled }
						disabled={ isStripeLinkEnabled }
						onChange={ updateIsWooPayEnabled }
						data-testid="woopay-toggle"
						__nextHasNoMarginBottom
					/>
				</div>
				<div className="express-checkout__text-container">
					<div>
						<div className="express-checkout__subgroup">
							<div className="express-checkout__icon">
								<WooIcon />
							</div>
							<div className="express-checkout__label express-checkout__label-mobile">
								{ __( 'WooPay', 'poocommerce-payments' ) }
							</div>
							<div className="express-checkout__label-container">
								<div className="express-checkout__label express-checkout__label-desktop">
									{ __( 'WooPay', 'poocommerce-payments' ) }
								</div>
								<div className="express-checkout__description">
									{
										/* eslint-disable jsx-a11y/anchor-has-content */
										isWooPayEnabled
											? __(
													'Boost conversion and customer loyalty by' +
														' offering a single click, secure way to pay.',
													'poocommerce-payments'
											  )
											: interpolateComponents( {
													mixedString: __(
														/* eslint-disable-next-line max-len */
														'Boost conversion and customer loyalty by offering a single click, secure way to pay. ' +
															'In order to use {{wooPayLink}}WooPay{{/wooPayLink}},' +
															' you must agree to our ' +
															'{{tosLink}}PooCommerce Terms of Service{{/tosLink}} ' +
															'and {{privacyLink}}Privacy Policy{{/privacyLink}}. ' +
															'{{trackingLink}}Click here{{/trackingLink}} to learn more about the ' +
															'data you will be sharing and opt-out options.',
														'poocommerce-payments'
													),
													components: {
														wooPayLink: (
															<a
																target="_blank"
																rel="noreferrer"
																// eslint-disable-next-line max-len
																href="https://poocommerce.com/document/woopay-merchant-documentation/"
															/>
														),
														tosLink: (
															<a
																target="_blank"
																rel="noreferrer"
																href="https://wordpress.com/tos/"
															/>
														),
														privacyLink: (
															<a
																target="_blank"
																rel="noreferrer"
																href="https://automattic.com/privacy/"
															/>
														),
														trackingLink: (
															<a
																target="_blank"
																rel="noreferrer"
																href="https://poocommerce.com/usage-tracking/"
															/>
														),
													},
											  } )
										/* eslint-enable jsx-a11y/anchor-has-content */
									}
								</div>
							</div>
						</div>
					</div>

					<div className="express-checkout__link">
						<Button
							href={ getPaymentMethodSettingsUrl( 'woopay' ) }
							isSecondary
						>
							{ __( 'Customize', 'poocommerce-payments' ) }
						</Button>
					</div>
				</div>
			</div>
			{ isStripeLinkEnabled && (
				<InlineNotice status="warning" isDismissible={ false }>
					{ __(
						'To enable WooPay, you must first disable Link by Stripe.',
						'poocommerce-payments'
					) }
				</InlineNotice>
			) }
			{ showIncompatibilityNotice && <WooPayIncompatibilityNotice /> }
		</li>
	);
};

export default WooPayExpressCheckoutItem;
