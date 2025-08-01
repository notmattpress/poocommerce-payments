/** @format */

/**
 * External dependencies
 */
import GridiconCheckmarkCircle from 'gridicons/dist/checkmark-circle';
import HelpOutlineIcon from 'gridicons/dist/help-outline';
import GridiconNotice from 'gridicons/dist/notice';
import { __, sprintf } from '@wordpress/i18n';
import interpolateComponents from '@automattic/interpolate-components';
import React from 'react';

/**
 * Internal dependencies
 */
import 'components/account-status/shared.scss';
import { ClickTooltip } from 'wcpay/components/tooltip';
import type { AccountStatus } from 'wcpay/types/account/account-status';

type DepositsStatus = 'enabled' | 'disabled' | 'blocked';
type DepositsIntervals = 'daily' | 'weekly' | 'monthly' | 'manual';

interface DepositsStatusProps {
	iconSize: number;
	interval: DepositsIntervals;
}

const getIntervalType = ( interval: DepositsIntervals ): string => {
	switch ( interval ) {
		case 'daily':
		case 'weekly':
		case 'monthly':
			return __( 'Automatic', 'poocommerce-payments' );
		case 'manual':
			return __( 'Manual', 'poocommerce-payments' );
		default:
			return __( 'Unknown', 'poocommerce-payments' );
	}
};

const DepositsStatusEnabled: React.FC< DepositsStatusProps > = ( {
	iconSize,
	interval,
} ) => {
	const description = getIntervalType( interval );
	return (
		<span className={ 'account-status__info__green' }>
			<GridiconCheckmarkCircle size={ iconSize } />
			{ description }
		</span>
	);
};

const DepositsStatusDisabled: React.FC< DepositsStatusProps > = ( {
	iconSize,
} ) => {
	return (
		<span className={ 'account-status__info__red' }>
			<GridiconNotice size={ iconSize } />
			{ __( 'Disabled', 'poocommerce-payments' ) }
		</span>
	);
};

const DepositsStatusSuspended: React.FC< DepositsStatusProps > = ( {
	iconSize,
} ) => {
	const description =
		/* translators: <a> - suspended accounts FAQ URL */
		__( 'Under Review', 'poocommerce-payments' );

	return (
		<span className={ 'account-status__info__yellow' }>
			<GridiconNotice size={ iconSize } />
			{ description }
			<ClickTooltip
				maxWidth={ '300px' }
				buttonIcon={ <HelpOutlineIcon /> }
				buttonLabel={ __(
					'Learn more about payouts suspended',
					'poocommerce-payments'
				) }
				content={ interpolateComponents( {
					mixedString: sprintf(
						/* translators: 1: WooPayments */
						__(
							// eslint-disable-next-line max-len
							'While the account is under review payouts may remain suspended. {{learnMoreLink}}Learn more{{/learnMoreLink}}',
							'poocommerce-payments'
						),
						'WooPayments'
					),
					components: {
						learnMoreLink: (
							// eslint-disable-next-line jsx-a11y/anchor-has-content
							<a
								href={
									// eslint-disable-next-line max-len
									'https://poocommerce.com/document/woopayments/payouts/why-payouts-suspended/'
								}
								target="_blank"
								rel="noreferrer"
								type="external"
							/>
						),
					},
				} ) }
			/>
		</span>
	);
};

const DepositsStatusPending: React.FC< DepositsStatusProps > = ( {
	iconSize,
} ) => {
	return (
		<span className={ 'account-status__info__gray' }>
			<GridiconNotice size={ iconSize } />
			{ __( 'Pending verification', 'poocommerce-payments' ) }
		</span>
	);
};

interface Props {
	status: DepositsStatus;
	interval: DepositsIntervals;
	accountStatus: AccountStatus;
	poEnabled: boolean;
	poComplete: boolean;
	iconSize: number;
}

const DepositsStatus: React.FC< Props > = ( {
	status,
	interval,
	accountStatus,
	iconSize,
} ) => {
	if ( status === 'blocked' || accountStatus === 'under_review' ) {
		return (
			<DepositsStatusSuspended
				iconSize={ iconSize }
				interval={ interval }
			/>
		);
	} else if ( accountStatus === 'pending_verification' ) {
		return (
			<DepositsStatusPending
				iconSize={ iconSize }
				interval={ interval }
			/>
		);
	} else if ( status === 'disabled' ) {
		return (
			<DepositsStatusDisabled
				iconSize={ iconSize }
				interval={ interval }
			/>
		);
	}

	return (
		<DepositsStatusEnabled iconSize={ iconSize } interval={ interval } />
	);
};

export default DepositsStatus;
