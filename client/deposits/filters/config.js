/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { getSetting } from '@poocommerce/settings';

/**
 * Internal dependencies
 */
import { depositStatusLabels } from 'deposits/strings';

const depositStatusOptions = Object.entries( depositStatusLabels )
	// Ignore the 'deducted' status, which is only a display status and not to be used in filters.
	.filter( ( [ status ] ) => status !== 'deducted' )
	.map( ( [ status, label ] ) => {
		if ( status === 'paid' ) {
			return {
				label: __( 'Completed', 'poocommerce-payments' ),
				value: 'paid',
			};
		}
		return { label, value: status };
	} );

export const filters = [
	{
		label: __( 'Payout currency', 'poocommerce-payments' ),
		param: 'store_currency_is',
		staticParams: [
			'paged',
			'per_page',
			'orderby',
			'order',
			'filter',
			'date_before',
			'date_after',
			'date_between',
			'status_is',
			'status_is_not',
			'match',
		],
		showFilters: () => false,
		filters: [
			{
				label: __( 'All', 'poocommerce-payments' ),
				value: '---',
			},
			// Other values are getting injected later, taking values from store.
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
			'store_currency_is',
		],
		showFilters: () => true,
		filters: [
			{
				label: __( 'All payouts', 'poocommerce-payments' ),
				value: 'all',
			},
			{
				label: __( 'Advanced filters', 'poocommerce-payments' ),
				value: 'advanced',
			},
		],
	},
	// Declare advanced filters here.
];

// TODO: Remove this and all the checks once we drop support of PooCommerce 7.7 and below.
const wooCommerceVersionString = getSetting( 'wcVersion' );
const wooCommerceVersion = parseFloat( wooCommerceVersionString ); // This will parse 7.7.1 to 7.7, but it's fine for this purpose

/*eslint-disable max-len*/
export const advancedFilters = {
	/** translators: A sentence describing filters for deposits. See screen shot for context: https://d.pr/i/NcGpwL */
	title:
		wooCommerceVersion < 7.8
			? __( 'Payouts match {{select /}} filters', 'poocommerce-payments' )
			: __( 'Payouts match <select /> filters', 'poocommerce-payments' ),
	filters: {
		date: {
			labels: {
				add: __( 'Date', 'poocommerce-payments' ),
				remove: __(
					'Remove payout date filter',
					'poocommerce-payments'
				),
				rule: __(
					'Select a payout date filter match',
					'poocommerce-payments'
				),
				/* translators: A sentence describing a deposit date filter. See screen shot for context: https://d.pr/i/NcGpwL */
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
				filter: __( 'Select a payout date', 'poocommerce-payments' ),
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
		status: {
			labels: {
				add: __( 'Status', 'poocommerce-payments' ),
				remove: __(
					'Remove payout status filter',
					'poocommerce-payments'
				),
				rule: __(
					'Select a payout status filter match',
					'poocommerce-payments'
				),
				/* translators: A sentence describing a deposit status filter. See screen shot for context: https://d.pr/i/NcGpwL */
				title:
					wooCommerceVersion < 7.8
						? __(
								'{{title}}Status{{/title}} {{rule /}} {{filter /}}',
								'poocommerce-payments'
						  )
						: __(
								'<title>Status</title> <rule /> <filter />',
								'poocommerce-payments'
						  ),
				filter: __( 'Select a payout status', 'poocommerce-payments' ),
			},
			rules: [
				{
					value: 'is',
					/* translators: Sentence fragment, logical, "Is" refers to searching for deposits matching a chosen deposit status. Screenshot for context: https://d.pr/i/NcGpwL */
					label: _x( 'Is', 'payout status', 'poocommerce-payments' ),
				},
				{
					value: 'is_not',
					/* translators: Sentence fragment, logical, "Is not" refers to searching for deposits that don\'t match a chosen deposit status. Screenshot for context: https://d.pr/i/NcGpwL */
					label: _x(
						'Is not',
						'payout status',
						'poocommerce-payments'
					),
				},
			],
			input: {
				component: 'SelectControl',
				options: depositStatusOptions,
			},
		},
	},
};
