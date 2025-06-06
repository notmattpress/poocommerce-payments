/**
 * Internal dependencies
 */
import { getConfig } from 'wcpay/utils/checkout';
import request from 'wcpay/checkout/utils/request';
import { buildAjaxURL } from 'wcpay/utils/express-checkout';
import UserConnect from 'wcpay/checkout/woopay/connect/user-connect';
import SessionConnect from 'wcpay/checkout/woopay/connect/session-connect';
import { setPostMessageTimeout } from 'wcpay/checkout/woopay/connect/connect-utils';

/**
 * The WooPayDirectCheckout class is responsible for injecting the WooPayConnectIframe into the
 * page and for handling the communication between the WooPayConnectIframe and the page.
 */
class WooPayDirectCheckout {
	static userConnect;
	static sessionConnect;
	static encryptedSessionDataPromise;
	static redirectElements = {
		CLASSIC_CART_PROCEED_BUTTON: '.wc-proceed-to-checkout .checkout-button',
		BLOCKS_CART_PROCEED_BUTTON:
			'.wp-block-poocommerce-proceed-to-checkout-block',
		BLOCKS_MINI_CART_PROCEED_BUTTON:
			'a.wp-block-poocommerce-mini-cart-checkout-button-block',
		BLOCKS_FOOTER_MINI_CART_PROCEED_BUTTON:
			'a.wc-block-mini-cart__footer-checkout',
		CLASSIC_MINI_CART_PROCEED_BUTTON:
			'.widget_shopping_cart a.button.checkout',
	};

	/**
	 * Initializes the WooPay direct checkout feature.
	 */
	static init() {
		this.getSessionConnect();
	}

	/**
	 * Gets the user connect instance.
	 *
	 * @return {*} The instance of a WooPay user connect.
	 */
	static getUserConnect() {
		if ( ! this.userConnect ) {
			this.userConnect = new UserConnect();
		}

		return this.userConnect;
	}

	/**
	 * Gets the session connect.
	 *
	 * @return {*} The instance of a WooPay session connect.
	 */
	static getSessionConnect() {
		if ( ! this.sessionConnect ) {
			this.sessionConnect = new SessionConnect();
		}

		return this.sessionConnect;
	}

	/**
	 * Teardown WooPayDirectCheckout.
	 */
	static teardown() {
		this.sessionConnect?.detachMessageListener();
		this.userConnect?.detachMessageListener();

		this.sessionConnect = null;
		this.userConnect = null;
	}

	/**
	 * Checks if WooPay is enabled.
	 *
	 * @return {boolean} True if WooPay is enabled.
	 */
	static isWooPayDirectCheckoutEnabled() {
		return getConfig( 'isWooPayDirectCheckoutEnabled' );
	}

	/**
	 * Checks if WooPay is reachable.
	 *
	 * @return {Promise<bool>} Resolves to true if WooPay is reachable.
	 */
	static async isWooPayReachable() {
		return this.getSessionConnect().isWooPayReachable();
	}

	/**
	 * Checks if the user is logged in.
	 *
	 * @return {Promise<bool>} Resolves to true if the user is logged in.
	 */
	static async isUserLoggedIn() {
		return this.getUserConnect().isUserLoggedIn();
	}

	/**
	 * Retrieves encrypted data from WooPay.
	 *
	 * @return {Promise<Object>} Resolves to an object with encrypted data.
	 */
	static async getEncryptedData() {
		return this.getUserConnect().getEncryptedData();
	}

	/**
	 * Checks if third-party cookies are enabled.
	 *
	 * @return {Promise<*>} Resolves to true if third-party cookies are enabled.
	 */
	static async isWooPayThirdPartyCookiesEnabled() {
		return this.getSessionConnect().isWooPayThirdPartyCookiesEnabled();
	}

	/**
	 * Sets the length of time to wait for when a message is sent to WooPay through the iframe.
	 */
	static async initPostMessageTimeout() {
		const postMessageTimeout = await this.getSessionConnect().getPostMessageTimeout();
		if ( postMessageTimeout ) {
			setPostMessageTimeout( postMessageTimeout );
		}
	}

