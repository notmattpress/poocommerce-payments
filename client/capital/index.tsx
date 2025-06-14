/** @format **/

/**
 * External dependencies
 */
import React from 'react';
import { __, _n } from '@wordpress/i18n';
import { TableCard } from '@poocommerce/components';

/**
 * Internal dependencies.
 */
import Page from 'components/page';
import { TestModeNotice } from 'components/test-mode-notice';
import ErrorBoundary from 'components/error-boundary';
import ActiveLoanSummary from 'components/active-loan-summary';
import {
	formatExplicitCurrency,
	isZeroDecimalCurrency,
} from 'multi-currency/interface/functions';
import { CapitalLoan } from 'data/capital/types';
import ClickableCell from 'components/clickable-cell';
import Chip from 'components/chip';
import { useLoans } from 'wcpay/data';
import { getAdminUrl } from 'wcpay/utils';
import './style.scss';
import { formatDateTimeFromString } from 'wcpay/utils/date-time';
import { MaybeShowMerchantFeedbackPrompt } from 'wcpay/merchant-feedback-prompt';

const columns = [
	{
		key: 'paid_out_at',
		label: __( 'Disbursed', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Disbursed', 'poocommerce-payments' ),
		required: true,
		isLeftAligned: true,
		defaultSort: true,
	},
	{
		key: 'status',
		label: __( 'Status', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Status', 'poocommerce-payments' ),
		required: true,
		cellClassName: 'is-center-aligned',
	},
	{
		key: 'amount',
		label: __( 'Amount', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Amount', 'poocommerce-payments' ),
		required: true,
		isLeftAligned: false,
		isNumeric: true,
	},
	{
		key: 'fee_amount',
		label: __( 'Fixed fee', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Fixed fee', 'poocommerce-payments' ),
		required: true,
		isLeftAligned: false,
		isNumeric: true,
	},
	{
		key: 'withhold_rate',
		label: __( 'Withhold rate', 'poocommerce-payments' ),
		screenReaderLabel: __( 'Withhold rate', 'poocommerce-payments' ),
		required: true,
		isLeftAligned: false,
		isNumeric: true,
	},
	{
		key: 'first_paydown_at',
		label: __( 'First paydown', 'poocommerce-payments' ),
		screenReaderLabel: __( 'First paydown', 'poocommerce-payments' ),
		required: true,
		isLeftAligned: false,
		isNumeric: true, // Hack: this is not a numeric field, but "isNumeric" is needed for it to be right-aligned
	},
];

const getLoanStatusText = ( loan: CapitalLoan ) => {
	return loan.fully_paid_at
		? __( 'Paid off', 'poocommerce-payments' ) +
				': ' +
				formatDateTimeFromString( loan.fully_paid_at )
		: __( 'Active', 'poocommerce-payments' );
};

const getLoanStatusChip = ( loan: CapitalLoan ) => {
	return (
		<Chip
			message={ getLoanStatusText( loan ) }
			type={ loan.fully_paid_at ? 'primary' : 'warning' }
		/>
	);
};

const getRowsData = ( loans: CapitalLoan[] ) =>
	loans.map( ( loan ) => {
		const clickable = ( children: React.ReactNode ) => (
			<ClickableCell
				href={ getAdminUrl( {
					page: 'wc-admin',
					path: '/payments/transactions',
					type: 'charge',
					filter: 'advanced',
					loan_id_is: loan.stripe_loan_id,
				} ) }
			>
				{ children }
			</ClickableCell>
		);

		const data = {
			paid_out_at: {
				value: loan.paid_out_at,
				display: clickable(
					formatDateTimeFromString( loan.paid_out_at )
				),
			},
			status: {
				value: getLoanStatusText( loan ),
				display: clickable( getLoanStatusChip( loan ) ),
			},
			amount: {
				value: isZeroDecimalCurrency( loan.currency )
					? loan.amount
					: loan.amount / 100,
				display: clickable(
					formatExplicitCurrency(
						loan.amount,
						loan.currency.toUpperCase()
					)
				),
			},
			fee_amount: {
				value: isZeroDecimalCurrency( loan.currency )
					? loan.fee_amount
					: loan.fee_amount / 100,
				display: clickable(
					formatExplicitCurrency(
						loan.fee_amount,
						loan.currency.toUpperCase()
					)
				),
			},
			withhold_rate: {
				value: loan.withhold_rate,
				display: clickable(
					+( loan.withhold_rate * 100 ).toFixed( 2 ) + '%'
				),
			},
			first_paydown_at: {
				value: loan.first_paydown_at,
				display: clickable(
					loan.first_paydown_at
						? formatDateTimeFromString( loan.first_paydown_at )
						: '-'
				),
			},
		} as Record<
			string,
			{ value: string | number; display: React.ReactNode }
		>;

		return columns.map( ( { key } ) => data[ key ] );
	} );

const getSummary = ( loans: CapitalLoan[] ) => {
	if ( ! loans.length ) {
		return [];
	}

	const summary = [
		{
			label: _n( 'loan', 'loans', loans.length, 'poocommerce-payments' ),
			value: String( loans.length ),
		},
	];

	const currencies = Array.from(
		new Set( loans.map( ( l ) => l.currency ) )
	);
	if ( 1 === currencies.length ) {
		summary.push( {
			label: __( 'total', 'poocommerce-payments' ),
			value: formatExplicitCurrency(
				loans.reduce(
					( acc: number, loan: CapitalLoan ) => acc + loan.amount,
					0
				),
				currencies[ 0 ]
			),
		} );
		summary.push( {
			label: __( 'fixed fees', 'poocommerce-payments' ),
			value: formatExplicitCurrency(
				loans.reduce(
					( acc: number, loan: CapitalLoan ) => acc + loan.fee_amount,
					0
				),
				currencies[ 0 ]
			),
		} );
	}
	return summary;
};

const CapitalPage = (): JSX.Element => {
	const { loans, isLoading } = useLoans();

	return (
		<Page>
			<MaybeShowMerchantFeedbackPrompt />
			<TestModeNotice currentPage="loans" />

			{ wcpaySettings.accountLoans.has_active_loan && (
				<ErrorBoundary>
					<ActiveLoanSummary />
				</ErrorBoundary>
			) }
			<TableCard
				className="wcpay-loans-list"
				title={ __( 'All loans', 'poocommerce-payments' ) }
				isLoading={ isLoading }
				totalRows={ loans.length }
				headers={ columns }
				rows={ getRowsData( loans ) }
				rowsPerPage={ loans.length }
				summary={ getSummary( loans ) }
				// The Capital Loan table does not have column configuration enabled, see issue #10106.
				showMenu={ false }
			/>
		</Page>
	);
};

export default CapitalPage;
