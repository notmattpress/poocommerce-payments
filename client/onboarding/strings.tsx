/* eslint-disable max-len */
/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import interpolateComponents from '@automattic/interpolate-components';
import React from 'react';

const documentationUrls = {
	tos: 'https://wordpress.com/tos/',
	merchantTerms: 'https://wordpress.com/tos/#more-woopay-specifically',
	privacyPolicy: 'https://automattic.com/privacy/',
};

export default {
	steps: {
		business: {
			heading: __(
				'Let’s get your store ready to accept payments',
				'poocommerce-payments'
			),
			subheading: __(
				'We’ll use these details to enable payments for your store.',
				'poocommerce-payments'
			),
		},
		store: {
			heading: __(
				'Please share a few more details',
				'poocommerce-payments'
			),
			subheading: __(
				'This info will help us speed up the set up process.',
				'poocommerce-payments'
			),
		},
		loading: {
			heading: __(
				'One last step! Verify your identity with our partner',
				'poocommerce-payments'
			),
			subheading: __(
				'This will take place in a secure environment through our partner. Once your business details are verified, you’ll be redirected back to your store dashboard.',
				'poocommerce-payments'
			),
		},
		embedded: {
			heading: __(
				'One last step! Verify your identity with our partner',
				'poocommerce-payments'
			),
			subheading: __(
				'This info will verify your account',
				'poocommerce-payments'
			),
		},
	},
	fields: {
		country: __(
			'Where is your business legally registered?',
			'poocommerce-payments'
		),
		business_type: __(
			'What type of legal entity is your business?',
			'poocommerce-payments'
		),
		'company.structure': __(
			'What category of legal entity identify your business?',
			'poocommerce-payments'
		),
		mcc: __(
			'What type of goods or services does your business sell? ',
			'poocommerce-payments'
		),
		annual_revenue: __(
			'What is your estimated annual Ecommerce revenue (USD)?',
			'poocommerce-payments'
		),
		go_live_timeframe: __(
			'What is the estimated timeline for taking your store live?',
			'poocommerce-payments'
		),
	},
	errors: {
		generic: __( 'Please provide a response', 'poocommerce-payments' ),
		country: __( 'Please provide a country', 'poocommerce-payments' ),
		business_type: __(
			'Please provide a business type',
			'poocommerce-payments'
		),
		mcc: __(
			'Please provide a type of goods or services',
			'poocommerce-payments'
		),
	},
	placeholders: {
		generic: __( 'Select an option', 'poocommerce-payments' ),
		country: __( 'Select a country', 'poocommerce-payments' ),
		annual_revenue: __(
			'Select your annual revenue',
			'poocommerce-payments'
		),
		go_live_timeframe: __( 'Select a timeline', 'poocommerce-payments' ),
	},
	annualRevenues: {
		less_than_250k: __( 'Less than $250k', 'poocommerce-payments' ),
		from_250k_to_1m: __( '$250k - $1M', 'poocommerce-payments' ),
		from_1m_to_20m: __( '$1M - $20M', 'poocommerce-payments' ),
		from_20m_to_100m: __( '$20M - $100M', 'poocommerce-payments' ),
		more_than_100m: __( 'More than $100M', 'poocommerce-payments' ),
	},
	goLiveTimeframes: {
		already_live: __( 'My store is already live', 'poocommerce-payments' ),
		within_1month: __( 'Within 1 month', 'poocommerce-payments' ),
		from_1_to_3months: __( '1 – 3 months', 'poocommerce-payments' ),
		from_3_to_6months: __( '3 – 6 months', 'poocommerce-payments' ),
		more_than_6months: __( '6+ months', 'poocommerce-payments' ),
	},
	tos: interpolateComponents( {
		mixedString: sprintf(
			__(
				/* translators: %1$s: WooPayments, %2$s: WooPay  */
				'By using %1$s, you agree to be bound by our {{tosLink}}Terms of Service{{/tosLink}} (including {{merchantTermsLink}}%2$s merchant terms{{/merchantTermsLink}}) and acknowledge that you have read our {{privacyPolicyLink}}Privacy Policy{{/privacyPolicyLink}}.',
				'poocommerce-payments'
			),
			'WooPayments',
			'WooPay'
		),
		components: {
			tosLink: (
				// eslint-disable-next-line jsx-a11y/anchor-has-content
				<a
					rel="external noopener noreferrer"
					target="_blank"
					href={ documentationUrls.tos }
				/>
			),
			merchantTermsLink: (
				// eslint-disable-next-line jsx-a11y/anchor-has-content
				<a
					rel="external noopener noreferrer"
					target="_blank"
					href={ documentationUrls.merchantTerms }
				/>
			),
			privacyPolicyLink: (
				// eslint-disable-next-line jsx-a11y/anchor-has-content
				<a
					rel="external noopener noreferrer"
					target="_blank"
					href={ documentationUrls.privacyPolicy }
				/>
			),
		},
	} ),
	inlineNotice: {
		title: __( 'Business Location:', 'poocommerce-payments' ),
		action: __( 'Change', 'poocommerce-payments' ),
	},
	continue: __( 'Continue', 'poocommerce-payments' ),
	back: __( 'Back', 'poocommerce-payments' ),
	cancel: __( 'Cancel', 'poocommerce-payments' ),
};
