/**
 * External dependencies
 */
import { set, toPairs } from 'lodash';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { NAMESPACE } from 'data/constants';
import { ListItem } from 'components/grouped-select-control';
import businessTypeDescriptionStrings from './translations/descriptions';
import { Country, FinalizeOnboardingResponse } from './types';

export const fromDotNotation = (
	record: Record< string, unknown >
): Record< string, unknown > =>
	toPairs( record ).reduce( ( result, [ key, value ] ) => {
		return value != null ? set( result, key, value ) : result;
	}, {} );

export const getAvailableCountries = (): Country[] =>
	Object.entries( wcpaySettings?.connect.availableCountries || [] )
		.map( ( [ key, name ] ) => ( { key, name, types: [] } ) )
		.sort( ( a, b ) => a.name.localeCompare( b.name ) );

export const getBusinessTypes = (): Country[] => {
	const data = wcpaySettings?.onboardingFieldsData?.business_types;

	return (
		( data || [] )
			.map( ( country ) => ( {
				...country,
				types: country.types.map( ( type ) => ( {
					...type,
					description: businessTypeDescriptionStrings[ country.key ]
						? businessTypeDescriptionStrings[ country.key ][
								type.key
						  ]
						: businessTypeDescriptionStrings.generic[ type.key ],
				} ) ),
			} ) )
			.sort( ( a, b ) => a.name.localeCompare( b.name ) ) || []
	);
};

/**
 * Make an API request to finalize the onboarding process.
 *
 * @param urlSource The source URL.
 */
export const finalizeOnboarding = async ( urlSource: string ) => {
	return await apiFetch< FinalizeOnboardingResponse >( {
		path: `${ NAMESPACE }/onboarding/kyc/finalize`,
		method: 'POST',
		data: {
			source: urlSource,
			from: 'WCPAY_ONBOARDING_WIZARD',
		},
	} );
};

/**
 * Get the MCC code for the selected industry.
 *
 * @return {string | undefined} The MCC code for the selected industry. Will return undefined if no industry is selected.
 */
export const getMccFromIndustry = (): string | undefined => {
	const industry = wcSettings.admin?.onboarding?.profile?.industry?.[ 0 ];
	if ( ! industry ) {
		return undefined;
	}

	const industryToMcc =
		wcpaySettings?.onboardingFieldsData?.industry_to_mcc || {};

	return industryToMcc[ industry ];
};

export const getMccsFlatList = (): ListItem[] => {
	const data = wcpaySettings?.onboardingFieldsData?.mccs_display_tree;

	// Right now we support only two levels (top-level groups and items in those groups).
	// For safety, we will discard anything else like top-level items or sub-groups.
	const normalizedData = ( data || [] ).filter( ( group ) => {
		if ( ! group?.items ) {
			return false;
		}

		const groupItems =
			group.items?.filter( ( item ) => ! item?.items ) || [];

		return groupItems.length;
	} );

	return normalizedData.reduce( ( acc, group ): ListItem[] => {
		const groupItems =
			group.items?.map(
				( item ): ListItem => {
					return {
						key: item.id,
						name: item.title,
						group: group.id,
						context: item?.keywords
							? item.keywords.join( ' ' )
							: '',
					};
				}
			) || [];

		return [
			...acc,
			{
				key: group.id,
				name: group.title,
				items: groupItems.map( ( item ) => item.key ),
			},
			...groupItems,
		];
	}, [] as ListItem[] );
};
