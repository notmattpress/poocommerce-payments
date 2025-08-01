/** @format **/

/**
 * External dependencies
 */
import React, { useState, useContext } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { backup, edit, lock, arrowRight } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { Link } from '@poocommerce/components';

/**
 * Internal dependencies
 */
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { ExternalLink } from 'wcpay/components/wp-components-wrapped/components/external-link';
import { Flex } from 'wcpay/components/wp-components-wrapped/components/flex';
import { FlexItem } from 'wcpay/components/wp-components-wrapped/components/flex-item';
import { Icon } from 'wcpay/components/wp-components-wrapped/components/icon';
import { Modal } from 'wcpay/components/wp-components-wrapped/components/modal';
import { HorizontalRule } from 'wcpay/components/wp-components-wrapped/components/horizontal-rule';
import type { Dispute } from 'wcpay/types/disputes';
import type { ChargeBillingDetails } from 'wcpay/types/charges';
import { recordEvent } from 'tracks';
import { useDisputeAccept } from 'wcpay/data';
import { getDisputeFeeFormatted, isInquiry } from 'wcpay/disputes/utils';
import { getAdminUrl } from 'wcpay/utils';
import DisputeNotice from './dispute-notice';
import IssuerEvidenceList from './evidence-list';
import DisputeSummaryRow from './dispute-summary-row';
import {
	DisputeSteps,
	InquirySteps,
	NotDefendableInquirySteps,
} from './dispute-steps';
import InlineNotice from 'components/inline-notice';
import WCPaySettingsContext from 'wcpay/settings/wcpay-settings-context';
import './style.scss';

interface Props {
	dispute: Dispute;
	customer: ChargeBillingDetails | null;
	chargeCreated: number;
	orderUrl: string | undefined;
	paymentMethod: string | null;
	bankName: string | null;
}

/**
 * The lines of text to display in the modal to confirm acceptance / refunding of the dispute / inquiry.
 */
interface ModalLineItem {
	icon: JSX.Element;
	description: string | JSX.Element;
}

interface AcceptDisputeProps {
	/**
	 * The label for the button that opens the modal.
	 */
	acceptButtonLabel: string;
	/**
	 * The event to track when the button that opens the modal is clicked.
	 */
	acceptButtonTracksEvent: string;
	/**
	 * The title of the modal.
	 */
	modalTitle: string;
	/**
	 * The lines of text to display in the modal.
	 */
	modalLines: ModalLineItem[];
	/**
	 * The label for the primary button in the modal to Accept / Refund the dispute / inquiry.
	 */
	modalButtonLabel: string;
	/**
	 * The event to track when the primary button in the modal is clicked.
	 */
	modalButtonTracksEvent: string;
}

/**
 * Disputes and Inquiries have different text for buttons and the modal.
 * They also have different icons and tracks events. This function returns the correct props.
 */
function getAcceptDisputeProps( {
	dispute,
	isDisputeAcceptRequestPending,
}: {
	dispute: Dispute;
	isDisputeAcceptRequestPending: boolean;
} ): AcceptDisputeProps {
	if ( isInquiry( dispute.status ) ) {
		return {
			acceptButtonLabel: __( 'Issue refund', 'poocommerce-payments' ),
			acceptButtonTracksEvent: 'wcpay_dispute_inquiry_refund_modal_view',
			modalTitle: __( 'Issue a refund?', 'poocommerce-payments' ),
			modalLines: [
				{
					icon: <Icon icon={ backup } size={ 24 } />,
					description: __(
						'Issuing a refund will close the inquiry, returning the amount in question back to the cardholder. No additional fees apply.',
						'poocommerce-payments'
					),
				},
				{
					icon: <Icon icon={ arrowRight } size={ 24 } />,
					description: __(
						'You will be taken to the order, where you must complete the refund process manually.',
						'poocommerce-payments'
					),
				},
			],
			modalButtonLabel: __(
				'View order to issue refund',
				'poocommerce-payments'
			),
			modalButtonTracksEvent: 'wcpay_dispute_inquiry_refund_click',
		};
	}

	return {
		acceptButtonLabel: __( 'Accept dispute', 'poocommerce-payments' ),
		acceptButtonTracksEvent: 'wcpay_dispute_accept_modal_view',
		modalTitle: __( 'Accept the dispute?', 'poocommerce-payments' ),
		modalLines: [
			{
				icon: <Icon icon={ backup } size={ 24 } />,
				description: createInterpolateElement(
					sprintf(
						/* translators: %s: dispute fee, <em>: emphasis HTML element. */
						__(
							'Accepting the dispute marks it as <em>Lost</em>. The disputed amount and the %s dispute fee will not be returned to you.',
							'poocommerce-payments'
						),
						getDisputeFeeFormatted( dispute, true ) ?? '-'
					),
					{
						em: <em />,
					}
				),
			},
			{
				icon: <Icon icon={ lock } size={ 24 } />,
				description: __(
					'This action is final and cannot be undone.',
					'poocommerce-payments'
				),
			},
		],
		modalButtonLabel: isDisputeAcceptRequestPending
			? __( 'Accepting…', 'poocommerce-payments' )
			: __( 'Accept dispute', 'poocommerce-payments' ),
		modalButtonTracksEvent: 'wcpay_dispute_accept_click',
	};
}

