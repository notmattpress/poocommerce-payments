/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import WoopayIcon from './woopay-icon';
import WoopayIconLight from './woopay-icon-light';
import { expressCheckoutIframe } from './express-checkout-iframe';
import useExpressCheckoutProductHandler from './use-express-checkout-product-handler';
import { recordUserEvent } from 'tracks';
import { getConfig } from 'wcpay/utils/checkout';
import { showErrorMessage } from 'wcpay/checkout/woopay/express-button/utils';
import interpolateComponents from '@automattic/interpolate-components';
import {
	appendRedirectionParams,
	deleteSkipWooPayCookie,
	isSupportedThemeEntrypoint,
} from 'wcpay/checkout/woopay/utils';
import WooPayFirstPartyAuth from 'wcpay/checkout/woopay/express-button/woopay-first-party-auth';
import { getAppearance } from 'wcpay/checkout/upe-styles';
import { getAppearanceType } from 'wcpay/checkout/utils';

const BUTTON_WIDTH_THRESHOLD = 140;

const ButtonTypeTextMap = {
	default: __( 'WooPay', 'poocommerce-payments' ),
	buy: __( 'Buy with WooPay', 'poocommerce-payments' ),
	donate: __( 'Donate with WooPay', 'poocommerce-payments' ),
	book: __( 'Book with WooPay', 'poocommerce-payments' ),
};

