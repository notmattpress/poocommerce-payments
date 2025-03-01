/**
 * External dependencies
 */

import React from 'react';
import { __ } from '@wordpress/i18n';
import { Button, CheckboxControl, VisuallyHidden } from '@wordpress/components';
import interpolateComponents from '@automattic/interpolate-components';
import { getPaymentMethodSettingsUrl } from '../../utils';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { HoverTooltip } from 'components/tooltip';
import {
	useEnabledPaymentMethodIds,
	useWooPayEnabledSettings,
	useWooPayShowIncompatibilityNotice,
} from 'wcpay/data';
import WCPaySettingsContext from '../wcpay-settings-context';
import NoticeOutlineIcon from 'gridicons/dist/notice-outline';
import { WooPayIncompatibilityNotice } from '../settings-warnings/incompatibility-notice';

import { WooPayEnabledSettingsHook } from './interfaces';
import { WooIcon } from 'wcpay/payment-methods-icons';

const WooPayExpressCheckoutItem = (): React.ReactElement => {
	const [ enabledMethodIds ] = useEnabledPaymentMethodIds() as Array<
		string
	>;

	const [
		isWooPayEnabled,
		updateIsWooPayEnabled,
	] = useWooPayEnabledSettings() as WooPayEnabledSettingsHook;

	const showIncompatibilityNotice = useWooPayShowIncompatibilityNotice();

	const isStripeLinkEnabled = enabledMethodIds.includes( 'link' );

	const {
		featureFlags: { woopay: isWooPayFeatureFlagEnabled },
	} = useContext( WCPaySettingsContext );

	return (
		<>
			{ isWooPayFeatureFlagEnabled && (
				<li className="express-checkout" id="express-checkouts-woopay">
					<div className="express-checkout__row">
						<div className="express-checkout__checkbox">
							{ isStripeLinkEnabled ? (
								<div className="components-base-control components-checkbox-control">
									<div className="components-base-control__field">
										<span className="components-checkbox-control__input-container">
											<HoverTooltip
												content={ __(
													'To enable WooPay, you must first disable Link by Stripe.',
													'poocommerce-payments'
												) }
											>
												<div className="loadable-checkbox__icon">
													<NoticeOutlineIcon />
													<div
														className="loadable-checkbox__icon-warning"
														data-testid="loadable-checkbox-icon-warning"
													>
														<VisuallyHidden>
															{ __(
																'WooPay cannot be enabled at checkout. Click to expand.',
																'poocommerce-payments'
															) }
														</VisuallyHidden>
													</div>
												</div>
											</HoverTooltip>
										</span>
									</div>
								</div>
							) : (
								<CheckboxControl
									label={ __(
										'WooPay',
										'poocommerce-payments'
									) }
									checked={ isWooPayEnabled }
									onChange={ updateIsWooPayEnabled }
									data-testid="woopay-toggle"
								/>
							) }
						</div>
						<div className="express-checkout__text-container">
							<div>
								<div className="express-checkout__subgroup">
									<div className="express-checkout__icon">
										<WooIcon />
									</div>
									<div className="express-checkout__label express-checkout__label-mobile">
										{ __(
											'WooPay',
											'poocommerce-payments'
										) }
									</div>
									<div className="express-checkout__label-container">
										<div className="express-checkout__label express-checkout__label-desktop">
											{ __(
												'WooPay',
												'poocommerce-payments'
											) }
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
									href={ getPaymentMethodSettingsUrl(
										'woopay'
									) }
									isSecondary
								>
									{ __(
										'Customize',
										'poocommerce-payments'
									) }
								</Button>
							</div>
						</div>
					</div>
					{ showIncompatibilityNotice && (
						<WooPayIncompatibilityNotice />
					) }
				</li>
			) }
		</>
	);
};

export default WooPayExpressCheckoutItem;
