/**
 * External dependencies
 */
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { render } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import type { TaskItemProps } from '../types';
import UpdateBusinessDetailsModal from 'wcpay/overview/modal/update-business-details';
import { recordEvent } from 'wcpay/tracks';
import { formatDateTimeFromTimestamp } from 'wcpay/utils/date-time';

export const getUpdateBusinessDetailsTask = (
	errorMessages: string[],
	status: string,
	accountLink: string,
	currentDeadline: number | null,
	pastDue: boolean,
	detailsSubmitted: boolean
): TaskItemProps | null => {
	const accountRestrictedSoon = 'restricted_soon' === status;
	const accountDetailsPastDue = 'restricted' === status && pastDue;
	const hasMultipleErrors = 1 < errorMessages.length;
	const hasSingleError = 1 === errorMessages.length;
	const connectUrl = wcpaySettings.connectUrl;
	const accountLinkWithSource = accountLink
		? addQueryArgs( accountLink, {
				from: 'WCPAY_OVERVIEW',
				source: 'wcpay-update-business-details-task',
		  } )
		: '';

	let accountDetailsTaskDescription: React.ReactElement | string = '',
		errorMessageDescription,
		accountDetailsUpdateByDescription;

	if ( accountRestrictedSoon && currentDeadline ) {
		accountDetailsUpdateByDescription = sprintf(
			/* translators: %s - formatted requirements current deadline (date) */
			__(
				'Update by %s to avoid a disruption in payouts.',
				'poocommerce-payments'
			),
			formatDateTimeFromTimestamp( currentDeadline, {
				customFormat: 'ga M j, Y',
			} )
		);

		if ( hasSingleError ) {
			errorMessageDescription = errorMessages[ 0 ];
			accountDetailsTaskDescription = (
				<>
					{ errorMessageDescription }{ ' ' }
					{ accountDetailsUpdateByDescription }
				</>
			);
		} else {
			accountDetailsTaskDescription = accountDetailsUpdateByDescription;
		}
	} else if ( accountDetailsPastDue ) {
		if ( hasSingleError ) {
			accountDetailsTaskDescription = errorMessages[ 0 ];
		} else if ( ! detailsSubmitted ) {
			accountDetailsTaskDescription =
				/* translators: <a> - dashboard login URL */
				__(
					'Payments and payouts are disabled for this account until setup is completed.',
					'poocommerce-payments'
				);
		} else {
			accountDetailsTaskDescription =
				/* translators: <a> - dashboard login URL */
				__(
					'Payments and payouts are disabled for this account until missing business information is updated.',
					'poocommerce-payments'
				);
		}
	}

	const renderModal = () => {
		let container = document.querySelector(
			'#wcpay-update-business-details-container'
		);

		if ( ! container ) {
			container = document.createElement( 'div' );
			container.id = 'wcpay-update-business-details-container';
			document.body.appendChild( container );
		}

		render(
			<UpdateBusinessDetailsModal
				key={ Date.now() }
				errorMessages={ errorMessages }
				accountStatus={ status }
				accountLink={ accountLink }
				currentDeadline={ currentDeadline }
			/>,
			container
		);
	};

	const handleClick = () => {
		if ( 'complete' === status || 'enabled' === status ) {
			return;
		}

		if ( hasMultipleErrors ) {
			renderModal();
		} else {
			let source = 'wcpay-update-business-details-task';
			if ( ! detailsSubmitted ) {
				source = 'wcpay-finish-setup-task';
			}
			recordEvent( 'wcpay_account_details_link_clicked', {
				source,
			} );

			// If the onboarding isn't complete use the connectUrl instead,
			// as the accountLink doesn't handle redirecting back to the overview page.
			if ( ! detailsSubmitted ) {
				window.location.href = addQueryArgs( connectUrl, {
					from: 'WCPAY_OVERVIEW',
					source: 'wcpay-finish-setup-task',
				} );
			} else {
				window.open( accountLinkWithSource, '_blank' );
			}
		}
	};

	let actionLabel;

	if ( hasMultipleErrors ) {
		actionLabel = __( 'More details', 'poocommerce-payments' );
	} else if ( ! detailsSubmitted ) {
		actionLabel = __( 'Finish setup', 'poocommerce-payments' );
	} else {
		actionLabel = __( 'Update', 'poocommerce-payments' );
	}

	return {
		key: ! detailsSubmitted ? 'complete-setup' : 'update-business-details',
		level: 1,
		title: ! detailsSubmitted
			? sprintf(
					/* translators: %s: WooPayments */
					__( 'Finish setting up %s', 'poocommerce-payments' ),
					'WooPayments'
			  )
			: sprintf(
					/* translators: %s: WooPayments */
					__( 'Update %s business details', 'poocommerce-payments' ),
					'WooPayments'
			  ),
		content: accountDetailsTaskDescription,
		completed: 'complete' === status || 'enabled' === status,
		onClick: handleClick,
		action: handleClick,
		actionLabel: actionLabel,
		expandable: true,
		expanded: true,
		showActionButton: true,
	};
};
