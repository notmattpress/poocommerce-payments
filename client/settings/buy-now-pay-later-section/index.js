/** @format */
/**
 * External dependencies
 */
import React from 'react';
import { Card } from 'wcpay/components/wp-components-wrapped/components/card';
import { ExternalLink } from 'wcpay/components/wp-components-wrapped/components/external-link';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PaymentMethodsList from '../payment-methods-list';
import SettingsSection from '../settings-section';
import LoadableSettingsSection from '../loadable-settings-section';
import ErrorBoundary from '../../components/error-boundary';
import { useGetAvailablePaymentMethodIds } from 'wcpay/data';
import methodsConfiguration from 'wcpay/payment-methods-map';
import CardBody from 'wcpay/settings/card-body';

const BuyNowPayLaterMethodsDescription = () => (
	<>
		<h2>{ __( 'Buy now, pay later', 'poocommerce-payments' ) }</h2>
		<p>
			{ __(
				'Boost sales by offering customers additional buying power and flexible payment options.',
				'poocommerce-payments'
			) }
		</p>

		<ExternalLink href="https://poocommerce.com/document/woopayments/payment-methods/buy-now-pay-later/">
			{ __( 'Learn more', 'poocommerce-payments' ) }
		</ExternalLink>
	</>
);

const BuyNowPayLaterSection = () => {
	const availablePaymentMethodIds = useGetAvailablePaymentMethodIds();

	const availableBuyNowPayLaterMethodIds = availablePaymentMethodIds.filter(
		( id ) =>
			methodsConfiguration[ id ] &&
			methodsConfiguration[ id ].allows_pay_later
	);

	if ( availableBuyNowPayLaterMethodIds.length === 0 ) {
		return null;
	}

	return (
		<SettingsSection
			description={ BuyNowPayLaterMethodsDescription }
			id="buy-now-pay-later-methods"
		>
			<LoadableSettingsSection numLines={ 30 }>
				<ErrorBoundary>
					<Card className="payment-methods">
						<CardBody size={ null }>
							<PaymentMethodsList
								methodIds={ availableBuyNowPayLaterMethodIds }
							/>
						</CardBody>
					</Card>
				</ErrorBoundary>
			</LoadableSettingsSection>
		</SettingsSection>
	);
};

export default BuyNowPayLaterSection;
