/**
 * External dependencies
 */

/**
 * Internal dependencies
 */

declare module '@poocommerce/explat' {
	interface ExperimentProps {
		name: string;
		defaultExperience: JSX.Element;
		treatmentExperience?: JSX.Element;
		loadingExperience?: JSX.Element;
	}

	const Experiment: ( props: ExperimentProps ) => JSX.Element;
}

declare module '@automattic/interpolate-components' {
	interface InterpolateComponentsParams {
		mixedString: string;
		components: Record< string, React.ReactNode >;
	}

	const interpolateComponents: (
		props: InterpolateComponentsParams
	) => JSX.Element;

	export = interpolateComponents;
}
declare module '@poocommerce/components' {
	import type { Query } from '@poocommerce/navigation';

	interface ReportFiltersProps {
		advancedFilters?: Record< string, unknown >;
		filters?: Array< any >;
		path?: string;
		query?: Query;
		showDatePicker: boolean;
		onAdvancedFilterAction?: ( args: string ) => void;
		// some properties are omitted, as we are not currently using them
	}

	const ReportFilters: ( props: ReportFiltersProps ) => JSX.Element;

	interface SearchProps {
		allowFreeTextSearch?: boolean;
		inlineTags?: boolean;
		key?: string;
		onChange?: ( args: any ) => void;
		placeholder?: string;
		selected?: { key: number | string; label: string }[];
		showClearButton?: boolean;
		type:
			| 'categories'
			| 'countries'
			| 'coupons'
			| 'customers'
			| 'downloadIps'
			| 'emails'
			| 'orders'
			| 'products'
			| 'taxes'
			| 'usernames'
			| 'variations'
			| 'custom';
		autocompleter: unknown;
	}
	const Search: ( props: SearchProps ) => JSX.Element;

	interface TableCardColumn {
		key: string;
		label: string;
		screenReaderLabel?: string;
		required?: boolean;
		isNumeric?: boolean;
		isLeftAligned?: boolean;
		defaultOrder?: 'desc' | 'asc';
		isSortable?: boolean;
		defaultSort?: boolean;
		visible?: boolean;
	}

	interface TableCardBodyColumn {
		value?: string | number | boolean;
		display?: React.ReactNode;
	}

	interface TableCardProps {
		className?: string;
		title?: string;
		isLoading?: boolean;
		rowsPerPage: number;
		totalRows?: number;
		headers?: TableCardColumn[];
		rows?: TableCardBodyColumn[][];
		summary?: { label: string; value: string | number | boolean }[];
		query?: Query;
		onQueryChange?: unknown;
		onColumnsChange?: ( showCols: Array< string >, key?: string ) => void;
		actions?: React.ReactNode[];
		showMenu?: boolean;
	}
	const TableCard: ( props: TableCardProps ) => JSX.Element;
}

declare module '@poocommerce/navigation' {
	import type { BrowserHistory, Location } from 'history';
	/**
	 * Extension of history.BrowserHistory but also adds { pathname: string } to the location object.
	 */
	interface WooBrowserHistory extends BrowserHistory {
		location: Location & {
			pathname: string;
		};
	}

	// TODO: replace the `unknown` types with actual types.
	interface Query {
		path?: unknown;
		page?: unknown;
		paged?: string;
		per_page?: string;
		orderby?: string;
		order?: unknown;
		match?: unknown;
		date_before?: unknown;
		date_after?: unknown;
		date_between?: string[];
		type_is?: unknown;
		type_is_not?: unknown;
		type_is_in?: unknown;
		source_device_is?: unknown;
		source_device_is_not?: unknown;
		channel_is?: string;
		channel_is_not?: string;
		customer_country_is?: string;
		customer_country_is_not?: string;
		risk_level_is?: string;
		risk_level_is_not?: string;
		customer_currency_is?: unknown;
		customer_currency_is_not?: unknown;
		source_is?: string;
		source_is_not?: string;
		store_currency_is?: string;
		loan_id_is?: string;
		search?: string[];
		status_is?: string;
		status_is_not?: string;
		document_id?: string;
		document_type?: string;
		filter?: string;
		tab?: string;
	}

	const onQueryChange: unknown;
	const getQuery: () => Query;
	const updateQueryString: (
		query: Query,
		path?: string,
		currentQuery?: Query
	) => void;
	const getHistory: () => WooBrowserHistory;
}

declare module '@poocommerce/csv-export' {
	import type { TableCardColumn } from '@poocommerce/components';

	const downloadCSVFile: ( fileName: string, content: string ) => void;
	const generateCSVDataFromTable: (
		headers: TableCardColumn[],
		rows: {
			value?: string | number | boolean;
			display?: React.ReactNode;
		}[][]
	) => string;
	const generateCSVFileName: (
		name: string,
		params: Record< string, any >
	) => string;
}
