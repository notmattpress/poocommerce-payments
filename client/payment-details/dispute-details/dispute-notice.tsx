/** @format **/

/**
 * External dependencies
 */
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import InlineNotice from 'components/inline-notice';
import { reasons } from 'wcpay/disputes/strings';
import { Dispute } from 'wcpay/types/disputes';
import { isInquiry } from 'wcpay/disputes/utils';

interface DisputeNoticeProps {
	dispute: Dispute;
	isUrgent: boolean;
	paymentMethod: string | null;
}

const DisputeNotice: React.FC< DisputeNoticeProps > = ( {
	dispute,
	isUrgent,
	paymentMethod,
} ) => {
	const shopperDisputeReason =
		reasons[ dispute.reason ]?.claim ??
		__(
			'The cardholder claims this is an unrecognized charge.',
			'poocommerce-payments'
		);

	/* translators: <a> link to dispute documentation. %s is the clients claim for the dispute, eg "The cardholder claims this is an unrecognized charge." */
	let noticeText = __(
		'<strong>%s</strong> Challenge the dispute if you believe the claim is invalid, ' +
			'or accept to forfeit the funds and pay the dispute fee. ' +
			'Non-response will result in an automatic loss. <a>Learn more about responding to disputes</a>',
		'poocommerce-payments'
	);
	let learnMoreDocsUrl =
		'https://poocommerce.com/document/woopayments/fraud-and-disputes/managing-disputes/#responding';

	if ( isInquiry( dispute.status ) ) {
		/* translators: <a> link to dispute inquiry documentation. %s is the clients claim for the dispute, eg "The cardholder claims this is an unrecognized charge." */
		noticeText = __(
			'<strong>%s</strong> You can challenge their claim if you believe it’s invalid. ' +
				'Not responding will result in an automatic loss. <a>Learn more about payment inquiries</a>',
			'poocommerce-payments'
		);
		learnMoreDocsUrl =
			'https://poocommerce.com/document/woopayments/fraud-and-disputes/managing-disputes/#inquiries';

		if ( paymentMethod === 'klarna' ) {
			noticeText = __(
				'Klarna inquiries may mean that the customer is trying to return their item(s). ' +
					'<a>Please see this document for more information</a>',
				'poocommerce-payments'
			);
			learnMoreDocsUrl =
				'https://poocommerce.com/document/woopayments/payment-methods/buy-now-pay-later/#klarna-inquiries-returns';
		}
	}

	return (
		<InlineNotice
			icon
			status={ isUrgent ? 'error' : 'warning' }
			className="dispute-notice"
			isDismissible={ false }
		>
			{ createInterpolateElement(
				sprintf( noticeText, shopperDisputeReason ),
				{
					a: (
						<ExternalLink
							className="dispute-notice__link"
							href={ learnMoreDocsUrl }
						/>
					),
					strong: <strong />,
				}
			) }
		</InlineNotice>
	);
};

export default DisputeNotice;