	/**
	 * Resolves the redirect URL to the WooPay checkout page or throws an error if the request fails.
	 * This function should only be called when we have determined the shopper is already logged in to WooPay.
	 *
	 * @return {string} The redirect URL.
	 * @throws {Error} If the session data could not be sent to WooPay.
	 */
	static async getWooPayCheckoutUrl() {
		// We're intentionally adding a try-catch block to catch any errors
		// that might occur other than the known validation errors.
		try {
			let encryptedSessionData;
			if ( this.isEncryptedSessionDataPrefetched() ) {
				encryptedSessionData = await this.encryptedSessionDataPromise;
			} else {
				encryptedSessionData = await this.getEncryptedSessionData();
			}
			if ( ! this.isValidEncryptedSessionData( encryptedSessionData ) ) {
				throw new Error(
					'Could not retrieve encrypted session data from store.'
				);
			}

			const woopaySessionData = await this.getSessionConnect().sendRedirectSessionDataToWooPay(
				encryptedSessionData
			);
			if ( ! woopaySessionData?.redirect_url ) {
				throw new Error( 'Could not retrieve WooPay checkout URL.' );
			}

			const { redirect_url: redirectUrl } = woopaySessionData;
			if (
				! this.validateRedirectUrl(
					redirectUrl,
					'platform_checkout_key'
				)
			) {
				throw new Error( 'Invalid WooPay session URL: ' + redirectUrl );
			}

			return woopaySessionData.redirect_url;
		} catch ( error ) {
			throw new Error( error.message );
		}
	}

	/**
	 * Checks if the encrypted session object is valid.
	 *
	 * @param {Object} encryptedSessionData The encrypted session data.
	 * @return {boolean} True if the session is valid.
	 */
	static isValidEncryptedSessionData( encryptedSessionData ) {
		return (
			encryptedSessionData &&
			encryptedSessionData?.blog_id &&
			encryptedSessionData?.data?.session &&
			encryptedSessionData?.data?.iv &&
			encryptedSessionData?.data?.hash
		);
	}

	/**
	 * Gets the necessary merchant data to create session from WooPay request or throws an error if the request fails.
	 * This function should only be called if we still need to determine if the shopper is logged into WooPay or not.
	 *
	 * @return {string} WooPay redirect URL with parameters.
	 */
	static async getWooPayMinimumSessionUrl() {
		const redirectData = await this.getWooPayMinimumSesssionDataFromMerchant();
		if ( redirectData?.success === false ) {
			throw new Error(
				'Could not retrieve redirect data from merchant.'
			);
		}

		if ( ! this.isValidEncryptedSessionData( redirectData ) ) {
			throw new Error( 'Invalid encrypted session data.' );
		}

		const {
			blog_id, // eslint-disable-line camelcase
			data: { session, iv, hash },
		} = redirectData;
		const redirectParams = new URLSearchParams( {
			checkout_redirect: 1,
			blog_id,
			session,
			iv,
			hash,
		} );

		const redirectUrl =
			getConfig( 'woopayHost' ) + '/woopay/?' + redirectParams.toString();

		return redirectUrl;
	}

	/**
	 * Gets the checkout redirect elements.
	 *
	 * @return {*[]} The checkout redirect elements.
	 */
	static getCheckoutButtonElements() {
		const elements = [];
		const addElementBySelector = ( selector ) => {
			const element = document.querySelector( selector );
			if ( element ) {
				elements.push( element );
			}
		};

		// For every new element added here, ensure the selector is added to the redirectElements object.
		addElementBySelector(
			this.redirectElements.CLASSIC_CART_PROCEED_BUTTON
		);
		addElementBySelector(
			this.redirectElements.BLOCKS_CART_PROCEED_BUTTON
		);
		addElementBySelector(
			this.redirectElements.CLASSIC_MINI_CART_PROCEED_BUTTON
		);

		return elements;
	}

