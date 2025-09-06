/* eslint-disable max-len */
/**
 * External dependencies
 */
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import interpolateComponents from '@automattic/interpolate-components';

export default {
	button: {
		// CTA label to use when there isn't a working WPCOM/Jetpack connection.
		jetpack_not_connected: __(
			'Connect your store',
			'poocommerce-payments'
		),
		// CTA label to use when there is a working WPCOM/Jetpack connection but no Stripe account connected.
		account_not_connected: __(
			'Verify business details',
			'poocommerce-payments'
		),
		// CTA label to use when there is a working WPCOM/Jetpack connection and a Stripe account connected,
		// but only partially onboarded (not valid).
		account_invalid: __(
			'Finish business details verifications',
			'poocommerce-payments'
		),
		sandbox: __( 'Create test account', 'poocommerce-payments' ),
		reset: __( 'Reset account', 'poocommerce-payments' ),
	},
	heading: ( firstName?: string ): string =>
		sprintf(
			/* translators: %s: first name of the merchant, if it exists, %s: WooPayments. */
			__( 'Hi%s, Welcome to %s!', 'poocommerce' ),
			firstName ? ` ${ firstName }` : '',
			'WooPayments'
		),
	paymentMethods: {
		deposits: {
			title: __( 'Payouts', 'poocommerce-payments' ),
			value: __( 'Automatic - Daily', 'poocommerce-payments' ),
		},
		capture: {
			title: __( 'Payments capture', 'poocommerce-payments' ),
			value: __( 'Capture on order', 'poocommerce-payments' ),
		},
		recurring: {
			title: __( 'Recurring payments', 'poocommerce-payments' ),
			value: __( 'Supported', 'poocommerce-payments' ),
		},
	},
	usp1: __(
		'Offer card payments, Apple Pay, iDeal, Affirm, Afterpay, and accept in-person payments with the Woo mobile app.',
		'poocommerce-payments'
	),
	usp2: __(
		'Sell to international markets and accept over 135 currencies with local payment methods.',
		'poocommerce-payments'
	),
	usp3: __(
		'Earn recurring revenue and get payouts into your bank account.',
		'poocommerce-payments'
	),
	sandboxMode: {
		title: __(
			"I'm setting up a store for someone else.",
			'poocommerce-payments'
		),
		description: sprintf(
			/* translators: %s: WooPayments */
			__(
				'This option will set up a %s test account using test data. When you’re ready to launch your store, switching to live payments is easy.',
				'poocommerce-payments'
			),
			'WooPayments'
		),
	},
	sandboxModeNotice: interpolateComponents( {
		mixedString: __(
			'Test mode is enabled, only test accounts will be created. If you want to process live transactions, please {{learnMoreLink}}disable it{{/learnMoreLink}}.',
			'poocommerce-payments'
		),
		components: {
			learnMoreLink: (
				// Link content is in the format string above. Consider disabling jsx-a11y/anchor-has-content.
				// eslint-disable-next-line jsx-a11y/anchor-has-content
				<a
					href="https://poocommerce.com/document/woopayments/testing-and-troubleshooting/sandbox-mode/"
					target="_blank"
					rel="noreferrer"
				/>
			),
		},
	} ),
	setupErrorNotice: sprintf(
		/* translators: 1: WooPayments. */
		__(
			'Please <b>complete your %1$s setup</b> to process payments.',
			'poocommerce-payments'
		),
		'WooPayments'
	),
	infoNotice: {
		description: {
			jetpack_connected: __(
				"You'll need to verify your business and payment details to ",
				'poocommerce-payments'
			),
			jetpack_not_connected: __(
				'To ensure safe and secure transactions, a WordPress.com account is required before you can verify your business details.',
				'poocommerce-payments'
			),
		},
		button: __( 'enable payouts.', 'poocommerce-payments' ),
	},
	infoModal: {
		title: sprintf(
			/* translators: %s: WooPayments */
			__( 'Verifying your information with %s', 'poocommerce-payments' ),
			'WooPayments'
		),
		whyWeAsk: {
			heading: __(
				'Why we ask for personal financial information',
				'poocommerce-payments'
			),
			description: sprintf(
				/* translators: %s: WooPayments */
				__(
					"As you continue the process of signing up for %s, we'll ask for information about your business, including the business owner's date of birth and tax ID number. We know you may wonder why we ask for this information, and how it will be used. The “Know Your Customer” process, explained below, helps us provide a safe, ethical environment for all financial transactions.",
					'poocommerce-payments'
				),
				'WooPayments'
			),
		},
		whatIsKyc: {
			heading: __(
				'What is “Know Your Customer”?',
				'poocommerce-payments'
			),
			description: __(
				"“Know Your Customer” standards are used by banks and other financial institutions to confirm that customers are who they say they are. By confirming their customers' identities, banks and financial institutions can help keep transactions safe from fraud and other suspicious activities.",
				'poocommerce-payments'
			),
		},
		whyShareInfo: {
			heading: __(
				'Why do I have to share this information?',
				'poocommerce-payments'
			),
			description: __(
				"Before we build a payment relationship with a customer, we ask for the information listed above to validate the business owner's identity and tax ID number, and to ensure that we can connect the listed bank account with the business itself.",
				'poocommerce-payments'
			),
			description2: __(
				'The ultimate goal of the “Know Your Customer” process is to help your business get up and running with payments as soon as possible while protecting your business and your customers. We follow the same regulations as other financial institutions so that we can ensure we operate in an ethical and trustworthy manner. We want to protect your business and the payments that we manage for you. The “Know Your Customer” process helps us protect you.',
				'poocommerce-payments'
			),
		},
		whatElse: {
			heading: __(
				'What else should I keep in mind while completing this process?',
				'poocommerce-payments'
			),
			description: sprintf(
				/* translators: %s: WooPayments */
				__(
					"If you're setting up %s for someone else, it's best to have that person complete the account creation process. As you can see above, we ask for very specific information about the business owner - and you might not have all the details at hand. It's not always possible to change account information once it's been saved, especially if the site accepts live transactions before the correct account information is entered.",
					'poocommerce-payments'
				),
				'WooPayments'
			),
		},
		isMyDataSafe: {
			heading: sprintf(
				/* translators: %s: WooPayments */
				__( 'Is my data safe with %s?', 'poocommerce-payments' ),
				'WooPayments'
			),
			description: sprintf(
				/* translators: %s: WooPayments */
				__(
					'We take every step required to safeguard your personal data. %s is built in partnership with Stripe to store your data in a safe and secure manner.',
					'poocommerce-payments'
				),
				'WooPayments'
			),
		},
		howQuickly: {
			heading: __(
				'How quickly will you confirm my identity and allow me to process payments?',
				'poocommerce-payments'
			),
			description: __(
				"We'll do our best to work with Stripe to confirm your identity as quickly as we can. Typically, we'll confirm your application within a couple of days.",
				'poocommerce-payments'
			),
		},
		whatInformation: {
			heading: __(
				'What information should I have at hand before I start the “Know Your Customer” process?',
				'poocommerce-payments'
			),
			description: __(
				"Here's a brief list of the information you'll need to finish payment signup:"
			),
		},
		businessOwnerInfo: {
			heading: __( 'Business owner info:', 'poocommerce-payments' ),
			fields: [
				__( 'Legal name', 'poocommerce-payments' ),
				__( 'Date of birth', 'poocommerce-payments' ),
				__( 'Home address', 'poocommerce-payments' ),
				__( 'Email address', 'poocommerce-payments' ),
				__( 'Mobile phone number', 'poocommerce-payments' ),
				__( 'Bank account information', 'poocommerce-payments' ),
				__(
					'Social Security number (SSN) or Taxpayer Identification Number',
					'poocommerce-payments'
				),
			],
		},
		businessInfo: {
			heading: __( 'Business info:', 'poocommerce-payments' ),
			fields: [
				__(
					'Country where your business is based',
					'poocommerce-payments '
				),
				__( 'Type of business', 'poocommerce-payments ' ),
				__( 'Industry', 'poocommerce-payments ' ),
				__( 'Company address', 'poocommerce-payments ' ),
				__( 'Company phone number', 'poocommerce-payments ' ),
				__( 'Company URL', 'poocommerce-payments ' ),
			],
		},
	},
	stepsHeading: __(
		'You’re only steps away from getting paid',
		'poocommerce-payments'
	),
	step1: {
		heading: __(
			'Create and connect your account',
			'poocommerce-payments'
		),
		description: __(
			'To ensure safe and secure transactions, a WordPress.com account is required.',
			'poocommerce-payments'
		),
	},
	step2: {
		heading: __( 'Provide a few business details', 'poocommerce-payments' ),
		description: __(
			'Next we’ll ask you to verify your business and payment details to enable payouts.',
			'poocommerce-payments'
		),
	},
	step3: {
		heading: __( 'Setup complete!', 'poocommerce-payments' ),
		description: sprintf(
			/* translators: %s: WooPayments */
			__(
				'You’re ready to start using the features and benefits of %s.',
				'poocommerce-payments'
			),
			'WooPayments'
		),
	},
	onboardingDisabled: __(
		"We've temporarily paused new account creation. We'll notify you when we resume!",
		'poocommerce-payments'
	),
	incentive: {
		limitedTimeOffer: __( 'Limited time offer', 'poocommerce-payments' ),
		details: __(
			'Discount will be applied to payments processed via WooPayments upon completion of installation, setup, and connection.',
			'poocommerce-payments'
		),
		termsAndConditions: ( url: string ): JSX.Element =>
			createInterpolateElement(
				__(
					'*See <a>Terms and Conditions</a> for details.',
					'poocommerce-payments'
				),
				{
					a: (
						// eslint-disable-next-line jsx-a11y/anchor-has-content
						<a
							href={ url }
							target="_blank"
							rel="noopener noreferrer"
						/>
					),
				}
			),
		error: __(
			'There was an error applying the promotion. Please contact support for assistance if the problem persists',
			'poocommerce-payments'
		),
	},
	nonSupportedCountry: createInterpolateElement(
		sprintf(
			/* translators: %1$s: WooPayments */
			__(
				'<b>%1$s is not currently available in your location</b>. To be eligible for %1$s, your business address must be in one of the following <a>supported countries</a>.',
				'poocommerce-payments'
			),
			'WooPayments'
		),
		{
			b: <b />,
			a: (
				// eslint-disable-next-line jsx-a11y/anchor-has-content
				<a
					href="https://poocommerce.com/document/woopayments/compatibility/countries/"
					target="_blank"
					rel="noopener noreferrer"
				/>
			),
		}
	),
};
