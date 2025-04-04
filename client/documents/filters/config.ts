/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { getSetting } from '@poocommerce/settings';

/**
 * Internal dependencies
 */
import { displayType } from 'documents/strings';

interface DocumentsFilterEntryType {
	label: string;
	value: string;
}

export interface DocumentsFilterType {
	label: string;
	param: string;
	staticParams: string[];
	showFilters: () => boolean;
	filters: DocumentsFilterEntryType[];
	defaultValue?: string;
}

const documentTypesOptions = Object.entries( displayType )
	.map( ( [ type, label ] ) => {
		return { label, value: type };
	} )
	.filter( function ( el ) {
		return el != null;
	} );

export const filters: [ DocumentsFilterType ] = [
	{
		label: __( 'Show', 'poocommerce-payments' ),
		param: 'filter',
		staticParams: [ 'paged', 'per_page', 'orderby', 'order' ],
		showFilters: () => true,
		filters: [
			{
				label: __( 'All documents', 'poocommerce-payments' ),
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
	/** translators: A sentence describing filters for Documents. */
	title:
		wooCommerceVersion < 7.8
			? __(
					'Documents match {{select /}} filters',
					'poocommerce-payments'
			  )
			: __(
					'Documents match <select /> filters',
					'poocommerce-payments'
			  ),
	filters: {
		date: {
			labels: {
				add: __( 'Date', 'poocommerce-payments' ),
				remove: __(
					'Remove document date filter',
					'poocommerce-payments'
				),
				rule: __(
					'Select a document date filter match',
					'poocommerce-payments'
				),
				/* translators: A sentence describing a Document date filter. */
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
				filter: __( 'Select a document date', 'poocommerce-payments' ),
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
		type: {
			labels: {
				add: __( 'Type', 'poocommerce-payments' ),
				remove: __(
					'Remove document type filter',
					'poocommerce-payments'
				),
				rule: __(
					'Select a document type filter match',
					'poocommerce-payments'
				),
				/* translators: A sentence describing a Document type filter. */
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
				filter: __( 'Select a document type', 'poocommerce-payments' ),
			},
			rules: [
				{
					value: 'is',
					/* translators: Sentence fragment, logical, "Is" refers to searching for documents matching a chosen document type. */
					label: _x( 'Is', 'document type', 'poocommerce-payments' ),
				},
				{
					value: 'is_not',
					/* translators: Sentence fragment, logical, "Is not" refers to searching for documents that do not match a chosen document type. */
					label: _x(
						'Is not',
						'document type',
						'poocommerce-payments'
					),
				},
			],
			input: {
				component: 'SelectControl',
				options: documentTypesOptions,
			},
		},
	},
};
/*eslint-enable max-len*/
