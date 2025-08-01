/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CheckboxControl } from 'wcpay/components/wp-components-wrapped/components/checkbox-control';
import { ExternalLink } from 'wcpay/components/wp-components-wrapped/components/external-link';
import { useWCPaySubscriptions } from 'wcpay/data';
import interpolateComponents from '@automattic/interpolate-components';

const WCPaySubscriptionsToggle = () => {
	const [
		isWCPaySubscriptionsEnabled,
		isWCPaySubscriptionsEligible,
		updateIsWCPaySubscriptionsEnabled,
	] = useWCPaySubscriptions();

	const handleWCPaySubscriptionsStatusChange = ( value ) => {
		updateIsWCPaySubscriptionsEnabled( value );
	};

	/**
	 * Only show the toggle if the site doesn't have WC Subscriptions active and is eligible
	 * for wcpay subscriptions or if wcpay subscriptions are already enabled.
	 */
	return ! wcpaySettings.isSubscriptionsActive &&
		isWCPaySubscriptionsEligible ? (
		<CheckboxControl
			label={ sprintf(
				/* translators: %s: WooPayments */
				__( 'Enable Subscriptions with %s', 'poocommerce-payments' ),
				'WooPayments'
			) }
			help={ interpolateComponents( {
				mixedString: sprintf(
					/* translators: %s: WooPayments */
					__(
						'Sell subscription products and services with %s. {{learnMoreLink}}Learn more{{/learnMoreLink}}',
						'poocommerce-payments'
					),
					'WooPayments'
				),
				components: {
					learnMoreLink: (
						// eslint-disable-next-line max-len
						<ExternalLink href="https://poocommerce.com/document/woopayments/subscriptions/" />
					),
				},
			} ) }
			checked={ isWCPaySubscriptionsEnabled }
			onChange={ handleWCPaySubscriptionsStatusChange }
			__nextHasNoMarginBottom
		/>
	) : null;
};

export default WCPaySubscriptionsToggle;
