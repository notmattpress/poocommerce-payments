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
