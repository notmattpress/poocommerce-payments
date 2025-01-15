/** @format */
/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';
import { __ } from '@wordpress/i18n';
import {
	Card,
	CheckboxControl,
	TextareaControl,
	ExternalLink,
} from '@wordpress/components';
import interpolateComponents from '@automattic/interpolate-components';
import { Link } from '@poocommerce/components';

/**
 * Internal dependencies
 */
import CardBody from '../card-body';
import WooPayFileUpload from './file-upload';
import WooPayPreview from './woopay-preview';
import {
	useWooPayEnabledSettings,
	useWooPayCustomMessage,
	useWooPayStoreLogo,
	useWooPayLocations,
	useWooPayShowIncompatibilityNotice,
	useWooPayGlobalThemeSupportEnabledSettings,
} from 'wcpay/data';
import GeneralPaymentRequestButtonSettings from './general-payment-request-button-settings';
import { WooPayIncompatibilityNotice } from '../settings-warnings/incompatibility-notice';

const WooPaySettings = ( { section } ) => {
	const [
		isWooPayEnabled,
		updateIsWooPayEnabled,
	] = useWooPayEnabledSettings();

	const [
		woopayCustomMessage,
		setWooPayCustomMessage,
	] = useWooPayCustomMessage();

	const [
		isWooPayGlobalThemeSupportEnabled,
		updateIsWooPayGlobalThemeSupportEnabled,
	] = useWooPayGlobalThemeSupportEnabledSettings();

	const [ woopayStoreLogo, setWooPayStoreLogo ] = useWooPayStoreLogo();

	const [ woopayLocations, updateWooPayLocations ] = useWooPayLocations();

	const makeLocationChangeHandler = ( location ) => ( isChecked ) => {
		if ( isChecked ) {
			updateWooPayLocations( [ ...woopayLocations, location ] );
		} else {
			updateWooPayLocations(
				woopayLocations.filter( ( name ) => name !== location )
			);
		}
	};

	const showIncompatibilityNotice = useWooPayShowIncompatibilityNotice();

	return (
		<Card
			className={ classNames( {
				'woopay-settings': true,
				'woopay-settings--appearance': section === 'appearance',
			} ) }
		>
			{ section === 'enable' && (
				<CardBody>
					{ showIncompatibilityNotice && (
						<WooPayIncompatibilityNotice />
					) }
					<CheckboxControl
						checked={ isWooPayEnabled }
						onChange={ updateIsWooPayEnabled }
						label={ __( 'Enable WooPay', 'poocommerce-payments' ) }
						help={
							/* eslint-disable jsx-a11y/anchor-has-content */
							isWooPayEnabled
								? __(
										'When enabled, customers will be able to checkout using WooPay.',
										'poocommerce-payments'
								  )
								: interpolateComponents( {
										mixedString: __(
											/* eslint-disable-next-line max-len */
											'When enabled, customers will be able to checkout using WooPay. ' +
												'In order to use {{wooPayLink}}WooPay{{/wooPayLink}}, you must agree to our ' +
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
					/>
					<h4>
						{ __(
							'Enable WooPay button on selected pages',
							'poocommerce-payments'
						) }
					</h4>
					<ul className="payment-request-settings__location">
						<li>
							<CheckboxControl
								disabled={ ! isWooPayEnabled }
								checked={
									isWooPayEnabled &&
									woopayLocations.includes( 'checkout' )
								}
								onChange={ makeLocationChangeHandler(
									'checkout'
								) }
								label={ __(
									'Checkout Page',
									'poocommerce-payments'
								) }
							/>
						</li>
						<li>
							<CheckboxControl
								disabled={ ! isWooPayEnabled }
								checked={
									isWooPayEnabled &&
									woopayLocations.includes( 'product' )
								}
								onChange={ makeLocationChangeHandler(
									'product'
								) }
								label={ __(
									'Product Page',
									'poocommerce-payments'
								) }
							/>
						</li>
						<li>
							<CheckboxControl
								disabled={ ! isWooPayEnabled }
								checked={
									isWooPayEnabled &&
									woopayLocations.includes( 'cart' )
								}
								onChange={ makeLocationChangeHandler( 'cart' ) }
								label={ __(
									'Cart Page',
									'poocommerce-payments'
								) }
							/>
						</li>
					</ul>
				</CardBody>
			) }

			{ section === 'appearance' && (
				<CardBody className="woopay-settings__appearance-card-settings">
					<div className="woopay-settings__custom-message-wrapper">
						<h4>
							{ __( 'Checkout logo', 'poocommerce-payments' ) }
						</h4>
						<WooPayFileUpload
							fieldKey="woopay-store-logo"
							accept="image/png, image/jpeg"
							disabled={ false }
							help={ __(
								'Upload a custom logo. Upload a horizontal image with a white' +
									' or transparent background for best results. Use a PNG or JPG' +
									' image format. Recommended width: 512 pixels minimum.',
								'poocommerce-payments'
							) }
							purpose="business_logo"
							fileID={ woopayStoreLogo }
							updateFileID={ setWooPayStoreLogo }
						/>
					</div>
					{ wcpaySettings.isWooPayGlobalThemeSupportEligible && (
						<div className="woopay-global-theme-support">
							<h4>
								{ __(
									'Checkout theme',
									'poocommerce-payments'
								) }
							</h4>
							<div className="woopay-settings__global-theme-checkbox">
								<CheckboxControl
									disabled={ ! isWooPayEnabled }
									checked={
										isWooPayGlobalThemeSupportEnabled
									}
									onChange={
										updateIsWooPayGlobalThemeSupportEnabled
									}
									label={
										<div className="woopay-settings__global-theme-label">
											{ __(
												'Enable global theme support',
												'poocommerce-payments'
											) }
											<span className="woopay-settings__badge">
												Beta
											</span>
										</div>
									}
									help={ interpolateComponents( {
										mixedString: __(
											'When enabled, WooPay checkout will be themed with your store’s brand colors and fonts. ' +
												'{{docs}}Learn more {{/docs}}',
											'poocommerce-payments'
										),
										components: {
											docs: (
												/* eslint-disable-next-line jsx-a11y/anchor-has-content */
												<a
													target="_blank"
													rel="noreferrer"
													// eslint-disable-next-line max-len
													href="https://poocommerce.com/document/woopay-merchant-documentation/#checkout-appearance"
												/>
											),
										},
									} ) }
								/>
							</div>
						</div>
					) }
					<div className="woopay-settings__custom-message-wrapper">
						<h4>
							{ __(
								'Checkout policies',
								'poocommerce-payments'
							) }
						</h4>
						<TextareaControl
							help={ interpolateComponents( {
								mixedString: __(
									'Override the default {{privacyLink}}privacy policy{{/privacyLink}}' +
										' and {{termsLink}}terms of service{{/termsLink}},' +
										' or add custom text to WooPay checkout. {{learnMoreLink}}Learn more{{/learnMoreLink}}.',
									'poocommerce-payments'
								),
								// prettier-ignore
								components: {
									/* eslint-disable prettier/prettier */
									privacyLink: window.wcSettings?.storePages?.privacy?.permalink ?
										<Link href={ window.wcSettings.storePages.privacy.permalink } type="external" /> :
										<span />,
									termsLink: window.wcSettings?.storePages?.terms?.permalink ?
										<Link href={ window.wcSettings.storePages.terms.permalink } type="external" /> :
										<span />,
									/* eslint-enable prettier/prettier */
									learnMoreLink: (
										// eslint-disable-next-line max-len
										<ExternalLink href="https://poocommerce.com/document/woopay-merchant-documentation/#checkout-appearance" />
									),
								}
							} ) }
							value={ woopayCustomMessage }
							onChange={ setWooPayCustomMessage }
						/>
					</div>
				</CardBody>
			) }

			{ section === 'appearance' && (
				<CardBody className="woopay-settings__appearance-card-preview">
					<div className="woopay-settings__preview">
						<h4>
							{ __(
								'Preview of checkout',
								'poocommerce-payments'
							) }
						</h4>
						<WooPayPreview
							storeName={ wcSettings.siteTitle }
							storeLogo={ woopayStoreLogo }
							customMessage={ woopayCustomMessage }
						/>
					</div>
				</CardBody>
			) }

			{ section === 'general' && (
				<GeneralPaymentRequestButtonSettings type="woopay" />
			) }
		</Card>
	);
};

export default WooPaySettings;
