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

const AddressMismatchRuleCard: React.FC = () => (
	<FraudProtectionRuleCard
		title={ __( 'Address Mismatch', 'poocommerce-payments' ) }
		id="address-mismatch-card"
	>
		<FraudProtectionRuleToggle
			setting={ 'address_mismatch' }
			label={ __(
				'Enable Address Mismatch filter',
				'poocommerce-payments'
			) }
			description={ __(
				'This filter screens for differences between the shipping information and the ' +
					'billing information (country). When enabled the payment will be blocked.',
				'poocommerce-payments'
			) }
		/>
		<FraudProtectionRuleDescription>
			{ __(
				'There are legitimate reasons for a billing/shipping mismatch with a customer purchase, ' +
					'but a mismatch could also indicate that someone is using a stolen identity to complete a purchase.',
				'poocommerce-payments'
			) }
		</FraudProtectionRuleDescription>
	</FraudProtectionRuleCard>
);

export default AddressMismatchRuleCard;
