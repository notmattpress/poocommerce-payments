/* eslint-disable max-len */
/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { isInTestModeOnboarding } from 'utils';

export default {
	title: __( 'Reset account', 'poocommerce-payments' ),
	description: isInTestModeOnboarding()
		? __(
				'In sandbox mode, you can reset your account and onboard again at any time. Please note that all current WooPayments account details, test transactions, and payouts history will be lost.',
				'poocommerce-payments'
		  )
		: __(
				'If you are experiencing problems completing account setup, or need to change the email/country associated with your account, you can reset your account and start from the beginning.',
				'poocommerce-payments'
		  ),
	beforeContinue: __( 'Before you continue', 'poocommerce-payments' ),
	step1: sprintf(
		/* translators: %s: WooPayments. */
		__(
			'Your %s account will be reset, and all data will be lost.',
			'poocommerce-payments'
		),
		'WooPayments'
	),
	step2: __(
		'You will have to re-confirm your business and banking details.',
		'poocommerce-payments'
	),
	step3: __(
		'Once confirmed, this cannot be undone.',
		'poocommerce-payments'
	),
	confirmation: __(
		'Are you sure you want to continue?',
		'poocommerce-payments'
	),
	cancel: __( 'Cancel', 'poocommerce-payments' ),
	reset: __( 'Yes, reset account', 'poocommerce-payments' ),
};
