/* global jQuery */

// Show error notice at top of checkout form.
const showErrorCheckout = (
	errorMessage,
	isFirst = false,
	validateFields = true,
	customId = null
) => {
	let messageWrapper = '';
	if ( errorMessage.includes( 'poocommerce-error' ) ) {
		messageWrapper = errorMessage;
	} else {
		messageWrapper =
			'<ul class="poocommerce-error" role="alert"' +
			( customId ? ' id="' + customId + '"' : '' ) +
			'>' +
			errorMessage +
			'</ul>';
	}
	let $container = jQuery( '.poocommerce-notices-wrapper, form.checkout' );

	if ( isFirst ) {
		$container = $container.first();
	} else {
		$container = $container.last();
	}

	if ( ! $container.length ) {
		return;
	}

	// Adapted from PooCommerce core @ ea9aa8c, assets/js/frontend/checkout.js#L514-L529
	jQuery(
		'.poocommerce-NoticeGroup-checkout, .poocommerce-error, .poocommerce-message'
	).remove();
	$container.prepend(
		'<div class="poocommerce-NoticeGroup poocommerce-NoticeGroup-checkout">' +
			messageWrapper +
			'</div>'
	);
	if ( validateFields ) {
		$container
			.find( '.input-text, select, input:checkbox' )
			.trigger( 'validate' )
			.blur();
	}

	let scrollElement = jQuery( '.poocommerce-NoticeGroup-checkout' );
	if ( ! scrollElement.length ) {
		scrollElement = $container;
	}

	jQuery.scroll_to_notices( scrollElement );
	jQuery( document.body ).trigger( 'checkout_error' );
};

export default showErrorCheckout;
