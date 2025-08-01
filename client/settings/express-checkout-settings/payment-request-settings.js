/** @format */
/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CardBody from '../card-body';
import { Card } from 'wcpay/components/wp-components-wrapped/components/card';
import { CheckboxControl } from 'wcpay/components/wp-components-wrapped/components/checkbox-control';
import GeneralPaymentRequestButtonSettings from './general-payment-request-button-settings';
import {
	usePaymentRequestEnabledSettings,
	usePaymentRequestLocations,
} from 'wcpay/data';
import GooglePayTestModeCompatibilityNotice from '../google-pay-test-mode-compatibility-notice';

const PaymentRequestSettings = ( { section } ) => {
	const [
		isPaymentRequestEnabled,
		updateIsPaymentRequestEnabled,
	] = usePaymentRequestEnabledSettings();

	const [
		paymentRequestLocations,
		updatePaymentRequestLocations,
	] = usePaymentRequestLocations();

	const makeLocationChangeHandler = ( location ) => ( isChecked ) => {
		if ( isChecked ) {
			updatePaymentRequestLocations( [
				...paymentRequestLocations,
				location,
			] );
		} else {
			updatePaymentRequestLocations(
				paymentRequestLocations.filter( ( name ) => name !== location )
			);
		}
	};

	return (
		<Card>
			{ section === 'enable' && (
				<CardBody className="wcpay-card-body">
					<GooglePayTestModeCompatibilityNotice />
					<CheckboxControl
						checked={ isPaymentRequestEnabled }
						onChange={ updateIsPaymentRequestEnabled }
						label={ __(
							'Enable Apple Pay / Google Pay',
							'poocommerce-payments'
						) }
						help={ __(
							'When enabled, customers who have configured Apple Pay or Google Pay enabled devices ' +
								'will be able to pay with their respective choice of Wallet.',
							'poocommerce-payments'
						) }
						__nextHasNoMarginBottom
					/>
					<h4>
						{ __(
							'Enable Apple Pay and Google Pay on selected pages',
							'poocommerce-payments'
						) }
					</h4>
					<ul className="payment-request-settings__location">
						<li>
							<CheckboxControl
								disabled={ ! isPaymentRequestEnabled }
								checked={
									isPaymentRequestEnabled &&
									paymentRequestLocations.includes(
										'checkout'
									)
								}
								onChange={ makeLocationChangeHandler(
									'checkout'
								) }
								label={ __(
									'Checkout Page',
									'poocommerce-payments'
								) }
								__nextHasNoMarginBottom
							/>
						</li>
						<li>
							<CheckboxControl
								disabled={ ! isPaymentRequestEnabled }
								checked={
									isPaymentRequestEnabled &&
									paymentRequestLocations.includes(
										'product'
									)
								}
								onChange={ makeLocationChangeHandler(
									'product'
								) }
								label={ __(
									'Product Page',
									'poocommerce-payments'
								) }
								__nextHasNoMarginBottom
							/>
						</li>
						<li>
							<CheckboxControl
								disabled={ ! isPaymentRequestEnabled }
								checked={
									isPaymentRequestEnabled &&
									paymentRequestLocations.includes( 'cart' )
								}
								onChange={ makeLocationChangeHandler( 'cart' ) }
								label={ __(
									'Cart Page',
									'poocommerce-payments'
								) }
								__nextHasNoMarginBottom
							/>
						</li>
					</ul>
				</CardBody>
			) }

			{ section === 'general' && (
				<GeneralPaymentRequestButtonSettings type="google/apple" />
			) }
		</Card>
	);
};

export default PaymentRequestSettings;
