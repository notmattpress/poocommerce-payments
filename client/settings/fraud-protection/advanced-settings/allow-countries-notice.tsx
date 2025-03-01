/**
 * External dependencies
 */

import React, { useContext, useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import FraudPreventionSettingsContext from './context';
import FraudProtectionRuleCardNotice from './rule-card-notice';
import { getSettingCountries, getSupportedCountriesType } from './utils';
import { decodeEntities } from '@wordpress/html-entities';

const getNoticeText = ( filterType: string, blocking: boolean ) => {
	if ( 'all_except' === filterType ) {
		return blocking
			? __(
					'Orders from the following countries will be blocked by the filter: ',
					'poocommerce-payments'
			  )
			: __(
					'Orders from the following countries will be screened by the filter: ',
					'poocommerce-payments'
			  );
	} else if ( 'specific' === filterType ) {
		return blocking
			? __(
					'Orders from outside of the following countries will be blocked by the filter: ',
					'poocommerce-payments'
			  )
			: __(
					'Orders from outside of the following countries will be screened by the filter: ',
					'poocommerce-payments'
			  );
	}
	return null;
};

interface AllowedCountriesNoticeProps {
	setting: string;
}

const AllowedCountriesNotice: React.FC< AllowedCountriesNoticeProps > = ( {
	setting,
} ) => {
	const { protectionSettingsUI } = useContext(
		FraudPreventionSettingsContext
	);
	const [ isBlocking, setIsBlocking ] = useState(
		protectionSettingsUI[ setting ]?.block ?? false
	);
	useEffect( () => {
		setIsBlocking( protectionSettingsUI[ setting ]?.block ?? false );
	}, [ protectionSettingsUI, setting ] );

	const supportedCountriesType = getSupportedCountriesType();
	const settingCountries = getSettingCountries();

	return (
		<FraudProtectionRuleCardNotice type={ 'info' }>
			{ getNoticeText( supportedCountriesType, isBlocking ) }
			<strong>
				{ decodeEntities(
					settingCountries
						.map(
							( countryCode ) =>
								wcSettings.countries[ countryCode ] ?? false
						)
						.filter( ( element ) => element )
						.join( ', ' )
				) }
			</strong>
		</FraudProtectionRuleCardNotice>
	);
};

export default AllowedCountriesNotice;
