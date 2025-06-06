/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import FraudProtectionRuleCard from '../rule-card';
import FraudProtectionRuleDescription from '../rule-description';
import FraudProtectionRuleToggle from '../rule-toggle';

const AVSMismatchRuleCard: React.FC = () => {
	return (
		<FraudProtectionRuleCard
			title={ __( 'AVS Mismatch', 'poocommerce-payments' ) }
			id="avs-mismatch-card"
		>
			<FraudProtectionRuleToggle
				setting="avs_verification"
				label={ __(
					'Enable AVS Mismatch filter',
					'poocommerce-payments'
				) }
				description={ __(
					'This filter compares the street number and the post code submitted by the customer against the data on ' +
						'file with the card issuer. When enabled the payment will be blocked.',
					'poocommerce-payments'
				) }
			/>

			<FraudProtectionRuleDescription>
				{ __(
					'Buyers who can provide the street number and post code on file with the issuing bank ' +
						'are more likely to be the actual account holder. AVS matches, however, are not a guarantee.',
					'poocommerce-payments'
				) }
			</FraudProtectionRuleDescription>
		</FraudProtectionRuleCard>
	);
};

export default AVSMismatchRuleCard;
