/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Tax description mapping for localization.
 * Keys are the tax descriptions from the API response.
 * Values are the translatable strings.
 *
 * @see Transaction_Fee_Tax_Service::format_tax_name_from_fee_detail()
 * for the server-side implementation of the tax descriptions.
 */
const taxDescriptions: Record< string, string > = {
	// European Union VAT
	'AT VAT': __( 'AT VAT', 'poocommerce-payments' ), // Austria
	'BE VAT': __( 'BE VAT', 'poocommerce-payments' ), // Belgium
	'BG VAT': __( 'BG VAT', 'poocommerce-payments' ), // Bulgaria
	'CY VAT': __( 'CY VAT', 'poocommerce-payments' ), // Cyprus
	'CZ VAT': __( 'CZ VAT', 'poocommerce-payments' ), // Czech Republic
	'DE VAT': __( 'DE VAT', 'poocommerce-payments' ), // Germany
	'DK VAT': __( 'DK VAT', 'poocommerce-payments' ), // Denmark
	'EE VAT': __( 'EE VAT', 'poocommerce-payments' ), // Estonia
	'ES VAT': __( 'ES VAT', 'poocommerce-payments' ), // Spain
	'FI VAT': __( 'FI VAT', 'poocommerce-payments' ), // Finland
	'FR VAT': __( 'FR VAT', 'poocommerce-payments' ), // France
	'GB VAT': __( 'UK VAT', 'poocommerce-payments' ), // United Kingdom
	'GR VAT': __( 'GR VAT', 'poocommerce-payments' ), // Greece
	'HR VAT': __( 'HR VAT', 'poocommerce-payments' ), // Croatia
	'HU VAT': __( 'HU VAT', 'poocommerce-payments' ), // Hungary
	'IE VAT': __( 'IE VAT', 'poocommerce-payments' ), // Ireland
	'IT VAT': __( 'IT VAT', 'poocommerce-payments' ), // Italy
	'LT VAT': __( 'LT VAT', 'poocommerce-payments' ), // Lithuania
	'LU VAT': __( 'LU VAT', 'poocommerce-payments' ), // Luxembourg
	'LV VAT': __( 'LV VAT', 'poocommerce-payments' ), // Latvia
	'MT VAT': __( 'MT VAT', 'poocommerce-payments' ), // Malta
	'NO VAT': __( 'NO VAT', 'poocommerce-payments' ), // Norway
	'NL VAT': __( 'NL VAT', 'poocommerce-payments' ), // Netherlands
	'PL VAT': __( 'PL VAT', 'poocommerce-payments' ), // Poland
	'PT VAT': __( 'PT VAT', 'poocommerce-payments' ), // Portugal
	'RO VAT': __( 'RO VAT', 'poocommerce-payments' ), // Romania
	'SE VAT': __( 'SE VAT', 'poocommerce-payments' ), // Sweden
	'SI VAT': __( 'SI VAT', 'poocommerce-payments' ), // Slovenia
	'SK VAT': __( 'SK VAT', 'poocommerce-payments' ), // Slovakia

	// GST Countries
	'AU GST': __( 'AU GST', 'poocommerce-payments' ), // Australia
	'NZ GST': __( 'NZ GST', 'poocommerce-payments' ), // New Zealand
	'SG GST': __( 'SG GST', 'poocommerce-payments' ), // Singapore

	// Other Tax Systems
	'CH VAT': __( 'CH VAT', 'poocommerce-payments' ), // Switzerland
	'JP JCT': __( 'JP JCT', 'poocommerce-payments' ), // Japan Consumption Tax

	// Fallback for unknown tax descriptions
	default: __( 'Tax', 'poocommerce-payments' ),
};

/**
 * Get the localized tax description.
 *
 * @param {string} taxDescription - The tax description from the API
 * @return {string} The localized tax description
 */
export const getLocalizedTaxDescription = (
	taxDescription: string
): string => {
	return taxDescription in taxDescriptions
		? taxDescriptions[ taxDescription ]
		: taxDescriptions.default;
};
