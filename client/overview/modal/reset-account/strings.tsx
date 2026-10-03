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
	title: isInTestModeOnboarding()
		? __( 'Reset your test account', 'poocommerce-payments' )
		: __( 'Reset account', 'poocommerce-payments' ),
	description: isInTestModeOnboarding()
		? sprintf(
				/* translators: 1: WooPayments. */
				__(
					'When you reset your test account, all payment data — including your %1$s account details, test transactions, and payouts history — will be lost. Your order history will remain. This action cannot be undone, but you can create a new test account at any time.',
					'poocommerce-payments'
				),
				'WooPayments'
		  )
		: sprintf(
				/* translators: 1: WooPayments. */
				__(
					'When you reset your account, all payment data — including your %1$s account details, test transactions, and payouts history — will be lost. Your order history will remain. This action cannot be undone, but you can create a new test account at any time.',
					'poocommerce-payments'
				),
				'WooPayments'
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
