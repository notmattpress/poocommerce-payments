/**
 * External dependencies
 */
import React from 'react';
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import AllowedCountriesNotice from '../allow-countries-notice';
import FraudPreventionSettingsContext from '../context';

const mockContext = {
	protectionSettingsUI: {
		test_key: {
			enabled: false,
			block: false,
		},
	},
	setProtectionSettingsUI: jest.fn(),
	setIsDirty: jest.fn(),
};

describe( 'Allowed countries rule card notice tests', () => {
	beforeAll( () => {
		global.wcSettings = {
			admin: {
				preloadSettings: {
					general: {
						poocommerce_allowed_countries: 'all',
						poocommerce_all_except_countries: [],
						poocommerce_specific_allowed_countries: [],
					},
				},
			},
			countries: {
				CA: 'Canada',
				US: 'United States',
			},
		};
	} );

	test( 'renders correctly when specific countries are allowed, others will be hold', () => {
		global.wcSettings.admin.preloadSettings.general.poocommerce_allowed_countries =
			'specific';
		global.wcSettings.admin.preloadSettings.general.poocommerce_specific_allowed_countries = [
			'CA',
			'US',
		];
		mockContext.protectionSettingsUI.test_key.block = false;

		const container = render(
			<FraudPreventionSettingsContext.Provider value={ mockContext }>
				<AllowedCountriesNotice setting="test_key" />
			</FraudPreventionSettingsContext.Provider>
		);
		expect( container ).toMatchSnapshot();
		expect( container.baseElement ).toHaveTextContent(
			/Orders from outside of the following countries will be screened by the filter: Canada, United States/i
		);
	} );

	test( 'renders correctly when specific countries are allowed, others will be blocked', () => {
		global.wcSettings.admin.preloadSettings.general.poocommerce_allowed_countries =
			'specific';
		global.wcSettings.admin.preloadSettings.general.poocommerce_specific_allowed_countries = [
			'CA',
			'US',
		];
		mockContext.protectionSettingsUI.test_key.block = true;

		const container = render(
			<FraudPreventionSettingsContext.Provider value={ mockContext }>
				<AllowedCountriesNotice setting="test_key" />
			</FraudPreventionSettingsContext.Provider>
		);
		expect( container ).toMatchSnapshot();
		expect( container.baseElement ).toHaveTextContent(
			/Orders from outside of the following countries will be blocked by the filter: Canada, United States/i
		);
	} );

	test( 'renders correctly when countries except some are allowed, others will be hold', () => {
		global.wcSettings.admin.preloadSettings.general.poocommerce_allowed_countries =
			'all_except';
		global.wcSettings.admin.preloadSettings.general.poocommerce_all_except_countries = [
			'CA',
			'US',
		];
		mockContext.protectionSettingsUI.test_key.block = false;

		const container = render(
			<FraudPreventionSettingsContext.Provider value={ mockContext }>
				<AllowedCountriesNotice setting="test_key" />
			</FraudPreventionSettingsContext.Provider>
		);
		expect( container ).toMatchSnapshot();
		expect( container.baseElement ).toHaveTextContent(
			/Orders from the following countries will be screened by the filter: Canada, United States/i
		);
	} );

	test( 'renders correctly when countries except some are allowed, others will be blocked', () => {
		global.wcSettings.admin.preloadSettings.general.poocommerce_allowed_countries =
			'all_except';
		global.wcSettings.admin.preloadSettings.general.poocommerce_all_except_countries = [
			'CA',
			'US',
		];
		mockContext.protectionSettingsUI.test_key.block = true;

		const container = render(
			<FraudPreventionSettingsContext.Provider value={ mockContext }>
				<AllowedCountriesNotice setting="test_key" />
			</FraudPreventionSettingsContext.Provider>
		);
		expect( container ).toMatchSnapshot();
		expect( container.baseElement ).toHaveTextContent(
			/Orders from the following countries will be blocked by the filter: Canada, United States/i
		);
	} );

	test( 'renders html entities correctly', () => {
		global.wcSettings.admin.preloadSettings.general.poocommerce_allowed_countries =
			'specific';
		global.wcSettings.admin.preloadSettings.general.poocommerce_specific_allowed_countries = [
			'ST',
		];
		global.wcSettings.countries.ST =
			'S&atilde;o Tom&eacute; and Pr&iacute;ncipe';
		mockContext.protectionSettingsUI.test_key.block = true;

		const container = render(
			<FraudPreventionSettingsContext.Provider value={ mockContext }>
				<AllowedCountriesNotice setting="test_key" />
			</FraudPreventionSettingsContext.Provider>
		);
		expect( container ).toMatchSnapshot();
		expect( container.baseElement ).toHaveTextContent(
			/São Tomé and Príncipe/i
		);
	} );
} );
