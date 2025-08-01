/**
 * External dependencies
 */
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import interpolateComponents from '@automattic/interpolate-components';
import { Link } from '@poocommerce/components';
import { ExternalLink } from 'wcpay/components/wp-components-wrapped/components/external-link';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import InlineNotice from 'components/inline-notice';
import { recordEvent } from 'wcpay/tracks';

/**
 * Renders a notice informing the user that their deposits are suspended.
 */
export const SuspendedDepositNotice: React.FC = () => {
	return (
		<InlineNotice
			className="wcpay-deposits-overview__suspended-notice"
			icon
			isDismissible={ false }
			status="warning"
		>
			{ interpolateComponents( {
				/** translators: {{strong}}: placeholders are opening and closing strong tags. {{suspendLink}}: is a <a> link element */
				mixedString: __(
					'Your payouts are {{strong}}temporarily suspended{{/strong}}. {{suspendLink}}Learn more{{/suspendLink}}',
					'poocommerce-payments'
				),
				components: {
					strong: <strong />,
					suspendLink: (
						<Link
							href={
								'https://poocommerce.com/document/woopayments/payouts/why-payouts-suspended/'
							}
						/>
					),
				},
			} ) }
		</InlineNotice>
	);
};

/**
 * Renders a notice informing the user of the new account deposit waiting period.
 */
export const NewAccountWaitingPeriodNotice: React.FC = () => (
	<InlineNotice
		status="warning"
		icon
		className="new-account-waiting-period-notice"
		isDismissible={ false }
	>
		{ interpolateComponents( {
			mixedString: __(
				'Your first payout is held for 7-14 days. {{whyLink}}Why?{{/whyLink}}',
				'poocommerce-payments'
			),
			components: {
				whyLink: (
					// Link content is in the format string above. Consider disabling jsx-a11y/anchor-has-content.
					// eslint-disable-next-line jsx-a11y/anchor-has-content
					<a
						target="_blank"
						rel="noopener noreferrer"
						href="https://poocommerce.com/document/woopayments/payouts/payout-schedule/#new-accounts"
					/>
				),
			},
		} ) }
	</InlineNotice>
);

/**
 * Renders a notice informing the user that their deposits may be paused due to a negative balance.
 */
export const NegativeBalanceDepositsPausedNotice: React.FC = () => (
	<InlineNotice
		status="warning"
		icon
		className="negative-balance-deposits-paused-notice"
		isDismissible={ false }
	>
		{ interpolateComponents( {
			mixedString: sprintf(
				/* translators: %s: WooPayments */
				__(
					'Payouts may be interrupted while your %s balance remains negative. {{whyLink}}Why?{{/whyLink}}',
					'poocommerce-payments'
				),
				'WooPayments'
			),
			components: {
				whyLink: (
					// Link content is in the format string above. Consider disabling jsx-a11y/anchor-has-content.
					// eslint-disable-next-line jsx-a11y/anchor-has-content
					<a
						target="_blank"
						rel="noopener noreferrer"
						href="https://poocommerce.com/document/woopayments/fees-and-debits/account-showing-negative-balance/"
					/>
				),
			},
		} ) }
	</InlineNotice>
);

/**
 * Renders a notice informing the user that their available balance is below the minimum deposit threshold.
 */
export const DepositMinimumBalanceNotice: React.FC< {
	/**
	 * The minimum deposit amount formatted as a currency string (e.g. $5.00 USD).
	 */
	minimumDepositAmountFormatted: string;
} > = ( { minimumDepositAmountFormatted } ) => {
	return (
		<InlineNotice status="warning" icon isDismissible={ false }>
			{ interpolateComponents( {
				mixedString: sprintf(
					/* translators: %s: a formatted currency amount, e.g. $5.00 USD */
					__(
						'Payouts are paused while your available funds balance remains below %s. {{learnMoreLink}}Learn more{{/learnMoreLink}}',
						'poocommerce-payments'
					),
					minimumDepositAmountFormatted
				),
				components: {
					learnMoreLink: (
						// Link content is in the format string above.
						// eslint-disable-next-line jsx-a11y/anchor-has-content
						<a
							target="_blank"
							rel="noopener noreferrer"
							href="https://poocommerce.com/document/woopayments/payouts/payout-schedule/#minimum-payout-amounts"
						/>
					),
				},
			} ) }
		</InlineNotice>
	);
};

/**
 * Renders a notice informing the user that deposits only occur when there are funds available.
 */
export const NoFundsAvailableForDepositNotice: React.FC = () => (
	<InlineNotice status="warning" icon isDismissible={ false }>
		{ interpolateComponents( {
			mixedString: __(
				'You have no funds available. {{whyLink}}Why?{{/whyLink}}',
				'poocommerce-payments'
			),
			components: {
				whyLink: (
					// Link content is in the format string above. Consider disabling jsx-a11y/anchor-has-content.
					// eslint-disable-next-line jsx-a11y/anchor-has-content
					<a
						target="_blank"
						rel="noopener noreferrer"
						href="https://poocommerce.com/document/woopayments/payouts/payout-schedule/#pending-funds"
					/>
				),
			},
		} ) }
	</InlineNotice>
);

/**
 * Renders a notice informing the user that deposits are paused due to a recent deposit failure.
 */
export const DepositFailureNotice: React.FC< {
	/**
	 * The link to update the account details.
	 */
	updateAccountLink?: string;
} > = ( { updateAccountLink } ) => {
	const accountLinkWithSource = updateAccountLink
		? addQueryArgs( updateAccountLink, {
				from: 'WCPAY_PAYOUTS',
				source: 'wcpay-payout-failure-notice',
		  } )
		: '';

	return updateAccountLink !== '' ? (
		<InlineNotice
			status="warning"
			icon
			className="deposit-failure-notice"
			isDismissible={ false }
		>
			{ interpolateComponents( {
				mixedString: __(
					'Payouts are currently paused because a recent payout failed. Please {{updateLink}}update your bank account details{{/updateLink}}.',
					'poocommerce-payments'
				),
				components: {
					updateLink: (
						<ExternalLink
							onClick={ () =>
								recordEvent(
									'wcpay_account_details_link_clicked',
									{
										from: 'WCPAY_PAYOUTS',
										source: 'wcpay-payout-failure-notice',
									}
								)
							}
							href={ accountLinkWithSource }
						/>
					),
				},
			} ) }
		</InlineNotice>
	) : null;
};
