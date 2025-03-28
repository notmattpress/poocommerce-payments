/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import moment from 'moment';
import { getHistory } from '@poocommerce/navigation';

/**
 * Internal dependencies
 */
import type { TaskItemProps } from '../types';
import type { CachedDispute } from 'wcpay/types/disputes';
import { formatCurrency } from 'multi-currency/interface/functions';
import { getAdminUrl } from 'wcpay/utils';
import { recordEvent } from 'tracks';
import { isDueWithin } from 'wcpay/disputes/utils';
import { formatDateTimeFromString } from 'wcpay/utils/date-time';

/**
 * Returns an array of disputes that are due within the specified number of days.
 *
 * @param {CachedDispute[]} activeDisputes - The active disputes to filter.
 * @param {number} days - The number of days to check.
 *
 * @return {CachedDispute[]} The disputes that are due within the specified number of days.
 */
export const getDisputesDueWithinDays = (
	activeDisputes: CachedDispute[],
	days: number
): CachedDispute[] =>
	activeDisputes.filter( ( dispute ) =>
		isDueWithin( { dueBy: dispute.due_by, days } )
	);

export const getDisputeResolutionTask = (
	/**
	 * Active disputes (awaiting a response) to generate the notice string for.
	 */
	activeDisputes: CachedDispute[]
): TaskItemProps | null => {
	// Create a new array and sort by `due_by` ascending.
	activeDisputes = [ ...activeDisputes ]
		.filter( ( dispute ) => dispute.due_by !== '' )
		.sort( ( a, b ) => moment( a.due_by ).diff( moment( b.due_by ) ) );

	const activeDisputeCount = activeDisputes.length;

	if ( activeDisputeCount === 0 ) {
		return null;
	}

	const handleClick = () => {
		recordEvent( 'wcpay_overview_task_click', {
			task: 'dispute-resolution-task',
			active_dispute_count: activeDisputeCount,
		} );
		const history = getHistory();
		if ( activeDisputeCount === 1 ) {
			// Redirect to the transaction details page if there is only one dispute.
			const chargeId = activeDisputes[ 0 ].charge_id;
			history.push(
				getAdminUrl( {
					page: 'wc-admin',
					path: '/payments/transactions/details',
					id: chargeId,
				} )
			);
		} else {
			history.push(
				getAdminUrl( {
					page: 'wc-admin',
					path: '/payments/disputes',
					filter: 'awaiting_response',
				} )
			);
		}
	};

	const numDisputesDueWithin24h = getDisputesDueWithinDays(
		activeDisputes,
		1
	).length;

	const numDisputesDueWithin72h = getDisputesDueWithinDays(
		activeDisputes,
		3
	).length;

	// Create a unique key for each combination of dispute IDs
	// to ensure the task is rendered if a previous task was dismissed.
	const disputeTaskKey = `dispute-resolution-task-${ activeDisputes
		.map( ( dispute ) => dispute.dispute_id )
		.join( '-' ) }`;

	const disputeTask: TaskItemProps = {
		key: disputeTaskKey,
		title: '', // Title text defined below.
		content: '', // Subtitle text defined below.
		level: 1,
		completed: false,
		expanded: true,
		expandable: true,
		isDismissable: false,
		showActionButton: true,
		actionLabel: __( 'Respond now', 'poocommerce-payments' ),
		action: handleClick,
		onClick: () => {
			// Only handle clicks on the action button.
		},
		dataAttrs: {
			'data-urgent': !! ( numDisputesDueWithin72h >= 1 ),
		},
	};

	// Single dispute.
	if ( activeDisputeCount === 1 ) {
		const dispute = activeDisputes[ 0 ];
		const amountFormatted = formatCurrency(
			dispute.amount,
			dispute.currency
		);

		disputeTask.title =
			numDisputesDueWithin24h >= 1
				? sprintf(
						__(
							'Respond to a dispute for %s – Last day',
							'poocommerce-payments'
						),
						amountFormatted
				  )
				: sprintf(
						__(
							'Respond to a dispute for %s',
							'poocommerce-payments'
						),
						amountFormatted
				  );

		disputeTask.content =
			numDisputesDueWithin24h >= 1
				? sprintf(
						__( 'Respond today by %s', 'poocommerce-payments' ),
						// Show due_by time in local timezone: e.g. "11:59 PM".
						formatDateTimeFromString( dispute.due_by, {
							customFormat: 'g:i A',
						} )
				  )
				: sprintf(
						__(
							'By %s – %s left to respond',
							'poocommerce-payments'
						),
						// Show due_by date in local timezone: e.g. "Jan 1, 2021".
						formatDateTimeFromString( dispute.due_by ),
						moment.utc( dispute.due_by ).fromNow( true ) // E.g. "2 days".
				  );

		return disputeTask;
	}

	// Multiple disputes.
	const disputeCurrencies = activeDisputes.reduce(
		( currencies, dispute ) => {
			const { currency } = dispute;
			return currencies.includes( currency )
				? currencies
				: [ ...currencies, currency ];
		},
		[] as string[]
	);

	if ( disputeCurrencies.length > 1 ) {
		// If multiple currencies, use simple title without total amounts.
		disputeTask.title = sprintf(
			__( 'Respond to %d active disputes', 'poocommerce-payments' ),
			activeDisputeCount
		);
	} else {
		// If single currency, show total amount.
		const disputeTotal = activeDisputes.reduce(
			( total, dispute ) => total + dispute.amount,
			0
		);
		disputeTask.title = sprintf(
			__(
				'Respond to %d active disputes for a total of %s',
				'poocommerce-payments'
			),
			activeDisputeCount,
			formatCurrency( disputeTotal, disputeCurrencies[ 0 ] )
		);
	}

	const numDisputesDueWithin7Days = getDisputesDueWithinDays(
		activeDisputes,
		7
	).length;

	disputeTask.content =
		// Final day / Last week to respond to N of the disputes
		numDisputesDueWithin24h >= 1
			? sprintf(
					__(
						'Final day to respond to %d of the disputes',
						'poocommerce-payments'
					),
					numDisputesDueWithin24h
			  )
			: sprintf(
					__(
						'Last week to respond to %d of the disputes',
						'poocommerce-payments'
					),
					numDisputesDueWithin7Days
			  );

	disputeTask.actionLabel = __( 'See disputes', 'poocommerce-payments' );

	return disputeTask;
};
