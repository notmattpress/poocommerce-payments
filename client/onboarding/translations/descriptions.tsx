/** @format */

/* eslint-disable max-len */
/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

interface DescriptionKeyMap {
	[ key: string ]: {
		[ key: string ]: string;
	};
}

const businessTypeDescriptionStrings: DescriptionKeyMap = {
	generic: {
		individual: __(
			'Select if you run your own business as an individual and are self-employed',
			'poocommerce-payments'
		),
		company: __(
			'Select if you filed documentation to register your business with a government agency',
			'poocommerce-payments'
		),
		non_profit: __(
			'Select if you run a non-business entity',
			'poocommerce-payments'
		),
		government_entity: __(
			'Select if your business is classed as a government entity',
			'poocommerce-payments'
		),
	},
	US: {
		individual: __(
			'Select if you run your own business as an individual and are self-employed',
			'poocommerce-payments'
		),
		company: __(
			'Select if you filed documentation to register your business with a government agency',
			'poocommerce-payments'
		),
		non_profit: __(
			'Select if you have been granted tax-exempt status by the Internal Revenue Service (IRS)',
			'poocommerce-payments'
		),
		government_entity: __(
			'Select if your business is classed as a government entity',
			'poocommerce-payments'
		),
	},
};

export default businessTypeDescriptionStrings;
