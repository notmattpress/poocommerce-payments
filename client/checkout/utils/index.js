/**
 * Normalizes the amount to the accuracy of the minor unit.
 *
 * @param {integer} amount The amount to normalize
 * @param {integer} minorUnit The number of decimal places amount currently represents
 * @param {integer} accuracy The number of decimal places to normalize to
 * @return {integer} The normalized amount
 */
export const normalizeCurrencyToMinorUnit = (
	amount,
	minorUnit = 2,
	accuracy = 2
) => {
	return parseInt( amount * Math.pow( 10, accuracy - minorUnit ), 10 );
};

export const getAppearanceType = () => {
	if ( document.querySelector( '.wp-block-poocommerce-checkout' ) ) {
		return 'blocks_checkout';
	}

	if ( document.querySelector( '.poocommerce-billing-fields' ) ) {
		return 'woopay_shortcode_checkout';
	}

	if ( document.querySelector( '.wp-block-poocommerce-cart' ) ) {
		return 'bnpl_cart_block';
	}

	if ( document.querySelector( '.poocommerce-cart-form' ) ) {
		return 'bnpl_classic_cart';
	}

	if ( document.querySelector( '.single-product' ) ) {
		return 'bnpl_product_page';
	}
};
