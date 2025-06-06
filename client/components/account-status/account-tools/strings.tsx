/* eslint-disable max-len */
/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { isInTestModeOnboarding } from 'utils';

export default {
	title: __( 'Account Tools', 'poocommerce-payments' ),
	description: isInTestModeOnboarding()
		? __(
				'You are using a test account. If you are experiencing problems completing account setup, or wish to test with a different email/country associated with your account, you can reset your account and start from the beginning.',
				'poocommerce-payments'
		  )
		: __(
				'Payments and payouts are disabled until account setup is completed. If you are experiencing problems completing account setup, or need to change the email/country associated with your account, you can reset your account and start from the beginning.',
				'poocommerce-payments'
		  ),
	reset: __( 'Reset account', 'poocommerce-payments' ),
};
