/**
 * External dependencies
 */
import React, { useContext } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import interpolateComponents from '@automattic/interpolate-components';

/**
 * Internal dependencies
 */
import { CheckboxControl, ExternalLink } from '@wordpress/components';
import StripeBillingMigrationNoticeContext from './stripe-billing-notices/context';

interface Props {
	/**
	 * The function to run when the checkbox is changed.
	 */
	onChange: ( enabled: boolean ) => void;
}

/**
 * Renders the Stripe Billing toggle.
 *
 * @return {JSX.Element} Rendered Stripe Billing toggle.
 */
const StripeBillingToggle: React.FC< Props > = ( { onChange } ) => {
	const context = useContext( StripeBillingMigrationNoticeContext );

	return (
		<CheckboxControl
			checked={ context.isStripeBillingEnabled }
			onChange={ onChange }
			label={ __(
				'Enable Stripe Billing for future subscriptions',
				'poocommerce-payments'
			) }
			help={ interpolateComponents( {
				mixedString: sprintf(
					__(
						'Future %s subscriptions will use Stripe Billing, which charges a 1%% fee on the full total of' +
							' any order containing a subscription. It supports card payments only and does not support' +
							' all PooCommerce Subscriptions features. {{learnMoreLink}}Learn more about' +
							' fees{{/learnMoreLink}}',
						'poocommerce-payments'
					),
					'WooPayments'
				),
				components: {
					learnMoreLink: (
						// eslint-disable-next-line max-len
						// @ts-expect-error: children is provided when interpolating the component
						<ExternalLink href="https://poocommerce.com/document/woopayments/fees/#united-states" />
					),
				},
			} ) }
			data-testid={ 'stripe-billing-toggle' }
			__nextHasNoMarginBottom
		/>
	);
};

export default StripeBillingToggle;
