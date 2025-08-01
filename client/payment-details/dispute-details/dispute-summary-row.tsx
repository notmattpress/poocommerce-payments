/** @format **/

/**
 * External dependencies
 */
import React from 'react';
import HelpOutlineIcon from 'gridicons/dist/help-outline';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Dispute } from 'wcpay/types/disputes';
import { HorizontalList } from 'wcpay/components/horizontal-list';
import { formatExplicitCurrency } from 'multi-currency/interface/functions';
import { reasons } from 'wcpay/disputes/strings';
import { formatStringValue } from 'wcpay/utils';
import { ClickTooltip } from 'wcpay/components/tooltip';
import Paragraphs from 'wcpay/components/paragraphs';
import DisputeDueByDate from './dispute-due-by-date';
import { formatDateTimeFromTimestamp } from 'wcpay/utils/date-time';

interface Props {
	dispute: Dispute;
}

const DisputeSummaryRow: React.FC< Props > = ( { dispute } ) => {
	const disputeReason = formatStringValue(
		reasons[ dispute.reason ]?.display || dispute.reason
	);
	const disputeReasonSummary = reasons[ dispute.reason ]?.summary || [];

	const columns = [
		{
			title: __( 'Dispute Amount', 'poocommerce-payments' ),
			content: formatExplicitCurrency( dispute.amount, dispute.currency ),
		},
		{
			title: __( 'Disputed On', 'poocommerce-payments' ),
			content: dispute.created
				? formatDateTimeFromTimestamp( dispute.created, {
						separator: ', ',
						includeTime: false,
				  } )
				: '–',
		},
		{
			title: __( 'Reason', 'poocommerce-payments' ),
			content: (
				<>
					{ disputeReason }
					{ disputeReasonSummary.length > 0 && (
						<ClickTooltip
							buttonIcon={ <HelpOutlineIcon /> }
							buttonLabel={ __(
								'Learn more',
								'poocommerce-payments'
							) }
							content={
								<div className="dispute-reason-tooltip">
									<p>{ disputeReason }</p>
									<Paragraphs>
										{ disputeReasonSummary }
									</Paragraphs>
									<p>
										<a
											href="https://poocommerce.com/document/woopayments/fraud-and-disputes/managing-disputes/"
											target="_blank"
											rel="noopener noreferrer"
										>
											{ __(
												'Learn more',
												'poocommerce-payments'
											) }
										</a>
									</p>
								</div>
							}
						/>
					) }
				</>
			),
		},
		{
			title: __( 'Respond By', 'poocommerce-payments' ),
			content: (
				<DisputeDueByDate dueBy={ dispute.evidence_details.due_by } />
			),
		},
	];

	return (
		<div className="dispute-summary-row">
			<HorizontalList items={ columns } />
		</div>
	);
};

export default DisputeSummaryRow;
