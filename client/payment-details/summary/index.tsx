/** @format **/

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import moment from 'moment';
import React, { useContext, useState } from 'react';
import { createInterpolateElement } from '@wordpress/element';
import HelpOutlineIcon from 'gridicons/dist/help-outline';
import _ from 'lodash';

/**
 * Internal dependencies.
 */
import { CardDivider } from 'wcpay/components/wp-components-wrapped/components/card-divider';
import { DropdownMenu } from 'wcpay/components/wp-components-wrapped/components/dropdown-menu';
import { MenuGroup } from 'wcpay/components/wp-components-wrapped/components/menu-group';
import { MenuItem } from 'wcpay/components/wp-components-wrapped/components/menu-item';
import { Card } from 'wcpay/components/wp-components-wrapped/components/card';
import { CardBody } from 'wcpay/components/wp-components-wrapped/components/card-body';
import { Flex } from 'wcpay/components/wp-components-wrapped/components/flex';
import { CardNotice } from 'wcpay/components/wp-components-wrapped/components/card-notice';
import {
	getChargeAmounts,
	getChargeStatus,
	getChargeChannel,
	isOnHoldByFraudTools,
	getBankName,
} from 'utils/charge';
import isValueTruthy from 'utils/is-value-truthy';
import PaymentStatusChip from 'components/payment-status-chip';
import PaymentMethodDetails from 'components/payment-method-details';
import { HorizontalList, HorizontalListItem } from 'components/horizontal-list';
import Loadable, { LoadableBlock } from 'components/loadable';
import riskMappings from 'components/risk-level/strings';
import OrderLink from 'components/order-link';
import {
	formatCurrency,
	formatExplicitCurrency,
} from 'multi-currency/interface/functions';
import CustomerLink from 'components/customer-link';
import { ClickTooltip } from 'components/tooltip';
import DisputeStatusChip from 'components/dispute-status-chip';
import {
	getDisputeFeeFormatted,
	isAwaitingResponse,
	isRefundable,
} from 'wcpay/disputes/utils';
import { useAuthorization } from 'wcpay/data';
import CaptureAuthorizationButton from 'wcpay/components/capture-authorization-button';
import './style.scss';
import { Charge } from 'wcpay/types/charges';
import { recordEvent } from 'tracks';
import WCPaySettingsContext from '../../settings/wcpay-settings-context';
import { FraudOutcome } from '../../types/fraud-outcome';
import CancelAuthorizationButton from '../../components/cancel-authorization-button';
import { PaymentIntent } from '../../types/payment-intents';
import MissingOrderNotice from 'wcpay/payment-details/summary/missing-order-notice';
import DisputeAwaitingResponseDetails from '../dispute-details/dispute-awaiting-response-details';
import DisputeResolutionFooter from '../dispute-details/dispute-resolution-footer';
import ErrorBoundary from 'components/error-boundary';
import RefundModal from 'wcpay/payment-details/summary/refund-modal';
import {
	formatDateTimeFromString,
	formatDateTimeFromTimestamp,
} from 'wcpay/utils/date-time';
import { ExternalLink } from 'wcpay/components/wp-components-wrapped/components/external-link';

declare const window: any;

interface PaymentDetailsSummaryProps {
	isLoading: boolean;
	charge?: Charge;
	metadata?: Record< string, any >;
	fraudOutcome?: FraudOutcome;
	paymentIntent?: PaymentIntent;
}

const placeholderValues = {
	amount: 0,
	currency: 'USD',
	net: 0,
	fee: 0,
	refunded: null,
};

const isTapToPay = ( model: string ) => {
	return model === 'COTS_DEVICE' || model === 'TAP_TO_PAY_DEVICE';
};

const getTapToPayChannel = ( platform: string ) => {
	if ( platform === 'ios' ) {
		return __( 'Tap to Pay on iPhone', 'poocommerce-payments' );
	}

	if ( platform === 'android' ) {
		return __( 'Tap to Pay on Android', 'poocommerce-payments' );
	}

	return __( 'Tap to Pay', 'poocommerce-payments' );
};

