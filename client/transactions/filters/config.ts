/**
 * External dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { getSetting } from '@poocommerce/settings';

/**
 * Internal dependencies
 */
import {
	displayType,
	sourceDevice,
	channel,
	riskLevel,
} from 'transactions/strings';

interface TransactionsFilterEntryType {
	label: string;
	value: string;
}

export interface TransactionsFilterType {
	label: string;
	param: string;
	staticParams: string[];
	showFilters: () => boolean;
	filters: TransactionsFilterEntryType[];
	defaultValue?: string;
}

const transactionTypesOptions = Object.entries( displayType )
	.map( ( [ type, label ] ) => {
		return { label, value: type };
	} )
	.filter( function ( el ) {
		return el != null;
	} );

const loanDefinitions =
	'undefined' !== typeof wcpaySettings
		? wcpaySettings.accountLoans.loans
		: [];

const loanSelectionOptions = loanDefinitions.map( ( loanDefinition ) => {
	const loanDefinitionSplitted = loanDefinition.split( '|' );
	const loanDisplayValue = sprintf(
		'ID: %s | %s',
		loanDefinitionSplitted[ 0 ],
		'active' === loanDefinitionSplitted[ 1 ]
			? __( 'In Progress', 'poocommerce-payments' )
			: __( 'Paid in Full', 'poocommerce-payments' )
	);

	return { label: loanDisplayValue, value: loanDefinitionSplitted[ 0 ] };
}, [] );

const transactionSourceDeviceOptions = Object.entries( sourceDevice ).map(
	( [ type, label ] ) => {
		return { label, value: type };
	}
);

const transactionChannelOptions = Object.entries( channel ).map(
	( [ type, label ] ) => {
		return { label, value: type };
	}
);

const transactionRiskLevelOptions = Object.entries( riskLevel ).map(
	( [ type, label ] ) => {
		return { label, value: type };
	}
);

const transactionCustomerCounryOptions = Object.entries(
	wcSettings.countries
).map( ( [ type, label ] ) => {
	return { label, value: type };
} );

export const getFilters = (
	depositCurrencyOptions: TransactionsFilterEntryType[],
	showDepositCurrencyFilter: boolean
): [ TransactionsFilterType, TransactionsFilterType ] => {
	return [
		{
			label: __( 'Deposit currency', 'poocommerce-payments' ),
			param: 'store_currency_is',
			staticParams: [
				'paged',
				'per_page',
				'orderby',
				'order',
				'search',
				'filter',
				'type_is',
				'type_is_not',
				'type_is_in',
				'date_before',
				'date_after',
				'date_between',
				'source_device_is',
				'source_device_is_not',
				'channel_is',
				'channel_is_not',
				'customer_country_is',
				'customer_country_is_not',
				'risk_level_is',
				'risk_level_is_not',
			],
			showFilters: () => showDepositCurrencyFilter,
			filters: [
				{
					label: __( 'All currencies', 'poocommerce-payments' ),
					value: '---',
				},
				...depositCurrencyOptions,
			],
			defaultValue: '---',
		},
		{
			label: __( 'Show', 'poocommerce-payments' ),
			param: 'filter',
			staticParams: [
				'paged',
				'per_page',
				'orderby',
				'order',
				'search',
				'store_currency_is',
			],
			showFilters: () => true,
			filters: [
				{
					label: __( 'All transactions', 'poocommerce-payments' ),
					value: 'all',
				},
				{
					label: __( 'Advanced filters', 'poocommerce-payments' ),
					value: 'advanced',
				},
			],
		},
	];
};

/**
 * TODO: Add an interface here for advanced filters, or adjust ESLint rules to allow using inferred type.
 */

