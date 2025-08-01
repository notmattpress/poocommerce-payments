/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { getHistory } from '@poocommerce/navigation';

/**
 * Internal dependencies.
 */
import { getAdminUrl } from 'wcpay/utils';
import { formatExplicitCurrency } from 'multi-currency/interface/functions';
import { recordEvent } from 'tracks';
import Loadable from 'components/loadable';
import { useSelectedCurrencyOverview } from 'wcpay/overview/hooks';
import RecentDepositsList from './recent-deposits-list';
import DepositSchedule from './deposit-schedule';
import {
	DepositMinimumBalanceNotice,
	NegativeBalanceDepositsPausedNotice,
	NewAccountWaitingPeriodNotice,
	NoFundsAvailableForDepositNotice,
	SuspendedDepositNotice,
	DepositFailureNotice,
} from './deposit-notices';
import { hasAutomaticScheduledDeposits } from 'wcpay/deposits/utils';
import useRecentDeposits from './hooks';
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { Card } from 'wcpay/components/wp-components-wrapped/components/card';
import { CardBody } from 'wcpay/components/wp-components-wrapped/components/card-body';
import { CardFooter } from 'wcpay/components/wp-components-wrapped/components/card-footer';
import { CardHeader } from 'wcpay/components/wp-components-wrapped/components/card-header';
import './style.scss';

const DepositsOverview: React.FC = () => {
	const {
		account,
		overview,
		isLoading: isLoadingOverview,
	} = useSelectedCurrencyOverview();
	const isDepositsUnrestricted =
		wcpaySettings.accountStatus.deposits?.restrictions ===
		'deposits_unrestricted';
	const selectedCurrency =
		overview?.currency || wcpaySettings.accountDefaultCurrency;
	const { isLoading: isLoadingDeposits, deposits } = useRecentDeposits(
		selectedCurrency
	);

	const isLoading = isLoadingOverview || isLoadingDeposits;

	const availableFunds = overview?.available?.amount ?? 0;
	const pendingFunds = overview?.pending?.amount ?? 0;
	const totalFunds = availableFunds + pendingFunds;

	const minimumDepositAmount =
		wcpaySettings.accountStatus.deposits
			?.minimum_scheduled_deposit_amounts?.[ selectedCurrency ] ?? 0;
	const isAboveMinimumDepositAmount = availableFunds >= minimumDepositAmount;
	// If the total balance is negative, deposits may be paused.
	const isNegativeBalanceDepositsPaused = totalFunds < 0;
	// When there are funds pending but no available funds, deposits are paused.
	const isDepositAwaitingPendingFunds =
		availableFunds === 0 && pendingFunds > 0;
	const hasCompletedWaitingPeriod =
		wcpaySettings.accountStatus.deposits?.completed_waiting_period;
	const canChangeDepositSchedule =
		! account?.deposits_blocked && hasCompletedWaitingPeriod;
	// Only show the deposit history section if the page is finished loading and there are deposits. */ }
	const hasRecentDeposits = ! isLoading && deposits?.length > 0 && !! account;
	const hasScheduledDeposits = hasAutomaticScheduledDeposits(
		account?.deposits_schedule?.interval
	);
	const hasErroredExternalAccount =
		account?.default_external_accounts?.some(
			( externalAccount ) =>
				externalAccount.currency === selectedCurrency &&
				externalAccount.status === 'errored'
		) ?? false;

	const navigateToDepositsHistory = () => {
		recordEvent( 'wcpay_overview_deposits_view_history_click' );

		const history = getHistory();
		history.push(
			getAdminUrl( {
				page: 'wc-admin',
				path: '/payments/payouts',
			} )
		);
	};

	// Show a loading state if the page is still loading.
	if ( isLoading ) {
		return (
			<Card className="wcpay-deposits-overview">
				<CardHeader>
					{ __( 'Payouts', 'poocommerce-payments' ) }
				</CardHeader>

				<CardBody className="wcpay-deposits-overview__schedule__container">
					<Loadable
						isLoading
						placeholder={
							<DepositSchedule
								depositsSchedule={ {
									delay_days: 0,
									interval: 'daily',
									monthly_anchor: 1,
									weekly_anchor: 'monday',
								} }
							/>
						}
					/>
				</CardBody>
			</Card>
		);
	}

	if (
		! hasCompletedWaitingPeriod &&
		availableFunds === 0 &&
		pendingFunds === 0
	) {
		// If still in new account waiting period and account has no transactions,
		// don't render deposits card (nothing to show).
		return null;
	}

	return (
		<Card className="wcpay-deposits-overview">
			<CardHeader>{ __( 'Payouts', 'poocommerce-payments' ) }</CardHeader>

			{ /* Deposit schedule message */ }
			{ isDepositsUnrestricted && !! account && hasScheduledDeposits && (
				<CardBody className="wcpay-deposits-overview__schedule__container">
					<DepositSchedule
						depositsSchedule={ account.deposits_schedule }
					/>
				</CardBody>
			) }

			{ /* Notices */ }
			<CardBody className="wcpay-deposits-overview__notices__container">
				{ account?.deposits_blocked ? (
					<SuspendedDepositNotice />
				) : (
					<>
						{ ! hasCompletedWaitingPeriod && (
							<NewAccountWaitingPeriodNotice />
						) }
						{ hasCompletedWaitingPeriod &&
							isDepositAwaitingPendingFunds && (
								<NoFundsAvailableForDepositNotice />
							) }
						{ isNegativeBalanceDepositsPaused && (
							<NegativeBalanceDepositsPausedNotice />
						) }
						{ hasErroredExternalAccount && (
							<DepositFailureNotice
								updateAccountLink={
									wcpaySettings.accountStatus.accountLink
								}
							/>
						) }
						{ availableFunds > 0 &&
							! isAboveMinimumDepositAmount && (
								<DepositMinimumBalanceNotice
									minimumDepositAmountFormatted={ formatExplicitCurrency(
										minimumDepositAmount,
										selectedCurrency
									) }
								/>
							) }
					</>
				) }
			</CardBody>

			{ hasRecentDeposits && (
				<>
					<CardBody className="wcpay-deposits-overview__heading">
						<span className="wcpay-deposits-overview__heading__title">
							{ __( 'Payout history', 'poocommerce-payments' ) }
						</span>
					</CardBody>
					<RecentDepositsList deposits={ deposits } />
				</>
			) }

			{ ( hasRecentDeposits || canChangeDepositSchedule ) && (
				<CardFooter className="wcpay-deposits-overview__footer">
					{ hasRecentDeposits && (
						<Button
							variant="secondary"
							onClick={ navigateToDepositsHistory }
							__next40pxDefaultSize
						>
							{ __(
								'View full payout history',
								'poocommerce-payments'
							) }
						</Button>
					) }

					{ canChangeDepositSchedule && (
						<Button
							variant="tertiary"
							href={
								getAdminUrl( {
									page: 'wc-settings',
									tab: 'checkout',
									section: 'poocommerce_payments',
								} ) + '#payout-schedule'
							}
							onClick={ () =>
								recordEvent(
									'wcpay_overview_deposits_change_schedule_click'
								)
							}
							__next40pxDefaultSize
						>
							{ __(
								'Change payout schedule',
								'poocommerce-payments'
							) }
						</Button>
					) }
				</CardFooter>
			) }
		</Card>
	);
};

export default DepositsOverview;
