/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import interpolateComponents from '@automattic/interpolate-components';
import React, { useContext } from 'react';

/**
 * Internal dependencies
 */
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { CheckboxControl } from 'wcpay/components/wp-components-wrapped/components/checkbox-control';
import { getPaymentMethodSettingsUrl } from '../../utils';
import { usePaymentRequestEnabledSettings } from 'wcpay/data';
import { ApplePayIcon, GooglePayIcon } from 'wcpay/payment-methods-icons';
import DuplicateNotice from 'wcpay/components/duplicate-notice';
import DuplicatedPaymentMethodsContext from '../settings-manager/duplicated-payment-methods-context';
import GooglePayTestModeCompatibilityNotice from '../google-pay-test-mode-compatibility-notice';

const AppleGooglePayExpressCheckoutItem = (): React.ReactElement => {
	const id = 'apple_pay_google_pay';

	const [
		isPaymentRequestEnabled,
		updateIsPaymentRequestEnabled,
	] = usePaymentRequestEnabledSettings();

	const {
		duplicates,
		dismissedDuplicateNotices,
		setDismissedDuplicateNotices,
	} = useContext( DuplicatedPaymentMethodsContext );
	const isDuplicate = Object.keys( duplicates ).includes( id );

	return (
		<li
			className="express-checkout"
			id="express-checkouts-apple-google-pay"
		>
			<div className="express-checkout__row">
				<div className="express-checkout__checkbox">
					<CheckboxControl
						label={ __(
							'Apple Pay / Google Pay',
							'poocommerce-payments'
						) }
						checked={ isPaymentRequestEnabled }
						onChange={ updateIsPaymentRequestEnabled }
						__nextHasNoMarginBottom
					/>
				</div>
				<div className="express-checkout__text-container">
					<div>
						<div className="express-checkout__subgroup">
							<div className="express-checkout__icon">
								<ApplePayIcon />
							</div>
							<div className="express-checkout__label express-checkout__label-mobile">
								{ __( 'Apple Pay', 'poocommerce-payments' ) }
							</div>
							<div className="express-checkout__label-container">
								<div className="express-checkout__label express-checkout__label-desktop">
									{ __(
										'Apple Pay',
										'poocommerce-payments'
									) }
								</div>
								<div className="express-checkout__description">
									{
										/* eslint-disable jsx-a11y/anchor-has-content */
										isPaymentRequestEnabled
											? __(
													'Apple Pay is an easy and secure way for customers to pay on your store.',
													'poocommerce-payments'
											  )
											: interpolateComponents( {
													mixedString: __(
														/* eslint-disable-next-line max-len */
														'Apple Pay is an easy and secure way for customers to pay on your store. ' +
															/* eslint-disable-next-line max-len */
															'By enabling this feature, you agree to {{stripeLink}}Stripe{{/stripeLink}} and' +
															"{{appleLink}} Apple{{/appleLink}}'s terms of use.",
														'poocommerce-payments'
													),
													components: {
														stripeLink: (
															<a
																target="_blank"
																rel="noreferrer"
																href="https://stripe.com/apple-pay/legal"
															/>
														),
														appleLink: (
															<a
																target="_blank"
																rel="noreferrer"
																/* eslint-disable-next-line max-len */
																href="https://developer.apple.com/apple-pay/acceptable-use-guidelines-for-websites/"
															/>
														),
														br: <br />,
													},
											  } )
										/* eslint-enable jsx-a11y/anchor-has-content */
									}
								</div>
							</div>
						</div>
						<div className="express-checkout__subgroup">
							<div className="express-checkout__icon">
								<GooglePayIcon />
							</div>
							<div className="express-checkout__label express-checkout__label-mobile">
								{ __( 'Google Pay', 'poocommerce-payments' ) }
							</div>
							<div className="express-checkout__label-container">
								<div className="express-checkout__label express-checkout__label-desktop">
									{ __(
										'Google Pay',
										'poocommerce-payments'
									) }
								</div>
								<div className="express-checkout__description">
									{
										/* eslint-disable jsx-a11y/anchor-has-content */
										isPaymentRequestEnabled
											? __(
													'Offer customers a fast, secure checkout experience with Google Pay.',
													'poocommerce-payments'
											  )
											: interpolateComponents( {
													mixedString: __(
														/* eslint-disable-next-line max-len */
														'Offer customers a fast, secure checkout experience with Google Pay. ' +
															/* eslint-disable-next-line max-len */
															'By enabling this feature, you agree to {{stripeLink}}Stripe{{/stripeLink}}, ' +
															"and {{googleLink}}Google{{/googleLink}}'s terms of use.",
														'poocommerce-payments'
													),
													components: {
														stripeLink: (
															<a
																target="_blank"
																rel="noreferrer"
																href="https://stripe.com/apple-pay/legal"
															/>
														),
														googleLink: (
															<a
																target="_blank"
																rel="noreferrer"
																href="https://androidpay.developers.google.com/terms/sellertos"
															/>
														),
														br: <br />,
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
								'payment_request'
							) }
							isSecondary
						>
							{ __( 'Customize', 'poocommerce-payments' ) }
						</Button>
					</div>
				</div>
			</div>
			<GooglePayTestModeCompatibilityNotice />
			{ isDuplicate && (
				<DuplicateNotice
					paymentMethod={ id }
					gatewaysEnablingPaymentMethod={ duplicates[ id ] }
					dismissedNotices={ dismissedDuplicateNotices }
					setDismissedDuplicateNotices={
						setDismissedDuplicateNotices
					}
				/>
			) }
		</li>
	);
};

export default AppleGooglePayExpressCheckoutItem;