	/**
	 * Gets the classic 'Proceed to Checkout' button.
	 *
	 * @return {Element} The classic 'Proceed to Checkout' button.
	 */
	static getClassicProceedToCheckoutButton() {
		return document.querySelector(
			this.redirectElements.CLASSIC_CART_PROCEED_BUTTON
		);
	}

	/**
	 * Gets the mini cart 'Go to checkout' button.
	 *
	 * @return {Element} The mini cart 'Go to checkout' button.
	 */
	static getMiniCartProceedToCheckoutButton() {
		return document.querySelector(
			this.redirectElements.BLOCKS_MINI_CART_PROCEED_BUTTON
		);
	}

	/**
	 * Gets the footer mini cart 'Proceed to checkout' button.
	 *
	 * @return {Element} The footer mini cart 'Proceed to checkout' button.
	 */
	static getFooterMiniCartProceedToCheckoutButton() {
		return document.querySelector(
			this.redirectElements.BLOCKS_FOOTER_MINI_CART_PROCEED_BUTTON
		);
	}

	/**
	 * Adds a click-event listener to the given elements that redirects to the WooPay checkout page.
	 *
	 * @param {*[]} elements The elements to add a click-event listener to.
	 * @param {boolean} userIsLoggedIn True if we determined the user is already logged in, false otherwise.
	 */
	static addRedirectToWooPayEventListener(
		elements,
		userIsLoggedIn = false
	) {
		/**
		 * Adds a loading spinner to the given element.
		 *
		 * @param {Element} element The element to add the loading spinner to.
		 */
		const addLoadingSpinner = ( element ) => {
			const elementCss = window.getComputedStyle( element, null );
			const originalColor = elementCss.getPropertyValue( 'color' );

			// Create a spinner to show when the user clicks the button.
			const spinner = document.createElement( 'span' );
			spinner.classList.add( 'wc-block-components-spinner' );
			spinner.style.position = 'absolute';
			spinner.style.top = '0';
			spinner.style.left = '0';
			spinner.style.width = '100%';
			spinner.style.height = '100%';
			spinner.style.color = originalColor;
			spinner.style.fontSize = 'unset';
			spinner.style.display = 'inline';
			spinner.style.lineHeight = '0';
			spinner.style.margin = '0';
			spinner.style.border = '0';
			spinner.style.padding = '0';
			// Hide the existing content of the button.
			element.style.color = 'rgba( 0, 0, 0, 0 )';
			element.style.position = 'relative';
			// Add the spinner to the button.
			element.appendChild( spinner );
		};

		/**
		 * Checks if a loading spinner should be added to the given element.
		 *
		 * @param {Element} element The element to check.
		 *
		 * @return {boolean} True if a loading spinner should be added.
		 */
		const shouldAddLoadingSpinner = ( element ) => {
			// If the button is in the mini cart, add a spinner.
			if (
				element.classList.contains(
					'wp-block-poocommerce-mini-cart-checkout-button-block'
				) ||
				element.classList.contains(
					'wc-block-mini-cart__footer-checkout'
				)
			) {
				return true;
			}

			// If the button is in the classic cart, add a spinner.
			const isCheckoutButton = element.classList.contains(
				'checkout-button'
			);
			const isParentProceedToCheckout = element.parentElement?.classList?.contains(
				'wc-proceed-to-checkout'
			);

			return isCheckoutButton && isParentProceedToCheckout;
		};

		elements.forEach( ( element ) => {
			const elementState = {
				is_loading: false,
			};

			element.addEventListener( 'click', async ( event ) => {
				if ( elementState.is_loading ) {
					event.preventDefault();
					return;
				}

				elementState.is_loading = true;

				if ( shouldAddLoadingSpinner( element ) ) {
					addLoadingSpinner( element );
				}

				// Store href before the async call to not lose the reference.
				let currTargetHref;
				const isAElement = element.tagName.toLowerCase() === 'a';
				if ( isAElement ) {
					currTargetHref = element.href;
				} else {
					currTargetHref = element.querySelector( 'a' )?.href;
				}

				// If there's no link where to redirect the user, do not break the expected behavior.
				if ( ! currTargetHref ) {
					this.teardown();
					return;
				}

				event.preventDefault();

				try {
					let woopayRedirectUrl = '';
					if ( userIsLoggedIn ) {
						woopayRedirectUrl = await this.getWooPayCheckoutUrl();
					} else {
						// Ensure WooPay is reachable before redirecting.
						if ( ! ( await this.isWooPayReachable() ) ) {
							throw new Error(
								'WooPay is currently not available.'
							);
						}

						woopayRedirectUrl = await this.getWooPayMinimumSessionUrl();
					}

					this.teardown();
					// TODO: Add telemetry as to _how long_ it took to get to this step.
					window.location.href = woopayRedirectUrl;
				} catch ( error ) {
					// TODO: Add telemetry as to _why_ we've short-circuited the WooPay checkout flow.
					console.warn( error ); // eslint-disable-line no-console

					this.teardown();
					window.location.href = currTargetHref;
				}
			} );
		} );
	}

