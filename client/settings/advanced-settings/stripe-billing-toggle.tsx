/**
 * External dependencies
 */
import React, { useContext } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import interpolateComponents from '@automattic/interpolate-components';

/**
 * Internal dependencies
 */
import { CheckboxControl } from 'wcpay/components/wp-components-wrapped/components/checkbox-control';
import { ExternalLink } from 'wcpay/components/wp-components-wrapped/components/external-link';
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
					context.isMigrationOptionShown &&
						context.migratedCount === 0
						? __(
								'Alternatively, you can enable this setting and future %s subscription purchases will also utilize' +
									' Stripe Billing for payment processing. Note: This feature supports card payments only and' +
									' may lack support for key subscription features.' +
									' {{learnMoreLink}}Learn more{{/learnMoreLink}}',
								'poocommerce-payments'
						  )
						: __(
								'By enabling this setting, future %s subscription purchases will utilize Stripe Billing for payment' +
									' processing. Note: This feature supports card payments only and may lack support for key' +
									' subscription features. {{learnMoreLink}}Learn more{{/learnMoreLink}}',
								'poocommerce-payments'
						  ),
					'WooPayments'
				),
				components: {
					learnMoreLink: (
						// eslint-disable-next-line max-len
						<ExternalLink href="https://poocommerce.com/document/woopayments/subscriptions/stripe-billing/" />
					),
				},
			} ) }
			data-testid={ 'stripe-billing-toggle' }
			__nextHasNoMarginBottom
		/>
	);
};

export default StripeBillingToggle;