export const WoopayExpressCheckoutButton = ( {
	listenForCartChanges,
	isPreview = false,
	buttonSettings,
	api,
	isProductPage = false,
	emailSelector = '#email',
	buttonAttributes,
} ) => {
	const buttonWidthTypes = {
		narrow: 'narrow',
		wide: 'wide',
	};
	const onClickCallbackRef = useRef( null );
	const buttonRef = useRef( null );
	const isLoadingRef = useRef( false );
	let {
		height: buttonHeight,
		type: buttonType,
		theme,
		context,
		radius: borderRadius,
	} = buttonSettings;
	const [ isLoading, setIsLoading ] = useState( false );
	const [ buttonWidthType, setButtonWidthType ] = useState(
		buttonWidthTypes.wide
	);
	const buttonSizeMap = new Map();
	buttonSizeMap.set( '40', 'small' );
	buttonSizeMap.set( '48', 'medium' );
	buttonSizeMap.set( '55', 'large' );

	// If we are on the checkout block, we receive button attributes which overwrite the extension specific settings
	if ( typeof buttonAttributes !== 'undefined' ) {
		buttonHeight = buttonAttributes.height || buttonHeight;
		borderRadius = buttonAttributes.borderRadius ?? borderRadius;
	}

	const buttonSize =
		buttonSizeMap.get( buttonHeight?.toString() ) || 'medium';

	const buttonText =
		ButtonTypeTextMap[ buttonType || 'default' ] ??
		ButtonTypeTextMap.default;

	const ThemedWooPayIcon = theme === 'dark' ? WoopayIcon : WoopayIconLight;

	const { addToCart, getProductData } = useExpressCheckoutProductHandler(
		api
	);
	const getProductDataRef = useRef( getProductData );
	const addToCartRef = useRef( addToCart );

	useEffect( () => {
		if ( ! buttonRef.current ) {
			return;
		}

		const buttonWidth = buttonRef.current.getBoundingClientRect().width;
		const isButtonWide = buttonWidth > BUTTON_WIDTH_THRESHOLD;
		setButtonWidthType(
			isButtonWide ? buttonWidthTypes.wide : buttonWidthTypes.narrow
		);
	}, [ buttonWidthTypes.narrow, buttonWidthTypes.wide ] );

	useEffect( () => {
		if ( ! isPreview ) {
			recordUserEvent( 'woopay_button_load', {
				source: context,
			} );
		}
	}, [ isPreview, context ] );

	const canAddProductToCart = useCallback( () => {
		if ( ! isProductPage ) {
			return true;
		}

		const addToCartButton = document.querySelector(
			'.single_add_to_cart_button'
		);

		if (
			addToCartButton &&
			( addToCartButton.disabled ||
				addToCartButton.classList.contains( 'disabled' ) )
		) {
			if (
				addToCartButton.classList.contains(
					'wc-variation-is-unavailable'
				)
			) {
				window.alert(
					window?.wc_add_to_cart_variation_params
						?.i18n_unavailable_text ||
						__(
							'Sorry, this product is unavailable. Please choose a different combination.',
							'poocommerce-payments'
						)
				);
			} else {
				window.alert(
					__(
						'Please select your product options before proceeding.',
						'poocommerce-payments'
					)
				);
			}

			return false;
		}

		return true;
	}, [ isProductPage ] );

	const onClickOtpFlow = useCallback(
		( e ) => {
			e?.preventDefault();

			if ( isPreview ) {
				return; // eslint-disable-line no-useless-return
			}

			recordUserEvent( 'woopay_button_click', {
				source: context,
			} );

			deleteSkipWooPayCookie();

			if ( ! canAddProductToCart() ) {
				return;
			}

			if ( isProductPage ) {
				const productData = getProductDataRef.current();
				if ( ! productData ) {
					return;
				}

				addToCartRef.current( productData ).then( ( res ) => {
					if ( res.error ) {
						if ( res.submit ) {
							// Some extensions needs to submit the form
							// to show error messages.
							document.querySelector( 'form.cart' ).submit();
						}
						return;
					}

					expressCheckoutIframe( api, context, emailSelector );
				} );
			} else {
				expressCheckoutIframe( api, context, emailSelector );
			}
		},
		[
			api,
			context,
			emailSelector,
			isPreview,
			isProductPage,
			canAddProductToCart,
		]
	);

	const onClickFirstPartyAuthFlow = useCallback(
		( e ) => {
			e.preventDefault();

			if ( isPreview || isLoadingRef.current ) {
				return;
			}

			recordUserEvent( 'woopay_button_click', {
				source: context,
			} );

			deleteSkipWooPayCookie();

			if ( ! canAddProductToCart() ) {
				return;
			}

			// Set isLoadingRef to true to prevent multiple clicks.
			isLoadingRef.current = true;
			setIsLoading( true );

			const appearanceType = getAppearanceType();
			const appearance =
				isSupportedThemeEntrypoint( appearanceType ) &&
				getConfig( 'isWooPayGlobalThemeSupportEnabled' )
					? getAppearance( appearanceType, true )
					: null;

			if ( isProductPage ) {
				const productData = getProductDataRef.current();

				if ( ! productData ) {
					return;
				}

				if ( typeof listenForCartChanges?.stop === 'function' ) {
					// Temporarily stop listening for cart changes to prevent
					// rendering a new button + iFrame when the cart is updated.
					listenForCartChanges.stop();
				}

				addToCartRef.current( productData ).then( () => {
					if ( typeof listenForCartChanges?.start === 'function' ) {
						// Start listening for cart changes, again.
						listenForCartChanges.start();
					}
					WooPayFirstPartyAuth.getWooPaySessionFromMerchant( {
						_ajax_nonce: getConfig( 'woopaySessionNonce' ),
						appearance: appearance,
					} )
						.then( async ( response ) => {
							if (
								response?.blog_id &&
								response?.data?.session
							) {
								const sessionResponse = await WooPayFirstPartyAuth.sendPreemptiveSessionDataToWooPay(
									response
								);

								if ( sessionResponse?.is_error ) {
									onClickOtpFlow( null );

									onClickCallbackRef.current = onClickOtpFlow;
									isLoadingRef.current = false;
									setIsLoading( false );
									return;
								}

								window.location.href = appendRedirectionParams(
									sessionResponse.redirect_url
								);
							} else {
								onClickCallbackRef.current = onClickOtpFlow;
								throw new Error( response?.data );
							}
						} )
						.catch( () => {
							const errorMessage = __(
								'Something went wrong. Please try again.',
								'poocommerce-payments'
							);
							showErrorMessage( context, errorMessage );
							isLoadingRef.current = false;
							setIsLoading( false );
						} );
				} );
			} else {
				WooPayFirstPartyAuth.getWooPaySessionFromMerchant( {
					_ajax_nonce: getConfig( 'woopaySessionNonce' ),
					order_id: getConfig( 'order_id' ),
					key: getConfig( 'key' ),
					billing_email: getConfig( 'billing_email' ),
					appearance: appearance,
				} )
					.then( async ( response ) => {
						if ( response?.blog_id && response?.data?.session ) {
							const sessionResponse = await WooPayFirstPartyAuth.sendPreemptiveSessionDataToWooPay(
								response
							);

							if ( sessionResponse?.is_error ) {
								onClickOtpFlow( null );

								onClickCallbackRef.current = onClickOtpFlow;
								isLoadingRef.current = false;
								setIsLoading( false );
								return;
							}

							window.location.href = appendRedirectionParams(
								sessionResponse.redirect_url
							);
						} else {
							onClickCallbackRef.current = onClickOtpFlow;
							throw new Error( response?.data );
						}
					} )
					?.catch( () => {
						const errorMessage = __(
							'Something went wrong. Please try again.',
							'poocommerce-payments'
						);
						showErrorMessage( context, errorMessage );
						isLoadingRef.current = false;
						setIsLoading( false );
					} );
			}
		},
		[
			canAddProductToCart,
			context,
			isPreview,
			isProductPage,
			listenForCartChanges,
			onClickOtpFlow,
		]
	);

	useEffect( () => {
		if ( getConfig( 'isWoopayFirstPartyAuthEnabled' ) ) {
			onClickCallbackRef.current = onClickFirstPartyAuthFlow;
			WooPayFirstPartyAuth.init();
		} else {
			onClickCallbackRef.current = onClickOtpFlow;
		}
	}, [ onClickFirstPartyAuthFlow, onClickOtpFlow ] );

	useEffect( () => {
		const handlePageShow = ( event ) => {
			// Re-enable the button after navigating back/forward to the page if bfcache is used.
			if ( event?.persisted ) {
				isLoadingRef.current = false;
				setIsLoading( false );
			}
		};

		window.addEventListener( 'pageshow', handlePageShow );

		return () => {
			window.removeEventListener( 'pageshow', handlePageShow );
		};
	}, [] );

	return (
		<div id="wcpay-woopay-button">
			<button
				ref={ buttonRef }
				key={ `${ buttonType }-${ theme }-${ buttonSize }` }
				aria-label={ buttonText }
				onClick={ ( e ) => onClickCallbackRef.current( e ) }
				className={ clsx( 'woopay-express-button', {
					'is-loading': isLoading,
				} ) }
				data-type={ buttonType }
				data-size={ buttonSize }
				data-theme={ theme }
				data-width-type={ buttonWidthType }
				style={ {
					height: `${ buttonHeight }px`,
					borderRadius: `${ borderRadius }px`,
				} }
				disabled={ isLoading }
				type="button"
			>
				{ isLoading ? (
					<span className="wc-block-components-spinner" />
				) : (
					<div className="button-content">
						{ interpolateComponents( {
							mixedString: buttonText.replace(
								ButtonTypeTextMap.default,
								'{{wooPayLogo /}}'
							),
							components: {
								wooPayLogo: <ThemedWooPayIcon />,
							},
						} ) }
					</div>
				) }
			</button>
		</div>
	);
};