/*eslint-disable max-len*/
export const getAdvancedFilters = (
	customerCurrencyOptions?: TransactionsFilterEntryType[],
	transactionSourceOptions?: TransactionsFilterEntryType[]
): any => {
	// TODO: Remove this and all the checks once we drop support of PooCommerce 7.7 and below.
	const wooCommerceVersionString = getSetting( 'wcVersion' );
	const wooCommerceVersion = parseFloat( wooCommerceVersionString ); // This will parse 7.7.1 to 7.7, but it's fine for this purpose

	return {
		/** translators: A sentence describing filters for Transactions. */
		title:
			wooCommerceVersion < 7.8
				? __(
						'Transactions match {{select /}} filters',
						'poocommerce-payments'
				  )
				: __(
						'Transactions match <select /> filters',
						'poocommerce-payments'
				  ),
		filters: {
			date: {
				labels: {
					add: __( 'Date', 'poocommerce-payments' ),
					remove: __(
						'Remove transaction date filter',
						'poocommerce-payments'
					),
					rule: __(
						'Select a transaction date filter match',
						'poocommerce-payments'
					),
					/* translators: A sentence describing a Transaction date filter. */
					title:
						wooCommerceVersion < 7.8
							? __(
									'{{title}}Date{{/title}} {{rule /}} {{filter /}}',
									'poocommerce-payments'
							  )
							: __(
									'<title>Date</title> <rule /> <filter />',
									'poocommerce-payments'
							  ),
					filter: __(
						'Select a transaction date',
						'poocommerce-payments'
					),
				},
				rules: [
					{
						value: 'before',
						label: __( 'Before', 'poocommerce-payments' ),
					},
					{
						value: 'after',
						label: __( 'After', 'poocommerce-payments' ),
					},
					{
						value: 'between',
						label: __( 'Between', 'poocommerce-payments' ),
					},
				],
				input: {
					component: 'Date',
				},
			},
			customer_currency: {
				labels: {
					add: __( 'Customer currency', 'poocommerce-payments' ),
					remove: __(
						'Remove transaction customer currency filter',
						'poocommerce-payments'
					),
					rule: __(
						'Select a transaction customer currency filter match',
						'poocommerce-payments'
					),
					/* translators: A sentence describing a Transaction customer currency filter. */
					title:
						wooCommerceVersion < 7.8
							? __(
									'{{title}}Customer currency{{/title}} {{rule /}} {{filter /}}',
									'poocommerce-payments'
							  )
							: __(
									'<title>Customer currency</title> <rule /> <filter />',
									'poocommerce-payments'
							  ),
					filter: __(
						'Select a customer currency',
						'poocommerce-payments'
					),
				},
				rules: [
					{
						value: 'is',
						/* translators: Sentence fragment, logical, "Is" refers to searching for transactions matching a chosen presentment currency. */
						label: _x(
							'Is',
							'transaction customer currency',
							'poocommerce-payments'
						),
					},
					{
						value: 'is_not',
						/* translators: Sentence fragment, logical, "Is not" refers to searching for transactions that don\'t match a chosen presentment currency. */
						label: _x(
							'Is not',
							'transaction customer currency',
							'poocommerce-payments'
						),
					},
				],
				input: {
					component: 'SelectControl',
					options: customerCurrencyOptions,
				},
			},
			source: {
				labels: {
					add: __( 'Payment method', 'poocommerce-payments' ),
					remove: __(
						'Remove payment method filter',
						'poocommerce-payments'
					),
					rule: __(
						'Select a payment method filter match',
						'poocommerce-payments'
					),
					title: __(
						'<title>Payment method</title> <rule /> <filter />',
						'poocommerce-payments'
					),
					filter: __(
						'Select a payment method',
						'poocommerce-payments'
					),
				},
				rules: [
					{
						value: 'is',
						/* translators: Sentence fragment, logical, "Is" refers to searching for transactions matching a chosen payment method. */
						label: _x(
							'Is',
							'payment method',
							'poocommerce-payments'
						),
					},
					{
						value: 'is_not',
						/* translators: Sentence fragment, logical, "Is not" refers to searching for transactions that don\'t match a chosen payment method. */
						label: _x(
							'Is not',
							'payment method',
							'poocommerce-payments'
						),
					},
				],
				input: {
					component: 'SelectControl',
					options: transactionSourceOptions,
				},
			},
			type: {
				labels: {
					add: __( 'Type', 'poocommerce-payments' ),
					remove: __(
						'Remove transaction type filter',
						'poocommerce-payments'
					),
					rule: __(
						'Select a transaction type filter match',
						'poocommerce-payments'
					),
					/* translators: A sentence describing a Transaction type filter. */
					title:
						wooCommerceVersion < 7.8
							? __(
									'{{title}}Type{{/title}} {{rule /}} {{filter /}}',
									'poocommerce-payments'
							  )
							: __(
									'<title>Type</title> <rule /> <filter />',
									'poocommerce-payments'
							  ),
					filter: __(
						'Select a transaction type',
						'poocommerce-payments'
					),
				},
				rules: [
					{
						value: 'is',
						/* translators: Sentence fragment, logical, "Is" refers to searching for transactions matching a chosen transaction type. */
						label: _x(
							'Is',
							'transaction type',
							'poocommerce-payments'
						),
					},
					{
						value: 'is_not',
						/* translators: Sentence fragment, logical, "Is not" refers to searching for transactions that don\'t match a chosen transaction type. */
						label: _x(
							'Is not',
							'transaction type',
							'poocommerce-payments'
						),
					},
				],
				input: {
					component: 'SelectControl',
					options: transactionTypesOptions,
				},
			},
			loan_id_is: {
				labels: {
					add: __( 'Loan', 'poocommerce-payments' ),
					remove: __( 'Remove loan filter', 'poocommerce-payments' ),
					rule: __( 'Select a loan', 'poocommerce-payments' ),
					/* translators: A sentence describing a Loan ID filter. */
					title:
						wooCommerceVersion < 7.8
							? __(
									'{{title}}Loan{{/title}} {{rule /}} {{filter /}}',
									'poocommerce-payments'
							  )
							: __(
									'<title>Loan</title> <rule /> <filter />',
									'poocommerce-payments'
							  ),
					filter: __( 'Select a loan', 'poocommerce-payments' ),
				},
				input: {
					component: 'SelectControl',
					type: 'loans',
					options: loanSelectionOptions,
				},
			},
			source_device: {
				labels: {
					add: __( 'Device Type', 'poocommerce-payments' ),
					remove: __(
						'Remove transaction device type filter',
						'poocommerce-payments'
					),
					rule: __(
						'Select a transaction device type filter match',
						'poocommerce-payments'
					),
					/* translators: A sentence describing a Transaction Device Type filter. */
					title:
						wooCommerceVersion < 7.8
							? __(
									'{{title}}Device type{{/title}} {{rule /}} {{filter /}}',
									'poocommerce-payments'
							  )
							: __(
									'<title>Device type</title> <rule /> <filter />',
									'poocommerce-payments'
							  ),
					filter: __(
						'Select a transaction device type',
						'poocommerce-payments'
					),
				},
				rules: [
					{
						value: 'is',
						/* translators: Sentence fragment, logical, "Is" refers to searching for transactions matching a chosen transaction type. */
						label: _x(
							'Is',
							'Source device',
							'poocommerce-payments'
						),
					},
					{
						value: 'is_not',
						/* translators: Sentence fragment, logical, "Is not" refers to searching for transactions that don\'t match a chosen transaction type. */
						label: _x(
							'Is not',
							'Source device',
							'poocommerce-payments'
						),
					},
				],
				input: {
					component: 'SelectControl',
					options: transactionSourceDeviceOptions,
				},
			},
			channel: {
				labels: {
					add: __( 'Sales channel', 'poocommerce-payments' ),
					remove: __(
						'Remove transaction sales channel filter',
						'poocommerce-payments'
					),
					rule: __(
						'Select a transaction sales channel filter match',
						'poocommerce-payments'
					),
					title:
						wooCommerceVersion < 7.8
							? __(
									'{{title}}Sales channel{{/title}} {{rule /}} {{filter /}}',
									'poocommerce-payments'
							  )
							: __(
									'<title>Sales channel</title> <rule /> <filter />',
									'poocommerce-payments'
							  ),
					filter: __(
						'Select a transaction sales channel',
						'poocommerce-payments'
					),
				},
				rules: [
					{
						value: 'is',
						/* translators: Sentence fragment, logical, "Is" refers to searching for transactions matching a chosen transaction sales channel type. */
						label: _x(
							'Is',
							'Sales channel',
							'poocommerce-payments'
						),
					},
					{
						value: 'is_not',
						/* translators: Sentence fragment, logical, "Is not" refers to searching for transactions that don\'t match a chosen transaction sales channel type. */
						label: _x(
							'Is not',
							'Sales channel',
							'poocommerce-payments'
						),
					},
				],
				input: {
					component: 'SelectControl',
					options: transactionChannelOptions,
				},
			},
			customer_country: {
				labels: {
					add: __( 'Customer Country', 'poocommerce-payments' ),
					remove: __(
						'Remove transaction customer country filter',
						'poocommerce-payments'
					),
					rule: __(
						'Select a transaction customer country filter match',
						'poocommerce-payments'
					),
					/* translators: A sentence describing a Transaction customer country. */
					title:
						wooCommerceVersion < 7.8
							? __(
									'{{title}}Customer country{{/title}} {{rule /}} {{filter /}}',
									'poocommerce-payments'
							  )
							: __(
									'<title>Customer country</title> <rule /> <filter />',
									'poocommerce-payments'
							  ),
					filter: __(
						'Select a transaction customer country',
						'poocommerce-payments'
					),
				},
				rules: [
					{
						value: 'is',
						/* translators: Sentence fragment, logical, "Is" refers to searching for transactions matching a chosen transaction customer country. */
						label: _x(
							'Is',
							'Customer Country',
							'poocommerce-payments'
						),
					},
					{
						value: 'is_not',
						/* translators: Sentence fragment, logical, "Is not" refers to searching for transactions that don\'t match a chosen transaction customer country. */
						label: _x(
							'Is not',
							'Customer Country',
							'poocommerce-payments'
						),
					},
				],
				input: {
					component: 'SelectControl',
					options: transactionCustomerCounryOptions,
				},
			},
			risk_level: {
				labels: {
					add: __( 'Risk Level', 'poocommerce-payments' ),
					remove: __(
						'Remove transaction Risk Level filter',
						'poocommerce-payments'
					),
					rule: __(
						'Select a transaction Risk Level filter match',
						'poocommerce-payments'
					),
					/* translators: A sentence describing a Transaction Risk Level filter. */
					title:
						wooCommerceVersion < 7.8
							? __(
									'{{title}}Risk Level{{/title}} {{rule /}} {{filter /}}',
									'poocommerce-payments'
							  )
							: __(
									'<title>Risk Level</title> <rule /> <filter />',
									'poocommerce-payments'
							  ),
					filter: __(
						'Select a transaction Risk Level',
						'poocommerce-payments'
					),
				},
				rules: [
					{
						value: 'is',
						/* translators: Sentence fragment, logical, "Is" refers to searching for transactions matching a chosen transaction risk level. */
						label: _x( 'Is', 'Risk Level', 'poocommerce-payments' ),
					},
					{
						value: 'is_not',
						/* translators: Sentence fragment, logical, "Is not" refers to searching for transactions that don\'t match a chosen transaction risk level. */
						label: _x(
							'Is not',
							'Risk Level',
							'poocommerce-payments'
						),
					},
				],
				input: {
					component: 'SelectControl',
					options: transactionRiskLevelOptions,
				},
			},
		},
	};
};
/*eslint-enable max-len*/
