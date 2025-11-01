/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import React from 'react';

/**
 * Internal dependencies
 */
import './rule-description.scss';

const FraudProtectionRuleDescription: React.FC< {
	children?: React.ReactNode;
} > = ( { children } ) => {
	return (
		<div className="fraud-protection-rule-description">
			<strong>
				{ __(
					'How does this filter protect me?',
					'poocommerce-payments'
				) }
			</strong>
			<p>{ children }</p>
		</div>
	);
};

export default FraudProtectionRuleDescription;