	/**
	 * Gets the WooPay session.
	 *
	 * @return {Promise<Promise<*>|*>} Resolves to the WooPay session response.
	 */
	static async getEncryptedSessionData() {
		const encryptedData = await this.getEncryptedData();
		return request(
			buildAjaxURL( getConfig( 'wcAjaxUrl' ), 'get_woopay_session' ),
			{
				_ajax_nonce: getConfig( 'woopaySessionNonce' ),
				...( encryptedData && { encrypted_data: encryptedData } ),
			}
		);
	}

	/**
	 * Gets the WooPay redirect data.
	 *
	 * @return {Promise<Promise<*>|*>} Resolves to the WooPay redirect response.
	 */
	static async getWooPayMinimumSesssionDataFromMerchant() {
		// This should always be defined, but fallback to a request in case of the unexpected.
		if ( getConfig( 'woopayMinimumSessionData' ) ) {
			return getConfig( 'woopayMinimumSessionData' );
		}

		return request(
			buildAjaxURL(
				getConfig( 'wcAjaxUrl' ),
				'get_woopay_minimum_session_data'
			),
			{
				_ajax_nonce: getConfig( 'woopaySessionNonce' ),
			}
		);
	}

	/**
	 * Validates a WooPay redirect URL.
	 *
	 * @param {string} redirectUrl The URL to validate.
	 * @param {string} requiredParam The URL parameter that is required in the URL.
	 *
	 * @return {boolean} True if URL is valid, false otherwise.
	 */
	static validateRedirectUrl( redirectUrl, requiredParam ) {
		try {
			const parsedUrl = new URL( redirectUrl );
			if (
				parsedUrl.origin !== getConfig( 'woopayHost' ) ||
				! parsedUrl.searchParams.has( requiredParam )
			) {
				return false;
			}

			return true;
		} catch ( error ) {
			return false;
		}
	}

	/**
	 * Prefetches the encrypted session data if not on the product page.
	 */
	static maybePrefetchEncryptedSessionData() {
		const isProductPage =
			window?.wcpayWooPayDirectCheckout?.params?.is_product_page;
		if ( typeof isProductPage === 'undefined' || isProductPage ) {
			return;
		}

		this.encryptedSessionDataPromise = new Promise( ( resolve ) => {
			resolve( this.getEncryptedSessionData() );
		} );
	}

	/**
	 * Sets the encrypted session data as not prefetched.
	 */
	static setEncryptedSessionDataAsNotPrefetched() {
		this.encryptedSessionDataPromise = null;
	}

	/**
	 * Checks if the encrypted session data has been prefetched.
	 *
	 * @return {boolean} True if the encrypted session data has been prefetched.
	 */
	static isEncryptedSessionDataPrefetched() {
		return typeof this.encryptedSessionDataPromise?.then === 'function';
	}
}

export default WooPayDirectCheckout;
