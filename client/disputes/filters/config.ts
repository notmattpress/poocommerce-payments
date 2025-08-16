/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { getSetting } from '@poocommerce/settings';

/**
 * Internal dependencies
 */
import { displayStatus } from 'disputes/strings';

interface DisputesFilterEntryType {
	label: string;
	value: string;
}

export interface DisputesFilterType {
	label: string;
	param: string;
	staticParams: string[];
	showFilters: () => boolean;
	filters: DisputesFilterEntryType[];
	defaultValue?: string;
}

const disputesStatusOptions = Object.entries( displayStatus )
	.map( ( [ status, label ] ) => {
		return { label, value: status };
	} )
	.filter( function ( el ) {
		return el != null;
	} );

export const disputeAwaitingResponseStatuses = [
	'needs_response',
	'warning_needs_response',
];

export const disputeUnderReviewStatuses = [
	'under_review',
	'warning_under_review',
];

export const filters: [ DisputesFilterType, DisputesFilterType ] = [
	{
		label: __( 'Dispute currency', 'poocommerce-payments' ),
		param: 'store_currency_is',
		staticParams: [
			'paged',
			'per_page',
			'orderby',
			'order',
			'search',
			'filter',
			'status_is',
			'status_is',
			'date_before',
			'date_after',
			'date_between',
		],
		showFilters: () => false,
		filters: [
			{
				label: __( 'All currencies', 'poocommerce-payments' ),
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
			'search',
			'store_currency_is',
		],
		showFilters: () => true,
		filters: [
			{
				label: __( 'Needs response', 'poocommerce-payments' ),
				value: 'awaiting_response',
			},
			{
				label: __( 'All disputes', 'poocommerce-payments' ),
				value: 'all',
			},
			{
				label: __( 'Advanced filters', 'poocommerce-payments' ),
				value: 'advanced',
			},
		],
	},
];

// TODO: Remove this and all the checks once we drop support of PooCommerce 7.7 and below.
const wooCommerceVersionString = getSetting( 'wcVersion' );
const wooCommerceVersion = parseFloat( wooCommerceVersionString ); // This will parse 7.7.1 to 7.7, but it's fine for this purpose

/*eslint-disable max-len*/
export const advancedFilters = {
	/** translators: A sentence describing filters for Disputes. */
	title:
		wooCommerceVersion < 7.8
			? __(
					'Disputes match {{select /}} filters',
					'poocommerce-payments'
			  )
			: __( 'Disputes match <select /> filters', 'poocommerce-payments' ),
	filters: {
		date: {
			labels: {
				add: __( 'Disputed on date', 'poocommerce-payments' ),
				remove: __(
					'Remove dispute date filter',
					'poocommerce-payments'
				),
				rule: __(
					'Select a dispute date filter match',
					'poocommerce-payments'
				),
				/* translators: A sentence describing a Dispute date filter. */
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
				filter: __( 'Select a dispute date', 'poocommerce-payments' ),
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
					'Remove dispute status filter',
					'poocommerce-payments'
				),
				rule: __(
					'Select a dispute status filter match',
					'poocommerce-payments'
				),
				/* translators: A sentence describing a Dispute status filter. */
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
				filter: __( 'Select a dispute status', 'poocommerce-payments' ),
			},
			rules: [
				{
					value: 'is',
					/* translators: Sentence fragment, logical, "Is" refers to searching for disputes matching a chosen dispute status. */
					label: _x( 'Is', 'dispute status', 'poocommerce-payments' ),
				},
				{
					value: 'is_not',
					/* translators: Sentence fragment, logical, "Is not" refers to searching for disputes that don\'t match a chosen dispute status. */
					label: _x(
						'Is not',
						'dispute status',
						'poocommerce-payments'
					),
				},
			],
			input: {
				component: 'SelectControl',
				options: disputesStatusOptions,
			},
		},
	},
};
/*eslint-enable max-len*/
