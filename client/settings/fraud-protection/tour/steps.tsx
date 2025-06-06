/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import interpolateComponents from '@automattic/interpolate-components';

const enhancedFraudProtectionStep = {
	referenceElements: {
		desktop: '#fp-settings',
	},
	meta: {
		name: 'enhanced-fraud-protection',
		heading: __( 'Enhanced fraud protection 🔒', 'poocommerce-payments' ),
		descriptions: {
			desktop: __(
				'You can choose a level of protection for screening incoming transactions. Screened transactions will be automatically blocked by your customized fraud filters.',
				'poocommerce-payments'
			),
		},
		primaryButton: {
			text: __( "See what's new", 'poocommerce-payments' ),
		},
	},
};

const chooseYourFilterLevelStep = {
	referenceElements: {
		desktop: '#fraud-protection-card-options',
	},
	meta: {
		name: 'choose-your-filter-level',
		heading: __( 'Choose your filter level 🚦', 'poocommerce-payments' ),
		descriptions: {
			desktop: __(
				"Choose how you'd like to screen incoming transactions using our Basic or Advanced options.",
				'poocommerce-payments'
			),
		},
	},
};

const takeMoreControlStep = {
	referenceElements: {
		desktop: '[for=fraud-protection-level-select_advanced-level]',
	},
	meta: {
		name: 'take-more-control',
		heading: __( 'Take more control 🎚️', 'poocommerce-payments' ),
		descriptions: {
			desktop: __(
				'Choose Advanced settings for full control over each filter. You can enable and configure filters to block risky transactions.',
				'poocommerce-payments'
			),
		},
	},
};

const readyForReviewStep = {
	referenceElements: {
		desktop: '#toplevel_page_wc-admin-path--payments-overview',
		mobile: '.tour-kit poocommerce-tour-kit',
	},
	meta: {
		name: 'review-blocked-transactions',
		heading: __(
			'Review blocked transactions 📥️',
			'poocommerce-payments'
		),
		descriptions: {
			desktop: interpolateComponents( {
				mixedString: __(
					"Payments that have been blocked by a risk filter will appear under the blocked tab in {{strong}}Payments > Transactions{{/strong}}. We'll let you know why each payment was blocked so you can determine if you need to adjust your risk filters.",
					'poocommerce-payments'
				),
				components: { strong: <strong /> },
			} ),
		},
		primaryButton: {
			text: __( 'Got it', 'poocommerce-payments' ),
		},
	},
};

export const steps = [
	enhancedFraudProtectionStep,
	chooseYourFilterLevelStep,
	takeMoreControlStep,
	readyForReviewStep,
];
