/**
 * External dependencies
 */
import {
	Elements,
	PaymentMethodMessagingElement,
} from '@stripe/react-stripe-js';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getAppearance, getFontRulesFromPage } from 'wcpay/checkout/upe-styles';
import { useStripeAsync } from 'wcpay/hooks/use-stripe-async';
import { getUPEConfig } from 'utils/checkout';
import WCPayAPI from '../../checkout/api';
import request from '../../checkout/utils/request';
import { useEffect, useState } from 'react';

// Create an API object, which will be used throughout the checkout.
const api = new WCPayAPI(
	{
		publishableKey: getUPEConfig( 'publishableKey' ),
		accountId: getUPEConfig( 'accountId' ),
		forceNetworkSavedCards: getUPEConfig( 'forceNetworkSavedCards' ),
		locale: getUPEConfig( 'locale' ),
	},
	request
);

const isInEditor = () => {
	const editorStore = select( 'core/editor' );

	return !! editorStore;
};

// BNPL only supports 2 decimal places.
const normalizeAmount = ( amount, decimalPlaces = 2 ) => {
	return amount * Math.pow( 10, 2 - decimalPlaces );
};

const { ExperimentalOrderMeta } = window.wc.blocksCheckout;

const ProductDetail = ( { cart, context } ) => {
	const [ appearance, setAppearance ] = useState(
		getUPEConfig( 'upeBnplCartBlockAppearance' ) || {}
	);

	const [ fontRules ] = useState( getFontRulesFromPage() );

	const stripe = useStripeAsync( api );

	useEffect( () => {
		async function generateUPEAppearance() {
			// Generate UPE input styles.
			let upeAppearance = getAppearance( 'bnpl_cart_block' );
			upeAppearance = await api.saveUPEAppearance(
				upeAppearance,
				'bnpl_cart_block'
			);
			setAppearance( upeAppearance );
		}

		if ( Object.keys( appearance ).length === 0 ) {
			generateUPEAppearance();
		}
	}, [ appearance ] );

	if ( ! stripe ) {
		return null;
	}

	if ( Object.keys( appearance ).length === 0 ) {
		return null;
	}

	if ( context !== 'poocommerce/cart' ) {
		return null;
	}

	const cartTotal = normalizeAmount(
		cart.cartTotals.total_price,
		wcSettings.currency.precision
	);

	if ( ! window.wcpayStripeSiteMessaging ) {
		return null;
	}

	const {
		country,
		paymentMethods,
		currencyCode,
		shouldInitializePMME,
	} = window.wcpayStripeSiteMessaging;

	if ( ! shouldInitializePMME ) {
		return null;
	}

	const amount = parseInt( cartTotal, 10 ) || 0;

	const options = {
		amount: amount,
		currency: currencyCode || 'USD',
		paymentMethodTypes: paymentMethods || [],
		countryCode: country, // Customer's country or base country of the store.
	};

	return (
		<div className="wc-block-components-bnpl-wrapper">
			<Elements
				stripe={ stripe }
				options={ { appearance, fonts: fontRules } }
			>
				<PaymentMethodMessagingElement options={ options } />
			</Elements>
		</div>
	);
};

export const renderBNPLCartMessaging = () => {
	if ( isInEditor() ) {
		return null;
	}
	return (
		<ExperimentalOrderMeta>
			<ProductDetail />
		</ExperimentalOrderMeta>
	);
};
