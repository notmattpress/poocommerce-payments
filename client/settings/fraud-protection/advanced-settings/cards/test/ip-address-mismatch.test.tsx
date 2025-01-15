/**
 * External dependencies
 */
import React from 'react';
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import FraudPreventionSettingsContext from '../../context';
import IPAddressMismatchRuleCard from '../ip-address-mismatch';

declare const global: {
	wcSettings: {
		admin: {
			preloadSettings: {
				general: {
					poocommerce_allowed_countries: string;
					poocommerce_all_except_countries: string[];
					poocommerce_specific_allowed_countries: string[];
				};
			};
		};
	};

	wcpaySettings: {
		isFRTReviewFeatureActive: boolean;
	};
};

describe( 'International billing address card', () => {
	const settings = {
		ip_address_mismatch: {
			enabled: false,
			block: false,
		},
	};
	const setSettings = jest.fn();
	const contextValue = {
		protectionSettingsUI: settings,
		setProtectionSettingsUI: setSettings,
		setIsDirty: jest.fn(),
	};
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
	};
	global.wcpaySettings = {
		isFRTReviewFeatureActive: false,
	};
	test( 'renders correctly', () => {
		const { container } = render(
			<FraudPreventionSettingsContext.Provider value={ contextValue }>
				<IPAddressMismatchRuleCard />
			</FraudPreventionSettingsContext.Provider>
		);
		expect( container ).toMatchSnapshot();
	} );
	test( 'renders correctly when enabled', () => {
		settings.ip_address_mismatch.enabled = true;
		const { container } = render(
			<FraudPreventionSettingsContext.Provider value={ contextValue }>
				<IPAddressMismatchRuleCard />
			</FraudPreventionSettingsContext.Provider>
		);
		expect( container ).toMatchSnapshot();
	} );
	test( 'renders correctly when enabled and checked', () => {
		settings.ip_address_mismatch.enabled = true;
		settings.ip_address_mismatch.block = true;
		const { container } = render(
			<FraudPreventionSettingsContext.Provider value={ contextValue }>
				<IPAddressMismatchRuleCard />
			</FraudPreventionSettingsContext.Provider>
		);
		expect( container ).toMatchSnapshot();
	} );
	test( 'renders like disabled when checked, but not enabled', () => {
		settings.ip_address_mismatch.enabled = false;
		settings.ip_address_mismatch.block = true;
		const { container } = render(
			<FraudPreventionSettingsContext.Provider value={ contextValue }>
				<IPAddressMismatchRuleCard />
			</FraudPreventionSettingsContext.Provider>
		);
		expect( container ).toMatchSnapshot();
	} );
} );
