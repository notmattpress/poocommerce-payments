/** @format **/

/**
 * External dependencies
 */

/**
 * Internal dependencies.
 */
import strings from './strings';
import { getVerifyBankAccountTask } from './tasks/po-task';
import {
	getDisputeResolutionTask,
	getDisputesDueWithinDays,
} from './tasks/dispute-task';
import { getReconnectWpcomTask } from './tasks/reconnect-task';
import { getUpdateBusinessDetailsTask } from './tasks/update-business-details-task';
import { CachedDispute } from 'wcpay/types/disputes';
import { TaskItemProps } from './types';
import { getGoLiveTask } from './tasks/go-live-task';
import { isInTestModeOnboarding } from 'wcpay/utils';

// Requirements we don't want to show to the user because they are too generic/not useful. These refer to Stripe error codes.
const requirementBlacklist = [ 'invalid_value_other' ];

interface TaskListProps {
	showUpdateDetailsTask: boolean;
	wpcomReconnectUrl: string;
	activeDisputes?: CachedDispute[];
	showGoLiveTask: boolean;
	showGetVerifyBankAccountTask: boolean;
}

export const getTasks = ( {
	showUpdateDetailsTask,
	wpcomReconnectUrl,
	activeDisputes = [],
	showGoLiveTask = false,
	showGetVerifyBankAccountTask = true,
}: TaskListProps ): TaskItemProps[] => {
	const {
		status,
		currentDeadline,
		pastDue,
		accountLink,
		requirements,
		progressiveOnboarding,
		detailsSubmitted,
	} = wcpaySettings.accountStatus;

	const getErrorMessagesFromRequirements = (): any => {
		// strings.errors contains a mixture of strings and React elements built using createInterpolateElement.
		const errors = strings.errors as {
			[ key: string ]: string | React.ReactElement;
		};

		// Filter out requirements that we don't want to show to the user.
		const filteredErrors = requirements?.errors?.filter(
			( error ) => ! requirementBlacklist.includes( error.code )
		);

		// Map the error codes to the error messages.
		const errorMessages = filteredErrors?.map(
			( error ) => errors[ error.code ] || error.reason
		);

		// Remove duplicates.
		return Array.from( new Set( errorMessages || [] ) );
	};

	const isPoEnabled = progressiveOnboarding?.isEnabled;
	const errorMessages = getErrorMessagesFromRequirements();

	const isUpdateDetailsTaskVisible =
		showUpdateDetailsTask &&
		( ! isPoEnabled || ( isPoEnabled && ! detailsSubmitted ) );

	const isDisputeTaskVisible =
		!! activeDisputes &&
		// Only show the dispute task if there are disputes due within 7 days.
		0 < getDisputesDueWithinDays( activeDisputes, 7 ).length;

	const isGoLiveTaskVisible =
		wcpaySettings.isAccountConnected &&
		isInTestModeOnboarding( false ) &&
		showGoLiveTask;

	const isGetVerifyBankAccountTaskVisible =
		showGetVerifyBankAccountTask && isPoEnabled && detailsSubmitted;

	return [
		isUpdateDetailsTaskVisible &&
			getUpdateBusinessDetailsTask(
				errorMessages,
				status ?? '',
				accountLink ?? '',
				Number( currentDeadline ) ?? null,
				pastDue ?? false,
				detailsSubmitted ?? true
			),
		wpcomReconnectUrl && getReconnectWpcomTask( wpcomReconnectUrl ),
		isDisputeTaskVisible && getDisputeResolutionTask( activeDisputes ),
		isGetVerifyBankAccountTaskVisible && getVerifyBankAccountTask(),
		isGoLiveTaskVisible && getGoLiveTask(),
	].filter( Boolean );
};

export const taskSort = ( a: TaskItemProps, b: TaskItemProps ): number => {
	if ( a.completed || b.completed ) {
		return a.completed ? 1 : -1;
	}
	// Three is the lowest level.
	const aLevel = a.level || 3;
	const bLevel = b.level || 3;
	if ( aLevel === bLevel ) {
		return 0;
	}
	return aLevel > bLevel ? 1 : -1;
};