const composePaymentSummaryItems = ( {
	charge = {} as Charge,
	metadata = {},
}: {
	charge: Charge;
	metadata: Record< string, any >;
} ): HorizontalListItem[] =>
	[
		{
			title: __( 'Date', 'poocommerce-payments' ),
			content: charge.created
				? formatDateTimeFromTimestamp( charge.created, {
						separator: ', ',
						includeTime: true,
				  } )
				: '–',
		},
		{
			title: __( 'Sales channel', 'poocommerce-payments' ),
			content: (
				<span>
					{ isTapToPay( metadata?.reader_model )
						? getTapToPayChannel( metadata?.platform )
						: getChargeChannel(
								charge.payment_method_details?.type,
								metadata
						  ) }
				</span>
			),
		},
		{
			title: __( 'Customer', 'poocommerce-payments' ),
			content: (
				<CustomerLink
					billing_details={ charge.billing_details }
					order_details={ charge.order }
				/>
			),
		},
		{
			title: __( 'Order', 'poocommerce-payments' ),
			content: <OrderLink order={ charge.order } />,
		},
		wcpaySettings.isSubscriptionsActive && {
			title: __( 'Subscription', 'poocommerce-payments' ),
			content: charge.order?.subscriptions?.length ? (
				charge.order.subscriptions.map( ( subscription, i, all ) => [
					<OrderLink key={ i } order={ subscription } />,
					i !== all.length - 1 && ', ',
				] )
			) : (
				<OrderLink order={ null } />
			),
		},
		{
			title: __( 'Payment method', 'poocommerce-payments' ),
			content: (
				<PaymentMethodDetails
					payment={ charge.payment_method_details }
				/>
			),
		},
		{
			title: __( 'Risk evaluation', 'poocommerce-payments' ),
			content: charge.outcome?.risk_level
				? riskMappings[ charge.outcome.risk_level ]
				: '–',
		},
	].filter( isValueTruthy );

const composePaymentSummaryItemsForDispute = ( {
	charge = {} as Charge,
}: {
	charge: Charge;
} ): HorizontalListItem[] =>
	[
		{
			title: __( 'Date', 'poocommerce-payments' ),
			content: charge.created
				? formatDateTimeFromTimestamp( charge.created, {
						customFormat: 'F j, Y g:i A',
				  } )
				: '–',
		},
		{
			title: __( 'Customer', 'poocommerce-payments' ),
			content: (
				<CustomerLink
					billing_details={ charge.billing_details }
					order_details={ charge.order }
				/>
			),
		},
		{
			title: __( 'Order', 'poocommerce-payments' ),
			content: <OrderLink order={ charge.order } />,
		},
		wcpaySettings.isSubscriptionsActive && {
			title: __( 'Subscription', 'poocommerce-payments' ),
			content: charge.order?.subscriptions?.length ? (
				charge.order.subscriptions.map( ( subscription, i, all ) => [
					<OrderLink key={ i } order={ subscription } />,
					i !== all.length - 1 && ', ',
				] )
			) : (
				<OrderLink order={ null } />
			),
		},
		{
			title: __( 'Payment method', 'poocommerce-payments' ),
			content: (
				<PaymentMethodDetails
					payment={ charge.payment_method_details }
				/>
			),
		},
		{
			title: __( 'Risk evaluation', 'poocommerce-payments' ),
			content: charge.outcome?.risk_level
				? riskMappings[ charge.outcome.risk_level ]
				: '–',
		},
	].filter( isValueTruthy );

