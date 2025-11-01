/** @format **/

/**
 * External dependencies
 */
import React, { Fragment } from 'react';
import { uniq } from 'lodash';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import {
	TableCard,
	Search,
	Link,
	TableCardColumn,
} from '@poocommerce/components';
import {
	onQueryChange,
	getQuery,
	updateQueryString,
} from '@poocommerce/navigation';

/**
 * Internal dependencies
 */
import { useTransactions, useTransactionsSummary } from 'wcpay/data';
import { Transaction } from 'wcpay/data/transactions/hooks';
import OrderLink from 'wcpay/components/order-link';
import RiskLevel, { calculateRiskMapping } from 'wcpay/components/risk-level';
import ClickableCell from 'wcpay/components/clickable-cell';
import { getDetailsURL } from 'wcpay/components/details-link';
import { displayType } from 'wcpay/transactions/strings';
import { depositStatusLabels } from 'wcpay/deposits/strings';
import { formatStringValue, applyThousandSeparator } from 'wcpay/utils';
import {
	formatCurrency,
	formatExplicitCurrency,
	formatExportAmount,
} from 'multi-currency/interface/functions';
import { getTransactionChannel } from 'wcpay/utils/charge';
import Deposit from './deposit';
import ConvertedAmount from './converted-amount';
import autocompleter from 'wcpay/transactions/autocompleter';
import './style.scss';
import TransactionsFilters from '../filters';
import Page from '../../components/page';
import { recordEvent } from 'tracks';
import DownloadButton from 'wcpay/components/download-button';
import {
	getTransactionsCSVRequestURL,
	transactionsDownloadEndpoint,
} from '../../data/transactions/resolvers';
import p24BankList from '../../payment-details/payment-method/p24/bank-list';
import { HoverTooltip } from 'wcpay/components/tooltip';
import { formatDateTimeFromString } from 'wcpay/utils/date-time';
import { usePersistedColumnVisibility } from 'wcpay/hooks/use-persisted-table-column-visibility';
import { useReportExport } from 'wcpay/hooks/use-report-export';
import { getTransactionPaymentMethodTitle } from 'wcpay/transactions/utils/getTransactionPaymentMethodTitle';

interface TransactionsListProps {
	depositId?: string;
}

interface Column extends TableCardColumn {
	key:
		| 'transaction_id'
		| 'date'
		| 'type'
		| 'channel'
		| 'amount'
		| 'fees'
		| 'net'
		| 'order'
		| 'subscriptions'
		| 'source'
		| 'customer_name'
		| 'customer_email'
		| 'customer_country'
		| 'risk_level'
		| 'deposit';
	visible?: boolean;
	cellClassName?: string;
}

// FLAG: PAYMENT_METHODS_LIST
// If your payment method needs a custom display on the transactions list, you can add it here.
const getPaymentSourceDetails = ( txn: Transaction ) => {
	if ( ! txn.source_identifier ) {
		return <Fragment></Fragment>;
	}

	switch ( txn.source ) {
		case 'giropay':
			return <Fragment>&nbsp;&nbsp;{ txn.source_identifier }</Fragment>;
		case 'p24':
			return (
				<Fragment>
					&nbsp;&nbsp;
					{ p24BankList[ txn.source_identifier ] ?? '' }
				</Fragment>
			);
		default:
			return (
				<Fragment>
					&nbsp;&bull;&bull;&bull;&bull;&nbsp;{ ' ' }
					{ txn.source_identifier }
				</Fragment>
			);
	}
};

const getSourceDeviceIcon = ( txn: Transaction ) => {
	let tooltipDescription = '';

	if ( txn.source_device === 'ios' ) {
		tooltipDescription = __(
			'Tap to Pay on iPhone',
			'poocommerce-payments'
		);
	} else if ( txn.source_device === 'android' ) {
		tooltipDescription = __(
			'Tap to Pay on Android',
			'poocommerce-payments'
		);
	}

	return (
		<HoverTooltip isVisible={ false } content={ tooltipDescription }>
			<span className="poocommerce-taptopay__icon"></span>
		</HoverTooltip>
	);
};

