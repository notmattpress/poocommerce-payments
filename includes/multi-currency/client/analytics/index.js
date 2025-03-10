/** @format */
/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

const getCustomerCurrencies = () => {
	return (
		wcSettings.customerCurrencies.sort( ( a, b ) => {
			return a.label < b.label ? -1 : 1;
		} ) ?? []
	);
};

addFilter(
	'poocommerce_admin_orders_report_advanced_filters',
	'poocommerce-payments',
	( advancedFilters ) => {
		advancedFilters.filters = {
			currency: {
				labels: {
					add: __( 'Customer currency', 'poocommerce-payments' ),
					remove: __(
						'Remove customer currency filter',
						'poocommerce-payments'
					),
					rule: __(
						'Select a customer currency filter match',
						'poocommerce-payments'
					),
					title: __(
						'{{title}}Customer Currency{{/title}} {{rule /}} {{filter /}}',
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
						/* translators: Sentence fragment, logical, "Is" refers to searching for orders matching a chosen currency. */
						label: __(
							'Is',
							'customer currency',
							'poocommerce-payments'
						),
					},
					{
						value: 'is_not',
						// eslint-disable-next-line max-len
						/* translators: Sentence fragment, logical, "Is Not" refers to searching for orders not matching a chosen currency. */
						label: __(
							'Is Not',
							'customer currency',
							'poocommerce-payments'
						),
					},
				],
				input: {
					component: 'SelectControl',
					options: getCustomerCurrencies(),
				},
				allowMultiple: true,
			},
			...advancedFilters.filters,
		};

		return advancedFilters;
	}
);

addFilter(
	'poocommerce_admin_report_table',
	'poocommerce-payments',
	( tableData ) => {
		// If we don't need to or are unable to add the column, just return the table data.
		if (
			! tableData.items ||
			! tableData.items.data ||
			! tableData.items.data.length ||
			tableData.endpoint !== 'orders'
		) {
			return tableData;
		}

		const updatedHeaders = [
			...tableData.headers,
			{
				isNumeric: false,
				isSortable: false,
				key: 'customer_currency',
				label: __( 'Customer currency', 'poocommerce-payments' ),
				required: false,
				screenReaderLabel: __(
					'Customer currency',
					'poocommerce-payments'
				),
			},
		];

		const updatedRows = tableData.rows.map( ( rows, index ) => {
			const item = tableData.items.data[ index ];
			const currency = item.hasOwnProperty( 'order_currency' )
				? item.order_currency
				: '';

			return [
				...rows,
				{
					display: currency,
					value: currency,
				},
			];
		} );

		tableData.rows = updatedRows;
		tableData.headers = updatedHeaders;

		return tableData;
	}
);

addFilter(
	'poocommerce_admin_orders_report_filters',
	'poocommerce-payments',
	( filters ) => [
		{
			label: __( 'Customer currency', 'poocommerce-payments' ),
			param: 'currency',
			staticParams: [],
			showFilters: () => true,
			filters: [
				{
					label: __( 'All currencies', 'poocommerce-payments' ),
					value: 'all',
				},
				...getCustomerCurrencies(),
			],
		},
		...filters,
	]
);

// Filter report currency formatter to display the selected currency symbol.
addFilter(
	'poocommerce_admin_report_currency',
	'poocommerce-payments',
	( config, { currency } ) => {
		if ( ! currency ) return config;

		const currencyData = Object.values( wcpaySettings.currencyData ).find(
			( c ) => c.code === currency
		);

		if ( ! currencyData ) return config;

		return {
			...config,
			symbol: currencyData.symbol,
		};
	}
);
