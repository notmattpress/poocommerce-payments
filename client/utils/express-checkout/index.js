/* global wcpayExpressCheckoutParams */

/**
 * Retrieves express checkout config from global variable.
 *
 * @param {string} key The object property key.
 * @return {mixed} Value of the object prop or null.
 */
export const getExpressCheckoutConfig = ( key ) => {
	if (
		typeof wcpayExpressCheckoutParams === 'object' &&
		wcpayExpressCheckoutParams.hasOwnProperty( key )
	) {
		return wcpayExpressCheckoutParams[ key ];
	}
	return null;
};

export const getDefaultBorderRadius = () => {
	// If wcpaySettings isn't loaded on the page where this is called we can
	// safely return the default value of 4.
	if ( typeof wcpaySettings === 'undefined' ) {
		return 4;
	}

	return parseInt(
		window?.wcpaySettings?.defaultExpressCheckoutBorderRadius || 4,
		10
	);
};

/**
 * Construct WC AJAX endpoint URL.
 *
 * @param {string} ajaxURL AJAX URL.
 * @param {string} endpoint Request endpoint URL.
 * @param {string} prefix Optional prefix for endpoint action.
 * @return {string} URL with interpolated ednpoint.
 */
export const buildAjaxURL = ( ajaxURL, endpoint, prefix = 'wcpay_' ) =>
	ajaxURL.toString().replace( '%%endpoint%%', prefix + endpoint );