const getColumns = (
	includeDeposit: boolean,
	includeSubscription: boolean
): Column[] =>
	[
		{
			key: 'transaction_id',
			label: __( 'Transaction ID', 'poocommerce-payments' ),
			visible: false,
			isLeftAligned: true,
		},
		{
			key: 'date',
			label: __( 'Date / Time', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Date and time', 'poocommerce-payments' ),
			required: true,
			isLeftAligned: true,
			defaultOrder: 'desc',
			cellClassName: 'date-time',
			isSortable: true,
			defaultSort: true,
		},
		{
			key: 'type',
			label: __( 'Type', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Type', 'poocommerce-payments' ),
			required: true,
			isLeftAligned: true,
		},
		{
			key: 'channel',
			label: __( 'Sales channel', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Sales channel', 'poocommerce-payments' ),
			required: true,
			isLeftAligned: true,
		},
		{
			key: 'customer_currency',
			label: __( 'Paid Currency', 'poocommerce-payments' ),
			screenReaderLabel: __(
				'Customer Currency',
				'poocommerce-payments'
			),
			isSortable: true,
			visible: false,
		},
		{
			key: 'customer_amount',
			label: __( 'Amount Paid', 'poocommerce-payments' ),
			screenReaderLabel: __(
				'Amount in Customer Currency',
				'poocommerce-payments'
			),
			isNumeric: true,
			isSortable: true,
			visible: false,
		},
		{
			key: 'currency',
			label: __( 'Payout Currency', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Payout Currency', 'poocommerce-payments' ),
			isSortable: true,
			visible: false,
		},
		{
			key: 'amount',
			label: __( 'Amount', 'poocommerce-payments' ),
			screenReaderLabel: __(
				'Amount in Payout Currency',
				'poocommerce-payments'
			),
			isNumeric: true,
			isSortable: true,
		},
		{
			key: 'fees',
			label: __( 'Fees', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Fees', 'poocommerce-payments' ),
			isNumeric: true,
			isSortable: true,
		},
		{
			key: 'net',
			label: __( 'Net', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Net', 'poocommerce-payments' ),
			isNumeric: true,
			required: true,
			isSortable: true,
		},
		{
			key: 'order',
			label: __( 'Order #', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Order number', 'poocommerce-payments' ),
			required: true,
		},
		includeSubscription && {
			key: 'subscriptions',
			label: __( 'Subscription #', 'poocommerce-payments' ),
			screenReaderLabel: __(
				'Subscription number',
				'poocommerce-payments'
			),
		},
		{
			key: 'source',
			label: __( 'Payment Method', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Payment Method', 'poocommerce-payments' ),
			cellClassName: 'is-center-aligned',
		},
		{
			key: 'customer_name',
			label: __( 'Customer', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Customer', 'poocommerce-payments' ),
			isLeftAligned: true,
		},
		{
			key: 'customer_email',
			label: __( 'Email', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Email', 'poocommerce-payments' ),
			visible: false,
			isLeftAligned: true,
		},
		{
			key: 'customer_country',
			label: __( 'Country', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Country', 'poocommerce-payments' ),
			visible: false,
			isLeftAligned: true,
		},
		{
			key: 'risk_level',
			label: __( 'Risk level', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Risk level', 'poocommerce-payments' ),
			visible: false,
			isLeftAligned: true,
		},
		includeDeposit && {
			key: 'deposit_id',
			label: __( 'Payout ID', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Payout ID', 'poocommerce-payments' ),
			cellClassName: 'deposit',
			isLeftAligned: true,
			visible: false,
		},
		includeDeposit && {
			key: 'deposit',
			label: __( 'Payout date', 'poocommerce-payments' ),
			screenReaderLabel: __( 'Payout date', 'poocommerce-payments' ),
			cellClassName: 'deposit',
			isLeftAligned: true,
		},
		includeDeposit && {
			key: 'deposit_status',
			label: __( 'Payout status', 'poocommerce-payments' ),
			visible: false,
		},
	].filter( Boolean ) as Column[]; // We explicitly define the type because TypeScript can't infer the type post-filtering.

export const TransactionsList = (
	props: TransactionsListProps
): JSX.Element => {
	const { transactions, isLoading } = useTransactions(
		getQuery(),
		props.depositId ?? ''
	);
	const {
		transactionsSummary,
		isLoading: isSummaryLoading,
	} = useTransactionsSummary( getQuery(), props.depositId ?? '' );

	const { requestReportExport, isExportInProgress } = useReportExport();

	const { createNotice } = useDispatch( 'core/notices' );

	const { onColumnsChange, columnsToDisplay } = usePersistedColumnVisibility<
		Column
	>(
		'wc_payments_transactions_hidden_columns',
		getColumns( ! props.depositId, wcpaySettings.isSubscriptionsActive )
	);

	const totalRows = transactionsSummary.count || 0;
	const rows = transactions.map( ( txn ) => {
		const detailsURL =
			getDetailsURL(
				txn.payment_intent_id || txn.charge_id,
				'transactions'
			) +
			'&transaction_id=' +
			txn.transaction_id +
			'&transaction_type=' +
			( txn.metadata && 'card_reader_fee' === txn.metadata.charge_type
				? txn.metadata.charge_type
				: txn.type );
		const clickable =
			'financing_payout' !== txn.type &&
			! ( 'financing_paydown' === txn.type && '' === txn.charge_id )
				? ( children: React.ReactNode ) => (
						<ClickableCell href={ detailsURL }>
							{ children }
						</ClickableCell>
				  )
				: ( children: React.ReactNode ) => children;

		const orderUrl = txn.order ? (
			<OrderLink order={ txn.order } />
		) : (
			__( 'N/A', 'poocommerce-payments' )
		);
		const orderSubscriptions = txn.order && txn.order.subscriptions;
		const subscriptionsValue =
			wcpaySettings.isSubscriptionsActive && orderSubscriptions
				? orderSubscriptions
						.map( ( subscription ) => subscription.number )
						.join( ', ' )
				: '';
		const subscriptions =
			wcpaySettings.isSubscriptionsActive && orderSubscriptions
				? orderSubscriptions.map( ( subscription, i, all ) => [
						<OrderLink key={ i } order={ subscription } />,
						i !== all.length - 1 && ', ',
				  ] )
				: [];
		const riskLevel = <RiskLevel risk={ txn.risk_level } />;

		const customerName =
			txn.order && txn.order.customer_url ? (
				<Link href={ txn.order.customer_url ?? '' }>
					{ txn.customer_name }
				</Link>
			) : (
				txn.customer_name
			);
		const customerEmail = txn.order ? (
			<Link href={ txn.order.customer_url ?? '' }>
				{ txn.customer_email }
			</Link>
		) : (
			txn.customer_email
		);

		const currency = txn.currency.toUpperCase();

		const dataType = txn.metadata ? txn.metadata.charge_type : txn.type;
		const formatAmount = () => {
			const amount = txn.metadata ? 0 : txn.amount;
			const fromAmount = txn.customer_amount ? txn.customer_amount : 0;

			return {
				value: formatExportAmount( amount, currency ),
				display: clickable(
					<ConvertedAmount
						amount={ amount }
						currency={ currency }
						fromAmount={ fromAmount }
						fromCurrency={ txn.customer_currency.toUpperCase() }
					/>
				),
			};
		};
		const formatFees = () => {
			const isCardReader =
				txn.metadata && txn.metadata.charge_type === 'card_reader_fee';
			const feeAmount = formatExportAmount(
				isCardReader ? txn.amount : txn.fees * -1,
				currency
			);
			return {
				value: feeAmount,
				display: clickable(
					formatCurrency(
						isCardReader ? txn.amount : txn.fees * -1,
						currency
					)
				),
			};
		};
		const formatCustomerAmount = () => {
			return {
				value: formatExportAmount(
					txn.customer_amount,
					txn.customer_currency
				),
				display: clickable(
					formatCurrency( txn.customer_amount, txn.customer_currency )
				),
			};
		};

		const isFinancingType =
			-1 !==
			[ 'financing_payout', 'financing_paydown' ].indexOf( txn.type );

		const isReaderFee = dataType === 'card_reader_fee';

		const deposit = ! isFinancingType && (
			<Deposit
				depositId={ txn.deposit_id }
				dateAvailable={ txn.available_on }
			/>
		);

		const depositStatus = txn.deposit_status
			? depositStatusLabels[ txn.deposit_status ]
			: '';

		const accountCountry = wcpaySettings?.accountStatus?.country || 'US';

		// Map transaction into table row.
		const data = {
			transaction_id: {
				value: txn.transaction_id,
				display: clickable( txn.transaction_id ),
			},
			date: {
				value: txn.date,
				display: clickable(
					formatDateTimeFromString( txn.date, {
						includeTime: true,
					} )
				),
			},
			channel: {
				value: getTransactionChannel( txn.channel ),
				display: clickable(
					<Fragment>
						{ getTransactionChannel( txn.channel ) }
						{ txn.source_device && getSourceDeviceIcon( txn ) }
					</Fragment>
				),
			},
			type: {
				value: displayType[ dataType ],
				display: clickable(
					displayType[ dataType ] || formatStringValue( dataType )
				),
			},
			source: {
				value: txn.source,
				display:
					! isFinancingType && ! isReaderFee ? (
						clickable(
							<span className="payment-method-details-list-item">
								<HoverTooltip
									isVisible={ false }
									content={ getTransactionPaymentMethodTitle(
										txn.source
									) }
								>
									<span
										className={ `payment-method__brand payment-method__brand--${
											txn.source
										} account-country--${ accountCountry?.toLowerCase() }` }
										aria-label={ getTransactionPaymentMethodTitle(
											txn.source
										) }
									/>
								</HoverTooltip>
								{ getPaymentSourceDetails( txn ) }
							</span>
						)
					) : (
						<span className={ 'payment-method__brand' }>—</span>
					),
			},
			order: {
				value: txn.order && txn.order.number,
				display: orderUrl,
			},
			subscriptions: {
				value: subscriptionsValue,
				display: subscriptions,
			},
			customer_name: {
				value: txn.customer_name,
				display:
					! isFinancingType && ! isReaderFee
						? customerName
						: __( 'N/A', 'poocommerce-payments' ),
			},
			customer_email: {
				value: txn.customer_email,
				display:
					! isFinancingType && ! isReaderFee
						? customerEmail
						: __( 'N/A', 'poocommerce-payments' ),
			},
			customer_country: {
				value: txn.customer_country,
				display: clickable( txn.customer_country ),
			},
			customer_currency: {
				value: txn.customer_currency.toUpperCase(),
				display: clickable( txn.customer_currency.toUpperCase() ),
			},
			customer_amount: formatCustomerAmount(),
			currency: {
				value: txn.currency.toUpperCase(),
				display: clickable( txn.currency.toUpperCase() ),
			},
			amount: formatAmount(),
			// fees should display as negative. The format $-9.99 is determined by WC-Admin
			fees: formatFees(),
			net: {
				value: formatExportAmount( txn.net, currency ),
				display: clickable(
					formatExplicitCurrency( txn.net, currency )
				),
			},
			risk_level: {
				value: calculateRiskMapping( txn.risk_level ),
				display: clickable( riskLevel ),
			},
			deposit_id: {
				value: txn.deposit_id,
				display: txn.deposit_id,
			},
			deposit: { value: txn.available_on, display: deposit },
			deposit_status: {
				value: depositStatus,
				display: depositStatus,
			},
		};

		return columnsToDisplay.map(
			( { key } ) => data[ key ] || { display: null }
		);
	} );

	const searchedLabels =
		getQuery().search &&
		getQuery().search?.map( ( v ) => ( {
			key: v,
			label: v,
		} ) );

	const onSearchChange = ( values: Column[] ) => {
		updateQueryString( {
			search: values.length
				? uniq( values.map( ( v ) => v.label ) )
				: undefined,
		} );
	};

	let searchPlaceholder = wcpaySettings.isSubscriptionsActive
		? __(
				'Search by order number, subscription number, customer name, or billing email',
				'poocommerce-payments'
		  )
		: __(
				'Search by order number, customer name, or billing email',
				'poocommerce-payments'
		  );

	const title = __( 'Transactions', 'poocommerce-payments' );

	const downloadable = !! rows.length;

	const { path } = getQuery();
	const onExport = async () => {
		recordEvent( 'wcpay_csv_export_click', {
			row_type: 'transactions',
			source: path,
			exported_row_count: transactionsSummary.count,
		} );

		const locale = wcSettings.locale.userLocale;
		const userEmail = wcpaySettings.currentUserEmail;
		const depositId = props.depositId;

		const {
			date_after: dateAfter,
			date_before: dateBefore,
			date_between: dateBetween,
			match,
			search,
			type_is: typeIs,
			type_is_not: typeIsNot,
			source_device_is: sourceDeviceIs,
			source_device_is_not: sourceDeviceIsNot,
			channel_is: channelIs,
			channel_is_not: channelIsNot,
			customer_country_is: customerCountryIs,
			customer_country_is_not: customerCountryIsNot,
			risk_level_is: riskLevelIs,
			risk_level_is_not: riskLevelIsNot,
			customer_currency_is: customerCurrencyIs,
			customer_currency_is_not: customerCurrencyIsNot,
			source_is: sourceIs,
			source_is_not: sourceIsNot,
		} = getQuery();

		const exportRequestURL = getTransactionsCSVRequestURL( {
			userEmail,
			locale,
			dateAfter,
			dateBefore,
			dateBetween,
			match,
			search,
			typeIs,
			typeIsNot,
			sourceDeviceIs,
			sourceDeviceIsNot,
			customerCurrencyIs,
			customerCurrencyIsNot,
			sourceIs,
			sourceIsNot,
			channelIs,
			channelIsNot,
			customerCountryIs,
			customerCountryIsNot,
			riskLevelIs,
			riskLevelIsNot,
			depositId,
		} );

		const isFiltered =
			!! dateAfter ||
			!! dateBefore ||
			!! dateBetween ||
			!! sourceIs ||
			!! sourceIsNot ||
			!! search ||
			!! typeIs ||
			!! typeIsNot ||
			!! channelIs ||
			!! channelIsNot ||
			!! customerCountryIs ||
			!! customerCountryIsNot ||
			!! riskLevelIs ||
			!! riskLevelIsNot ||
			!! sourceDeviceIs ||
			!! sourceDeviceIsNot;

		const confirmThreshold = 10000;
		const confirmMessage = sprintf(
			__(
				"You are about to export %d transactions. If you'd like to reduce the size of your export, you can use one or more filters. Would you like to continue?",
				'poocommerce-payments'
			),
			totalRows
		);

		if (
			isFiltered ||
			totalRows < confirmThreshold ||
			window.confirm( confirmMessage )
		) {
			requestReportExport( {
				exportRequestURL,
				exportFileAvailabilityEndpoint: transactionsDownloadEndpoint,
				userEmail,
			} );

			createNotice(
				'success',
				sprintf(
					__(
						'We’re processing your export. 🎉 The file will download automatically and be emailed to %s.',
						'poocommerce-payments'
					),
					userEmail
				)
			);
		}
	};

	if ( ! wcpaySettings.featureFlags.customSearch ) {
		searchPlaceholder = __(
			'Search by customer name',
			'poocommerce-payments'
		);
	}

	const isCurrencyFiltered = 'string' === typeof getQuery().store_currency_is;

	const isSingleCurrency =
		2 > ( transactionsSummary.store_currencies || [] ).length;

	// initializing summary with undefined as we don't want to render the TableSummary component unless we have the data
	let summary;
	const isTransactionsSummaryDataLoaded =
		transactionsSummary.count !== undefined &&
		transactionsSummary.total !== undefined &&
		false === isSummaryLoading;

	// Generate summary only if the data has been loaded
	if ( isTransactionsSummaryDataLoaded ) {
		summary = [
			{
				label: _n(
					'transaction',
					'transactions',
					// We've already checked that `.count` is not undefined, but TypeScript doesn't detect
					// that so we remove the `undefined` in the type manually.
					transactionsSummary.count as number,
					'poocommerce-payments'
				),
				value: `${ applyThousandSeparator(
					transactionsSummary.count as number
				) }`,
			},
		];

		const hasTransactions = ( transactionsSummary.count as number ) > 0;
		if ( hasTransactions && ( isSingleCurrency || isCurrencyFiltered ) ) {
			summary.push(
				{
					label: __( 'total', 'poocommerce-payments' ),
					value: `${ formatExplicitCurrency(
						// We've already checked that `.total` is not undefined, but TypeScript doesn't detect
						// that so we remove the `undefined` in the type manually.
						transactionsSummary.total as number,
						transactionsSummary.currency
					) }`,
				},
				{
					label: __( 'fees', 'poocommerce-payments' ),
					value: `${ formatCurrency(
						transactionsSummary.fees ?? 0,
						transactionsSummary.currency
					) }`,
				},
				{
					label: __( 'net', 'poocommerce-payments' ),
					value: `${ formatExplicitCurrency(
						transactionsSummary.net ?? 0,
						transactionsSummary.currency
					) }`,
				}
			);
		}
	}

	const showFilters = ! props.depositId;
	const storeCurrencies =
		transactionsSummary.store_currencies ||
		( isCurrencyFiltered ? [ getQuery().store_currency_is ?? '' ] : [] );
	const customerCurrencies = transactionsSummary.customer_currencies || [];
	const transactionSources = transactionsSummary.sources || [];

	return (
		<Page>
			{ showFilters && (
				<TransactionsFilters
					storeCurrencies={ storeCurrencies }
					customerCurrencies={ customerCurrencies }
					transactionSources={ transactionSources }
				/>
			) }
			<TableCard
				className="transactions-list poocommerce-report-table has-search"
				title={ title }
				isLoading={ isLoading }
				rowsPerPage={ parseInt( getQuery().per_page ?? '', 10 ) || 25 }
				totalRows={ totalRows }
				headers={ columnsToDisplay }
				rows={ rows }
				summary={ summary }
				query={ getQuery() }
				onQueryChange={ onQueryChange }
				onColumnsChange={ onColumnsChange }
				actions={ [
					<Search
						allowFreeTextSearch={ true }
						inlineTags
						key="search"
						onChange={ onSearchChange }
						placeholder={ searchPlaceholder }
						selected={ searchedLabels }
						showClearButton={ true }
						type={
							wcpaySettings.featureFlags.customSearch
								? 'custom'
								: 'customers'
						}
						autocompleter={ autocompleter }
					/>,
					downloadable && (
						<DownloadButton
							key="download"
							isDisabled={ isLoading || isExportInProgress }
							isBusy={ isExportInProgress }
							onClick={ onExport }
						/>
					),
				] }
			/>
		</Page>
	);
};

export default TransactionsList;