const DisputeAwaitingResponseDetails: React.FC< Props > = ( {
	dispute,
	customer,
	chargeCreated,
	orderUrl,
	paymentMethod,
	bankName,
} ) => {
	const {
		doAccept,
		isLoading: isDisputeAcceptRequestPending,
	} = useDisputeAccept( dispute );
	const [ isModalOpen, setModalOpen ] = useState( false );

	const hasStagedEvidence = dispute.evidence_details?.has_evidence;
	const { createErrorNotice } = useDispatch( 'core/notices' );

	const {
		featureFlags: { isDisputeIssuerEvidenceEnabled },
	} = useContext( WCPaySettingsContext );

	// Get the appropriate documentation URL based on dispute type
	const getLearnMoreDocsUrl = () => {
		if ( isInquiry( dispute.status ) ) {
			if ( paymentMethod === 'klarna' ) {
				return 'https://poocommerce.com/document/woopayments/payment-methods/buy-now-pay-later/#klarna-inquiries-returns';
			}
			return 'https://poocommerce.com/document/woopayments/fraud-and-disputes/managing-disputes/#inquiries';
		}
		return 'https://poocommerce.com/document/woopayments/fraud-and-disputes/managing-disputes/#responding';
	};

	// Get the appropriate help link text based on dispute type and payment method
	const getHelpLinkText = () => {
		if ( isInquiry( dispute.status ) ) {
			if ( paymentMethod === 'klarna' ) {
				return __(
					'Please see this document for more information',
					'poocommerce-payments'
				);
			}
			return __(
				'Learn more about payment inquiries',
				'poocommerce-payments'
			);
		}
		return __(
			'Learn more about responding to disputes',
			'poocommerce-payments'
		);
	};

	const handleModalClose = () => {
		// Don't allow the user to close the modal if the accept request is in progress.
		if ( isDisputeAcceptRequestPending ) {
			return;
		}
		setModalOpen( false );
	};

	const viewOrder = () => {
		if ( orderUrl ) {
			window.location.href = orderUrl;
			return;
		}

		createErrorNotice(
			__(
				'Unable to view order. Order not found.',
				'poocommerce-payments'
			)
		);
	};

	const disputeAcceptAction = getAcceptDisputeProps( {
		dispute,
		isDisputeAcceptRequestPending,
	} );

	/**
	 * The following cases cannot be defended:
	 * - Klarna inquiries
	 * - Visa Compliance disputes (require confirmation of a specific fee)
	 */
	const isDefendable = ! (
		( paymentMethod === 'klarna' && isInquiry( dispute.status ) ) ||
		( dispute?.enhanced_eligibility_types || [] ).includes(
			'visa_compliance'
		)
	);

	const challengeButtonDefaultText = isInquiry( dispute.status )
		? __( 'Submit evidence', 'poocommerce-payments' )
		: __( 'Challenge dispute', 'poocommerce-payments' );

	const inquirySteps = isDefendable ? (
		<InquirySteps
			dispute={ dispute }
			customer={ customer }
			chargeCreated={ chargeCreated }
			bankName={ bankName }
		/>
	) : (
		<NotDefendableInquirySteps
			dispute={ dispute }
			customer={ customer }
			chargeCreated={ chargeCreated }
			bankName={ bankName }
		/>
	);

	// we cannot nest ternary operators, so let's build the steps in a variable
	const steps = isInquiry( dispute.status ) ? (
		inquirySteps
	) : (
		<DisputeSteps
			dispute={ dispute }
			customer={ customer }
			chargeCreated={ chargeCreated }
			bankName={ bankName }
		/>
	);

	return (
		<div className="transaction-details-dispute-details-wrapper">
			<HorizontalRule />
			<h2 className="transaction-details-dispute-details-title">
				{ __( 'Dispute details', 'poocommerce-payments' ) }
			</h2>
			<div className="transaction-details-dispute-details-body">
				{ /* No matter what the countdown days is, we should show the urgent the urgent notice */ }
				<DisputeNotice
					dispute={ dispute }
					isUrgent={ true }
					paymentMethod={ paymentMethod }
					bankName={ bankName }
				/>
				{ hasStagedEvidence && (
					<InlineNotice icon={ edit } isDismissible={ false }>
						{ __(
							`You initiated a challenge to this dispute. Click 'Continue with challenge' to proceed with your draft response.`,
							'poocommerce-payments'
						) }
					</InlineNotice>
				) }

				<DisputeSummaryRow dispute={ dispute } />

				{ steps }

				{ isDisputeIssuerEvidenceEnabled && (
					<IssuerEvidenceList
						issuerEvidence={ dispute.issuer_evidence }
					/>
				) }

				{ /* Help link to documentation */ }
				<div className="transaction-details-dispute-details-body__help-link">
					<ExternalLink
						href={ getLearnMoreDocsUrl() }
						onClick={ () => {
							recordEvent( 'wcpay_dispute_help_link_clicked', {
								dispute_status: dispute.status,
								on_page: 'transaction_details',
							} );
						} }
					>
						{ getHelpLinkText() }
					</ExternalLink>
				</div>

				{ /* Dispute Actions */ }
				{
					<div className="transaction-details-dispute-details-body__actions">
						{ isDefendable && (
							<Link
								href={
									// Prevent the user navigating to the challenge screen if the accept request is in progress.
									isDisputeAcceptRequestPending
										? ''
										: getAdminUrl( {
												page: 'wc-admin',
												path:
													'/payments/disputes/challenge',
												id: dispute.id,
										  } )
								}
							>
								<Button
									variant="primary"
									data-testid="challenge-dispute-button"
									disabled={ isDisputeAcceptRequestPending }
									onClick={ () => {
										recordEvent(
											'wcpay_dispute_challenge_clicked',
											{
												dispute_status: dispute.status,
												on_page: 'transaction_details',
											}
										);
									} }
								>
									{ hasStagedEvidence
										? __(
												'Continue with challenge',
												'poocommerce-payments'
										  )
										: challengeButtonDefaultText }
								</Button>
							</Link>
						) }

						<Button
							variant={ isDefendable ? 'tertiary' : 'primary' }
							disabled={ isDisputeAcceptRequestPending }
							data-testid="open-accept-dispute-modal-button"
							onClick={ () => {
								recordEvent(
									disputeAcceptAction.acceptButtonTracksEvent,
									{
										dispute_status: dispute.status,
										on_page: 'transaction_details',
									}
								);
								setModalOpen( true );
							} }
						>
							{ disputeAcceptAction.acceptButtonLabel }
						</Button>

						{ /** Accept dispute modal */ }
						{ isModalOpen && (
							<Modal
								title={ disputeAcceptAction.modalTitle }
								onRequestClose={ handleModalClose }
								className="transaction-details-dispute-accept-modal"
							>
								<p>
									<strong>
										{ __(
											'Before proceeding, please take note of the following:',
											'poocommerce-payments'
										) }
									</strong>
								</p>

								{ disputeAcceptAction.modalLines.map(
									( line, key ) => (
										<Flex justify="start" key={ key }>
											<FlexItem className="transaction-details-dispute-accept-modal__icon">
												{ line.icon }
											</FlexItem>
											<FlexItem>
												{ line.description }
											</FlexItem>
										</Flex>
									)
								) }

								<Flex
									className="transaction-details-dispute-accept-modal__actions"
									justify="end"
								>
									<Button
										variant="tertiary"
										disabled={
											isDisputeAcceptRequestPending
										}
										onClick={ handleModalClose }
									>
										{ __(
											'Cancel',
											'poocommerce-payments'
										) }
									</Button>
									<Button
										variant="primary"
										isBusy={ isDisputeAcceptRequestPending }
										disabled={
											isDisputeAcceptRequestPending
										}
										data-testid="accept-dispute-button"
										onClick={ () => {
											recordEvent(
												disputeAcceptAction.modalButtonTracksEvent,
												{
													dispute_status:
														dispute.status,
													on_page:
														'transaction_details',
												}
											);

											/**
											 * Handle the primary modal action.
											 * If it's an inquiry, redirect to the order page; otherwise, continue with the default dispute acceptance.
											 */
											if ( isInquiry( dispute.status ) ) {
												viewOrder();
											} else {
												doAccept();
											}
										} }
									>
										{ disputeAcceptAction.modalButtonLabel }
									</Button>
								</Flex>
							</Modal>
						) }
					</div>
				}
			</div>
		</div>
	);
};

export default DisputeAwaitingResponseDetails;