const PaymentDetailsSummary: React.FC< PaymentDetailsSummaryProps > = ( {
	charge = {} as Charge,
	metadata = {},
	isLoading,
	paymentIntent,
} ) => {
	const balance = charge.amount
		? getChargeAmounts( charge )
		: placeholderValues;
	const renderStorePrice =
		charge.currency && balance.currency !== charge.currency;

	const {
		featureFlags: { isAuthAndCaptureEnabled },
	} = useContext( WCPaySettingsContext );

	// We should only fetch the authorization data if the payment is marked for manual capture and it is not already captured.
	// We also need to exclude failed payments and payments that have been refunded, because capture === false in those cases, even
	// if the capture is automatic.
	const shouldFetchAuthorization =
		! charge.captured &&
		charge.status !== 'failed' &&
		charge.amount_refunded === 0 &&
		isAuthAndCaptureEnabled;

	const { authorization } = useAuthorization(
		charge.payment_intent as string,
		charge.order?.id as number,
		shouldFetchAuthorization
	);

	const isFraudOutcomeReview = isOnHoldByFraudTools( charge, paymentIntent );

	const disputeFee =
		charge.dispute && getDisputeFeeFormatted( charge.dispute );

	// If this transaction is disputed, check if it is refundable.
	const isDisputeRefundable = charge.dispute
		? isRefundable( charge.dispute.status )
		: true;

	// Partial refunds are done through the order page. If order number is not
	// present, partial refund is not possible.
	const isPartiallyRefundable = charge.order && charge.order.number;

	const isPartiallyRefunded = charge.amount_refunded > 0;

	// Control menu only shows refund actions for now. In the future, it may show other actions.
	const showControlMenu =
		charge.captured && ! charge.refunded && isDisputeRefundable;

	// Use the balance_transaction fee if available. If not (e.g. authorized but not captured), use the application_fee_amount.
	const transactionFee = charge.balance_transaction
		? {
				fee: charge.balance_transaction.fee,
				currency: charge.balance_transaction.currency,
		  }
		: {
				fee: charge.application_fee_amount,
				currency: charge.currency,
		  };

	// WP translation strings are injected into Moment.js for relative time terms, since Moment's own translation library increases the bundle size significantly.
	moment.updateLocale( 'en', {
		relativeTime: {
			s: __( 'a second', 'poocommerce-payments' ),
			ss: __( '%d seconds', 'poocommerce-payments' ),
			m: __( 'a minute', 'poocommerce-payments' ),
			mm: __( '%d minutes', 'poocommerce-payments' ),
			h: __( 'an hour', 'poocommerce-payments' ),
			hh: __( '%d hours', 'poocommerce-payments' ),
			d: __( 'a day', 'poocommerce-payments' ),
			dd: __( '%d days', 'poocommerce-payments' ),
		},
	} );

	const formattedAmount = formatCurrency(
		charge.amount,
		charge.currency,
		balance.currency
	);

	const [ isRefundModalOpen, setIsRefundModalOpen ] = useState( false );

	const bankName = getBankName( charge );
	return (
		<Card>
			<CardBody>
				<Flex direction="row" align="start">
					<div className="payment-details-summary">
						<div className="payment-details-summary__section">
							<div className="payment-details-summary__amount-wrapper">
								<p className="payment-details-summary__amount">
									<Loadable
										isLoading={ isLoading }
										placeholder={ __(
											'Amount placeholder',
											'poocommerce-payments'
										) }
									>
										{ formattedAmount }
										<span className="payment-details-summary__amount-currency">
											{ charge.currency || 'USD' }
										</span>
									</Loadable>
								</p>
								{ charge.dispute ? (
									<DisputeStatusChip
										className="payment-details-summary__status"
										status={ charge.dispute.status }
										prefixDisputeType={ true }
									/>
								) : (
									<PaymentStatusChip
										className="payment-details-summary__status"
										status={ getChargeStatus(
											charge,
											paymentIntent
										) }
									/>
								) }
							</div>
							<div className="payment-details-summary__breakdown">
								{ renderStorePrice ? (
									<p className="payment-details-summary__breakdown__settlement-currency">
										{ formatExplicitCurrency(
											balance.amount,
											balance.currency
										) }
									</p>
								) : null }
								{ balance.refunded ? (
									<p>
										{ `${
											disputeFee
												? __(
														'Deducted',
														'poocommerce-payments'
												  )
												: __(
														'Refunded',
														'poocommerce-payments'
												  )
										}: ` }
										{ formatExplicitCurrency(
											-balance.refunded,
											balance.currency
										) }
									</p>
								) : (
									''
								) }
								<p>
									<Loadable
										isLoading={ isLoading }
										placeholder={ __(
											'Fee amount',
											'poocommerce-payments'
										) }
									>
										{ `${ __(
											'Fees',
											'poocommerce-payments'
										) }: ` }
										{ formatCurrency(
											-balance.fee,
											balance.currency
										) }
										{ disputeFee && (
											<ClickTooltip
												className="payment-details-summary__breakdown__fee-tooltip"
												buttonIcon={
													<HelpOutlineIcon />
												}
												buttonLabel={ __(
													'Fee breakdown',
													'poocommerce-payments'
												) }
												content={
													<>
														<Flex>
															<label>
																{ __(
																	'Transaction fee',
																	'poocommerce-payments'
																) }
															</label>
															<span
																aria-label={ __(
																	'Transaction fee',
																	'poocommerce-payments'
																) }
															>
																{ formatCurrency(
																	transactionFee.fee,
																	transactionFee.currency
																) }
															</span>
														</Flex>
														<Flex>
															<label>
																{ __(
																	'Dispute fee',
																	'poocommerce-payments'
																) }
															</label>
															<span
																aria-label={ __(
																	'Dispute fee',
																	'poocommerce-payments'
																) }
															>
																{ disputeFee }
															</span>
														</Flex>
														<Flex>
															<label>
																{ __(
																	'Total fees',
																	'poocommerce-payments'
																) }
															</label>
															<span
																aria-label={ __(
																	'Total fees',
																	'poocommerce-payments'
																) }
															>
																{ formatCurrency(
																	balance.fee,
																	balance.currency
																) }
															</span>
														</Flex>
													</>
												}
											/>
										) }
									</Loadable>
								</p>
								{ charge.paydown ? (
									<p>
										{ `${ __(
											'Loan repayment',
											'poocommerce-payments'
										) }: ` }
										{ formatExplicitCurrency(
											charge.paydown.amount,
											balance.currency
										) }
									</p>
								) : (
									''
								) }
								<p>
									<Loadable
										isLoading={ isLoading }
										placeholder={ __(
											'Net amount',
											'poocommerce-payments'
										) }
									>
										{ `${ __(
											'Net',
											'poocommerce-payments'
										) }: ` }
										{ formatExplicitCurrency(
											charge.paydown
												? balance.net -
														Math.abs(
															charge.paydown
																.amount
														)
												: balance.net,
											balance.currency
										) }
									</Loadable>
								</p>
							</div>
						</div>
						<div className="payment-details-summary__section">
							{ ! isLoading && isFraudOutcomeReview && (
								<div className="payment-details-summary__fraud-outcome-action">
									<CancelAuthorizationButton
										orderId={ charge.order?.id || 0 }
										paymentIntentId={
											charge.payment_intent || ''
										}
										onClick={ () => {
											recordEvent(
												'wcpay_fraud_protection_transaction_reviewed_merchant_blocked',
												{
													payment_intent_id:
														charge.payment_intent,
												}
											);
											recordEvent(
												'payments_transactions_details_cancel_charge_button_click',
												{
													payment_intent_id:
														charge.payment_intent,
												}
											);
										} }
									>
										{ __( 'Block transaction' ) }
									</CancelAuthorizationButton>

									<CaptureAuthorizationButton
										buttonIsPrimary
										orderId={ charge.order?.id || 0 }
										paymentIntentId={
											charge.payment_intent || ''
										}
										buttonIsSmall={ false }
										onClick={ () => {
											recordEvent(
												'wcpay_fraud_protection_transaction_reviewed_merchant_approved',
												{
													payment_intent_id:
														charge.payment_intent,
												}
											);
											recordEvent(
												'payments_transactions_details_capture_charge_button_click',
												{
													payment_intent_id:
														charge.payment_intent,
												}
											);
										} }
									>
										{ __(
											'Approve Transaction',
											'poocommerce-payments'
										) }
									</CaptureAuthorizationButton>
								</div>
							) }
							<div className="payment-details-summary__id">
								<Loadable
									isLoading={ isLoading }
									placeholder="Payment ID: pi_xxxxxxxxxxxxxxxxxxxxxxxx"
								>
									{ charge.payment_intent && (
										<div className="payment-details-summary__id_wrapper">
											<span className="payment-details-summary__id_label">
												{ `${ __(
													'Payment ID',
													'poocommerce-payments'
												) }: ` }
											</span>
											<span className="payment-details-summary__id_value">
												{ charge.payment_intent }
											</span>
										</div>
									) }
									{ charge.id && (
										<div className="payment-details-summary__id_wrapper">
											<span className="payment-details-summary__id_label">
												{ `${ __(
													'Charge ID',
													'poocommerce-payments'
												) }: ` }
											</span>
											<span className="payment-details-summary__id_value">
												{ charge.id }
											</span>
										</div>
									) }
								</Loadable>
							</div>
						</div>
					</div>
					<div className="payment-details__refund-controls">
						{ showControlMenu && (
							<Loadable
								isLoading={ isLoading }
								placeholder={ moreVertical }
							>
								<DropdownMenu
									icon={ moreVertical }
									label={ __(
										'Transaction actions',
										'poocommerce-payments'
									) }
									popoverProps={ {
										position: 'bottom left',
									} }
									className="refund-controls__dropdown-menu"
								>
									{ ( { onClose } ) => (
										<MenuGroup>
											{ ! isPartiallyRefunded && (
												<MenuItem
													onClick={ () => {
														setIsRefundModalOpen(
															true
														);
														recordEvent(
															'payments_transactions_details_refund_modal_open',
															{
																payment_intent_id:
																	charge.payment_intent,
															}
														);
														onClose();
													} }
												>
													{ __(
														'Refund in full',
														'poocommerce-payments'
													) }
												</MenuItem>
											) }
											{ isPartiallyRefundable && (
												<MenuItem
													onClick={ () => {
														recordEvent(
															'payments_transactions_details_partial_refund',
															{
																payment_intent_id:
																	charge.payment_intent,
																order_id:
																	charge.order
																		?.id,
															}
														);
														window.location =
															charge.order?.url;
													} }
												>
													{ __(
														'Partial refund',
														'poocommerce-payments'
													) }
												</MenuItem>
											) }
										</MenuGroup>
									) }
								</DropdownMenu>
							</Loadable>
						) }
					</div>
				</Flex>
			</CardBody>
			<CardDivider />
			<CardBody>
				<LoadableBlock isLoading={ isLoading } numLines={ 4 }>
					<HorizontalList
						items={
							charge.dispute
								? composePaymentSummaryItemsForDispute( {
										charge,
								  } )
								: composePaymentSummaryItems( {
										charge,
										metadata,
								  } )
						}
					/>
				</LoadableBlock>
			</CardBody>

			{ charge.dispute && (
				<ErrorBoundary>
					{ isAwaitingResponse( charge.dispute.status ) ? (
						<DisputeAwaitingResponseDetails
							dispute={ charge.dispute }
							customer={ charge.billing_details }
							chargeCreated={ charge.created }
							orderUrl={ charge.order?.url }
							paymentMethod={
								charge.payment_method_details?.type
							}
							bankName={ bankName }
						/>
					) : (
						<DisputeResolutionFooter
							dispute={ charge.dispute }
							bankName={ bankName }
						/>
					) }
				</ErrorBoundary>
			) }
			{ isRefundModalOpen && (
				<RefundModal
					charge={ charge }
					formattedAmount={ formattedAmount }
					onModalClose={ () => {
						setIsRefundModalOpen( false );
						recordEvent(
							'payments_transactions_details_refund_modal_close',
							{
								payment_intent_id: charge.payment_intent,
							}
						);
					} }
				/>
			) }
			{ ! _.isEmpty( charge ) && ! charge.order && ! isLoading && (
				<MissingOrderNotice
					charge={ charge }
					isLoading={ isLoading }
					onButtonClick={ () => setIsRefundModalOpen( true ) }
				/>
			) }
			{ isAuthAndCaptureEnabled &&
				authorization &&
				! authorization.captured && (
					<Loadable isLoading={ isLoading } placeholder="">
						<CardNotice
							actions={
								! isFraudOutcomeReview ? (
									<CaptureAuthorizationButton
										orderId={ charge.order?.id || 0 }
										paymentIntentId={
											charge.payment_intent || ''
										}
										buttonIsPrimary={ true }
										buttonIsSmall={ false }
										onClick={ () => {
											recordEvent(
												'payments_transactions_details_capture_charge_button_click',
												{
													payment_intent_id:
														charge.payment_intent,
												}
											);
										} }
									/>
								) : (
									<></>
								)
							}
						>
							{ createInterpolateElement(
								__(
									'You must <a>capture</a> this charge within the next',
									'poocommerce-payments'
								),
								{
									a: (
										<ExternalLink href="https://poocommerce.com/document/woopayments/settings-guide/authorize-and-capture/#capturing-authorized-orders" />
									),
								}
							) }{ ' ' }
							<abbr
								title={ formatDateTimeFromString(
									// TODO: is this string?
									moment
										.utc( authorization.created )
										.add( 7, 'days' )
										.toISOString(),
									{ includeTime: true }
								) }
							>
								<b>
									{ moment
										.utc( authorization.created )
										.add( 7, 'days' )
										.fromNow( true ) }
								</b>
							</abbr>
							{ isFraudOutcomeReview &&
								`. ${ __(
									'Approving this transaction will capture the charge.',
									'poocommerce-payments'
								) }` }
						</CardNotice>
					</Loadable>
				) }
		</Card>
	);
};

const PaymentDetailsSummaryWrapper: React.FC< PaymentDetailsSummaryProps > = (
	props
) => (
	<WCPaySettingsContext.Provider value={ window.wcpaySettings }>
		<PaymentDetailsSummary { ...props } />
	</WCPaySettingsContext.Provider>
);

export default PaymentDetailsSummaryWrapper;
