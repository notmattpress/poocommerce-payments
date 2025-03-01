/**
 * External dependencies
 */
import * as React from 'react';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Flex,
	FlexBlock,
	FlexItem,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { formatExplicitCurrency } from 'multi-currency/interface/functions';
import Loadable from 'components/loadable';
import { useActiveLoanSummary } from 'wcpay/data';
import { getAdminUrl } from 'wcpay/utils';

import './style.scss';
import { formatDateTimeFromTimestamp } from 'wcpay/utils/date-time';

const Block = ( {
	title,
	children,
}: {
	title: React.ReactNode;
	children: React.ReactNode;
} ): JSX.Element => (
	<FlexBlock className="wcpay-loan-summary-block">
		<div className="wcpay-loan-summary-block__title">{ title }</div>
		<div className="wcpay-loan-summary-block__value">{ children }</div>
	</FlexBlock>
);

const ActiveLoanSummaryLoading = (): JSX.Element => {
	return (
		<Card>
			<CardHeader size="medium" className="wcpay-loan-summary-header">
				<FlexItem>
					{ __( 'Active loan overview', 'poocommerce-payments' ) }
				</FlexItem>
			</CardHeader>
			<CardBody className="wcpay-loan-summary-body">
				<Flex align="normal" className="wcpay-loan-summary-row">
					<Block
						title={ __( 'Total repaid', 'poocommerce-payments' ) }
					>
						<Loadable
							isLoading={ true }
							display="inline"
							placeholder={ __(
								'Total repaid placeholder',
								'poocommerce-payments'
							) }
						/>
					</Block>
					<Block
						title={ __(
							'Repaid this period',
							'poocommerce-payments'
						) }
					>
						<Loadable
							isLoading={ true }
							display="inline"
							placeholder={ __(
								'Repaid this period placeholder',
								'poocommerce-payments'
							) }
						/>
					</Block>
				</Flex>
				<Flex
					align="normal"
					className="wcpay-loan-summary-row is-bottom-row"
				>
					<Block
						title={ __( 'Loan disbursed', 'poocommerce-payments' ) }
					>
						<Loadable
							isLoading={ true }
							display="inline"
							placeholder="Date disbursed"
						/>
					</Block>
					<Block
						title={ __( 'Loan amount', 'poocommerce-payments' ) }
					>
						<Loadable
							isLoading={ true }
							display="inline"
							placeholder="Loan amount"
						/>
					</Block>
					<Block title={ __( 'Fixed fee', 'poocommerce-payments' ) }>
						<Loadable
							isLoading={ true }
							display="inline"
							placeholder="Fixed fee"
						/>
					</Block>
					<Block
						title={ __( 'Withhold rate', 'poocommerce-payments' ) }
					>
						<Loadable
							isLoading={ true }
							display="inline"
							placeholder="Rate"
						/>
					</Block>
					<Block
						title={ __( 'First paydown', 'poocommerce-payments' ) }
					>
						<Loadable
							isLoading={ true }
							display="inline"
							placeholder={ __(
								'First paydown',
								'poocommerce-payments'
							) }
						/>
					</Block>
				</Flex>
			</CardBody>
		</Card>
	);
};

const getActiveLoanId = () => {
	for ( const i in wcpaySettings.accountLoans.loans ) {
		const [ loanId, status ] = wcpaySettings.accountLoans.loans[ i ].split(
			'|'
		);
		if ( 'active' === status ) {
			return loanId;
		}
	}
	return null;
};

const ActiveLoanSummary = (): JSX.Element => {
	const { summary, isLoading } = useActiveLoanSummary();

	if ( isLoading || ! summary ) {
		return <ActiveLoanSummaryLoading />;
	}

	const { details } = summary;

	return (
		<Card>
			<CardHeader size="medium" className="wcpay-loan-summary-header">
				<FlexItem>
					{ __( 'Active loan overview', 'poocommerce-payments' ) }
				</FlexItem>
				<FlexItem>
					{ getActiveLoanId() && (
						<Button
							isLink
							href={ getAdminUrl( {
								page: 'wc-admin',
								path: '/payments/transactions',
								type: 'charge',
								filter: 'advanced',
								loan_id_is: getActiveLoanId(),
							} ) }
						>
							{ __(
								'View transactions',
								'poocommerce-payments'
							) }
						</Button>
					) }
				</FlexItem>
			</CardHeader>
			<CardBody className="wcpay-loan-summary-body">
				<Flex align="normal" className="wcpay-loan-summary-row">
					<Block
						title={ __( 'Total repaid', 'poocommerce-payments' ) }
					>
						{ createInterpolateElement(
							sprintf(
								__(
									'<big>%s</big> of %s',
									'poocommerce-payments'
								),
								formatExplicitCurrency(
									details.paid_amount,
									details.currency
								),
								formatExplicitCurrency(
									details.fee_amount + details.advance_amount,
									details.currency
								)
							),
							{
								big: <span className="is-big" />,
							}
						) }
					</Block>
					<Block
						title={ sprintf(
							__(
								'Repaid this period (until %s)',
								'poocommerce-payments'
							),
							formatDateTimeFromTimestamp(
								details.current_repayment_interval.due_at
							)
						) }
					>
						{ createInterpolateElement(
							sprintf(
								__(
									'<big>%s</big> of %s minimum',
									'poocommerce-payments'
								),
								formatExplicitCurrency(
									details.current_repayment_interval
										.paid_amount,
									details.currency
								),
								formatExplicitCurrency(
									details.current_repayment_interval
										.paid_amount +
										details.current_repayment_interval
											.remaining_amount,
									details.currency
								)
							),
							{
								big: <span className="is-big" />,
							}
						) }
					</Block>
				</Flex>
				<Flex
					align="normal"
					className="wcpay-loan-summary-row is-bottom-row"
				>
					<Block
						title={ __( 'Loan disbursed', 'poocommerce-payments' ) }
					>
						{ formatDateTimeFromTimestamp(
							details.advance_paid_out_at
						) }
					</Block>
					<Block
						title={ __( 'Loan amount', 'poocommerce-payments' ) }
					>
						{ formatExplicitCurrency(
							details.advance_amount,
							details.currency
						) }
					</Block>
					<Block title={ __( 'Fixed fee', 'poocommerce-payments' ) }>
						{ formatExplicitCurrency(
							details.fee_amount,
							details.currency
						) }
					</Block>
					<Block
						title={ __( 'Withhold rate', 'poocommerce-payments' ) }
					>
						{ details.withhold_rate * 100 }%
					</Block>
					<Block
						title={ __( 'First paydown', 'poocommerce-payments' ) }
					>
						{ formatDateTimeFromTimestamp(
							details.repayments_begin_at
						) }
					</Block>
				</Flex>
			</CardBody>
		</Card>
	);
};

export default ActiveLoanSummary;
