/**
 * External dependencies
 */
import React, { useState, useContext } from 'react';
import InlineNotice from 'wcpay/components/inline-notice';
import { _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import StripeBillingMigrationNoticeContext from './context';

interface Props {
	/**
	 * The number of subscriptions that have been migrated.
	 */
	completedMigrationCount: number;
}

const MigrationCompletedNotice: React.FC< Props > = ( {
	completedMigrationCount,
} ) => {
	const [ isDismissed, setIsDismissed ] = useState( false );
	const context = useContext( StripeBillingMigrationNoticeContext );

	/**
	 * Whether the notice is eligible to be shown.
	 *
	 * Note: We use `useState` here to snapshot the setting value on load.
	 * This "completed" notice should only be shown if Stripe billing was disabled on load and there there's no migration in progress.
	 */
	const [ isEligible ] = useState(
		! context.isStripeBillingEnabled && ! context.isMigrationInProgress
	);

	if ( ! isEligible || isDismissed || completedMigrationCount === 0 ) {
		return null;
	}

	return (
		<InlineNotice
			status="info"
			isDismissible={ true }
			onRemove={ () => setIsDismissed( true ) }
			className="woopayments-stripe-billing-notice"
		>
			{ sprintf(
				_n(
					'%d customer subscription was successfully migrated from Stripe off-site billing to on-site billing' +
						' powered by %s and %s.',
					'%d customer subscriptions were successfully migrated from Stripe off-site billing to on-site billing' +
						' powered by %s and %s.',
					completedMigrationCount,
					'poocommerce-payments'
				),
				completedMigrationCount,
				'Woo Subscriptions',
				'WooPayments'
			) }
		</InlineNotice>
	);
};

export default MigrationCompletedNotice;
