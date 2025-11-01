/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import interpolateComponents from '@automattic/interpolate-components';

/**
 * Internal dependencies
 */
import FraudProtectionRuleCard from '../rule-card';
import FraudProtectionRuleDescription from '../rule-description';
import FraudProtectionRuleCardNotice from '../rule-card-notice';
import FraudProtectionRuleToggle from '../rule-toggle';
import AllowedCountriesNotice from '../allow-countries-notice';
import { getAdminUrl } from 'wcpay/utils';
import { getSupportedCountriesType } from '../utils';

const InternationalIPAddressRuleCard: React.FC = () => {
	const supportsAllCountries = 'all' === getSupportedCountriesType();

	return (
		<FraudProtectionRuleCard
			title={ __( 'International IP Address', 'poocommerce-payments' ) }
			id="international-ip-address-card"
		>
			{ supportsAllCountries && (
				<FraudProtectionRuleCardNotice type="warning">
					{ __(
						"This filter is disabled because you're currently selling to all countries.",
						'poocommerce-payments'
					) }
				</FraudProtectionRuleCardNotice>
			) }
			{ ! supportsAllCountries && (
				<FraudProtectionRuleToggle
					setting="international_ip_address"
					label={ __(
						'Enable International IP Address filter',
						'poocommerce-payments'
					) }
					description={ interpolateComponents( {
						mixedString: __(
							'This filter screens for {{ipAddressLink}}IP addresses{{/ipAddressLink}} outside of your ' +
								'{{supportedCountriesLink}}supported countries{{/supportedCountriesLink}}. When enabled the payment will be blocked.',
							'poocommerce-payments'
						),
						components: {
							ipAddressLink: (
								// @ts-expect-error: children is provided when interpolating the component
								<ExternalLink href="https://simple.wikipedia.org/wiki/IP_address" />
							),
							supportedCountriesLink: (
								// eslint-disable-next-line jsx-a11y/anchor-has-content
								<a
									href={ getAdminUrl( {
										page: 'wc-settings',
										tab: 'general',
									} ) }
								/>
							),
						},
					} ) }
				/>
			) }
			<FraudProtectionRuleDescription>
				{ __(
					'You should be especially wary when a customer has an international IP address but uses domestic billing and ' +
						'shipping information. Fraudsters often pretend to live in one location, but live and shop from another.',
					'poocommerce-payments'
				) }
			</FraudProtectionRuleDescription>
			{ ! supportsAllCountries && (
				<AllowedCountriesNotice setting="international_ip_address" />
			) }
		</FraudProtectionRuleCard>
	);
};

export default InternationalIPAddressRuleCard;
