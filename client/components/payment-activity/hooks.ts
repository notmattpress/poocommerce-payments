/**
 * External dependencies
 */
import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import moment from 'moment';

interface DateRange {
	/** The name of the date range preset. e.g. last_7_days */
	preset_name: string;
	/** The date range start datetime used to calculate transaction data, e.g. 2024-04-29T16:19:29 */
	date_start: string;
	/** The date range end datetime used to calculate transaction data, e.g. 2024-04-29T16:19:29 */
	date_end: string;
}

/**
 * Hook to manage the selected date range and date range presets for the payment activity widget.
 */
export const usePaymentActivityDateRangePresets = (): {
	selectedDateRange: DateRange;
	setSelectedDateRange: ( dateRange: DateRange ) => void;
	dateRangePresets: {
		[ key: string ]: {
			start: moment.Moment;
			end: moment.Moment;
			displayKey: string;
		};
	};
} => {
	const now = moment();
	const yesterdayEndOfDay = moment()
		.clone()
		.subtract( 1, 'd' )
		.set( { hour: 23, minute: 59, second: 59, millisecond: 0 } );
	const todayEndOfDay = moment()
		.clone()
		.set( { hour: 23, minute: 59, second: 59, millisecond: 0 } );

	const dateRangePresets: {
		[ key: string ]: {
			start: moment.Moment;
			end: moment.Moment;
			displayKey: string;
		};
	} = {
		today: {
			start: now
				.clone()
				.set( { hour: 0, minute: 0, second: 0, millisecond: 0 } ),
			end: todayEndOfDay,
			displayKey: __( 'Today', 'poocommerce-payments' ),
		},
		last_7_days: {
			start: now
				.clone()
				.subtract( 7, 'days' )
				.set( { hour: 0, minute: 0, second: 0, millisecond: 0 } ),
			end: yesterdayEndOfDay,
			displayKey: __( 'Last 7 days', 'poocommerce-payments' ),
		},
		last_4_weeks: {
			start: now
				.clone()
				.subtract( 4, 'weeks' )
				.set( { hour: 0, minute: 0, second: 0, millisecond: 0 } ),
			end: yesterdayEndOfDay,
			displayKey: __( 'Last 4 weeks', 'poocommerce-payments' ),
		},
		last_3_months: {
			start: now
				.clone()
				.subtract( 3, 'months' )
				.set( { hour: 0, minute: 0, second: 0, millisecond: 0 } ),
			end: yesterdayEndOfDay,
			displayKey: __( 'Last 3 months', 'poocommerce-payments' ),
		},
		last_12_months: {
			start: now
				.clone()
				.subtract( 12, 'months' )
				.set( { hour: 0, minute: 0, second: 0, millisecond: 0 } ),
			end: yesterdayEndOfDay,
			displayKey: __( 'Last 12 months', 'poocommerce-payments' ),
		},
		month_to_date: {
			start: now.clone().startOf( 'month' ),
			end: todayEndOfDay,
			displayKey: __( 'Month to date', 'poocommerce-payments' ),
		},
		quarter_to_date: {
			start: now.clone().startOf( 'quarter' ),
			end: todayEndOfDay,
			displayKey: __( 'Quarter to date', 'poocommerce-payments' ),
		},
		year_to_date: {
			start: now.clone().startOf( 'year' ),
			end: todayEndOfDay,
			displayKey: __( 'Year to date', 'poocommerce-payments' ),
		},
		all_time: {
			start: moment(
				wcpaySettings.accountStatus.created,
				'YYYY-MM-DD\\THH:mm:ss'
			),
			end: todayEndOfDay,
			displayKey: __( 'All time', 'poocommerce-payments' ),
		},
	};

	const defaultPreset =
		sessionStorage.getItem( 'selectedPresetName' ) ?? 'last_7_days';
	const defaultDateRange = {
		preset_name: defaultPreset,
		date_start: dateRangePresets[ defaultPreset ].start.format(
			'YYYY-MM-DD\\THH:mm:ss'
		),
		date_end: dateRangePresets[ defaultPreset ].end.format(
			'YYYY-MM-DD\\THH:mm:ss'
		),
	};

	const [ selectedDateRange, setSelectedDateRange ] = useState( {
		preset_name: defaultDateRange.preset_name,
		date_start: defaultDateRange.date_start,
		date_end: defaultDateRange.date_end,
	} );

	return {
		selectedDateRange,
		setSelectedDateRange,
		dateRangePresets,
	};
};
