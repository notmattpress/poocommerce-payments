/* eslint-disable max-len */
/* global jQuery */
/**
 * External dependencies
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { ValidationInputError } from '@poocommerce/blocks-checkout'; // eslint-disable-line import/no-unresolved
import {
	VALIDATION_STORE_KEY,
	CHECKOUT_STORE_KEY,
} from '@poocommerce/block-data'; // eslint-disable-line import/no-unresolved

/**
 * Internal dependencies
 */
import PhoneNumberInput from 'settings/phone-input';
import { getConfig } from 'utils/checkout';
import { buildAjaxURL } from 'utils/express-checkout';
import AdditionalInformation from './additional-information';
import Agreement from './agreement';
import Container from './container';
import useWooPayUser from '../hooks/use-woopay-user';
import request from '../../../checkout/utils/request';
import useSelectedPaymentMethod from '../hooks/use-selected-payment-method';
import { recordUserEvent } from 'tracks';
import './style.scss';

const CheckoutPageSaveUser = ( { isBlocksCheckout } ) => {
	const errorId = 'invalid-woopay-phone-number';

	const { setValidationErrors, clearValidationError } = useDispatch(
		VALIDATION_STORE_KEY
	);

	const [ isSaveDetailsChecked, setIsSaveDetailsChecked ] = useState(
		window.woopayCheckout?.PRE_CHECK_SAVE_MY_INFO || false
	);
	const [ phoneNumber, setPhoneNumber ] = useState( '' );
	const [ isPhoneValid, onPhoneValidationChange ] = useState( null );
	const [ userDataSent, setUserDataSent ] = useState( false );
	const isPhoneNumberTouched = useRef( false );

	const checkoutIsProcessing = useSelect( ( select ) =>
		select( CHECKOUT_STORE_KEY ).isProcessing()
	);

	const isBillingSameAsShipping = useSelect( ( select ) =>
		select( CHECKOUT_STORE_KEY ).getUseShippingAsBilling()
	);

	const isRegisteredUser = useWooPayUser();
	const { isWCPayChosen, isNewPaymentTokenChosen } = useSelectedPaymentMethod(
		isBlocksCheckout
	);

	// In classic checkout the saved tokens are under WCPay, so we need to check if new token is selected or not,
	// under WCPay. For blocks checkout considering isWCPayChosen is enough.
	const isWCPayWithNewTokenChosen = isBlocksCheckout
		? isWCPayChosen
		: isWCPayChosen && isNewPaymentTokenChosen;

	const viewportWidth = window.document.documentElement.clientWidth;
	const viewportHeight = window.document.documentElement.clientHeight;

	useEffect( () => {
		if ( ! isBlocksCheckout ) {
			return;
		}

		const rememberMe = document.querySelector( '#remember-me' );

		if ( ! rememberMe ) {
			return;
		}

		if ( checkoutIsProcessing ) {
			rememberMe.classList.add(
				'wc-block-components-checkout-step--disabled'
			);
			rememberMe.setAttribute( 'disabled', 'disabled' );

			return;
		}

		rememberMe.classList.remove(
			'wc-block-components-checkout-step--disabled'
		);
		rememberMe.removeAttribute( 'disabled', 'disabled' );
	}, [ checkoutIsProcessing, isBlocksCheckout ] );

	const getPhoneFieldValue = useCallback( () => {
		let phoneFieldValue = '';
		if ( isBlocksCheckout ) {
			phoneFieldValue =
				document.getElementById( 'phone' )?.value ||
				document.getElementById( 'billing-phone' )?.value ||
				document.getElementById( 'shipping-phone' )?.value ||
				'';
		} else {
			// for classic checkout.
			phoneFieldValue =
				document.getElementById( 'billing_phone' )?.value || '';
		}

		// Take out any non-digit characters, except +.
		phoneFieldValue = phoneFieldValue.replace( /[^\d+]*/g, '' );

		if ( ! phoneFieldValue.startsWith( '+' ) ) {
			phoneFieldValue = '+1' + phoneFieldValue;
		}

		return phoneFieldValue;
	}, [ isBlocksCheckout ] );

	const sendExtensionData = useCallback(
		( shouldClearData = false ) => {
			const data = shouldClearData
				? { empty: 1 }
				: {
						save_user_in_woopay: isSaveDetailsChecked ? 1 : 0,
						woopay_source_url:
							wcSettings?.storePages?.checkout?.permalink,
						woopay_is_blocks: 1,
						woopay_viewport: `${ viewportWidth }x${ viewportHeight }`,
						woopay_user_phone_field: {
							full: phoneNumber,
						},
				  };

			request(
				buildAjaxURL(
					getConfig( 'wcAjaxUrl' ),
					'set_woopay_phone_number'
				),
				{
					_ajax_nonce: getConfig( 'woopaySessionNonce' ),
					...data,
				}
			).then( () => {
				setUserDataSent( ! shouldClearData );
			} );
		},
		[ isSaveDetailsChecked, phoneNumber, viewportWidth, viewportHeight ]
	);

	const handleCountryDropdownClick = useCallback( () => {
		recordUserEvent( 'checkout_woopay_save_my_info_country_click' );
	}, [] );

	const handleCheckboxClick = ( e ) => {
		const isChecked = e.target.checked;
		if ( isChecked ) {
			setPhoneNumber( getPhoneFieldValue() );
		} else {
			setPhoneNumber( '' );
			if ( isBlocksCheckout ) {
				sendExtensionData( true );
			}
		}
		setIsSaveDetailsChecked( isChecked );

		recordUserEvent( 'checkout_save_my_info_click', {
			status: isChecked ? 'checked' : 'unchecked',
		} );
	};

	useEffect( () => {
		// Record Tracks event when the mobile number is entered.
		if ( isPhoneValid ) {
			recordUserEvent( 'checkout_woopay_save_my_info_mobile_enter' );
		}
	}, [ isPhoneValid ] );

	useEffect( () => {
		const checkoutForm = jQuery( 'form.poocommerce-checkout' );

		checkoutForm.on( 'checkout_place_order', function () {
			jQuery( '#validate-error-invalid-woopay-phone-number' ).show();
		} );
	}, [] );

	useEffect( () => {
		if ( ! isSaveDetailsChecked ) {
			clearValidationError( errorId );
			if ( isPhoneValid !== null ) {
				onPhoneValidationChange( null );
			}
			return;
		}

		if ( isSaveDetailsChecked && isPhoneValid ) {
			clearValidationError( errorId );

			// Set extension data if checkbox is selected and phone number is valid in blocks checkout.
			if ( isBlocksCheckout ) {
				sendExtensionData( false );
			}
			return;
		}

		if (
			isSaveDetailsChecked &&
			! isPhoneValid &&
			isWCPayWithNewTokenChosen
		) {
			setValidationErrors( {
				[ errorId ]: {
					message: __(
						'Please enter a valid mobile phone number.',
						'poocommerce-payments'
					),
					// Hides errors when the number has not been typed yet but shows when trying to place the order.
					hidden: isPhoneValid === null,
				},
			} );
		}
	}, [
		clearValidationError,
		isBlocksCheckout,
		isPhoneValid,
		isSaveDetailsChecked,
		sendExtensionData,
		setValidationErrors,
		isWCPayWithNewTokenChosen,
	] );

	const updatePhoneNumber = useCallback( () => {
		if ( isPhoneNumberTouched.current ) {
			return;
		}

		setPhoneNumber( getPhoneFieldValue() );
	}, [ setPhoneNumber, getPhoneFieldValue, isPhoneNumberTouched ] );

	useEffect( () => {
		updatePhoneNumber();
	}, [ updatePhoneNumber ] );

	// Update the WooPay phone number on the phone field blur event.
	useEffect( () => {
		if ( ! isBlocksCheckout ) {
			document
				.querySelector( '#billing_phone' )
				?.addEventListener( 'blur', updatePhoneNumber );
			return;
		}

		updatePhoneNumber();

		if ( isBillingSameAsShipping ) {
			document
				.querySelector( '#billing-phone' )
				?.removeEventListener( 'blur', updatePhoneNumber );

			document
				.querySelector( '#shipping-phone' )
				?.addEventListener( 'blur', updatePhoneNumber );
			return;
		}

		document
			.querySelector( '#shipping-phone' )
			?.removeEventListener( 'blur', updatePhoneNumber );

		document
			.querySelector( '#billing-phone' )
			?.addEventListener( 'blur', updatePhoneNumber );
	}, [
		isBillingSameAsShipping,
		updatePhoneNumber,
		isPhoneNumberTouched,
		getPhoneFieldValue,
		isBlocksCheckout,
	] );

	useEffect( () => {
		if (
			! getConfig( 'forceNetworkSavedCards' ) ||
			! isWCPayWithNewTokenChosen ||
			isRegisteredUser
		) {
			// Clicking the place order button sets the extension data in backend. If user changes the payment method
			// due to an error, we need to clear the extension data in backend.
			if ( isBlocksCheckout && userDataSent ) {
				sendExtensionData( true );
			}
			clearValidationError( errorId );
		}
	}, [
		clearValidationError,
		errorId,
		isBlocksCheckout,
		isRegisteredUser,
		isWCPayWithNewTokenChosen,
		sendExtensionData,
		userDataSent,
	] );

	if (
		! getConfig( 'forceNetworkSavedCards' ) ||
		! isWCPayWithNewTokenChosen ||
		isRegisteredUser
	) {
		return null;
	}

	return (
		<Container isBlocksCheckout={ isBlocksCheckout }>
			<div className="save-details">
				<div className="save-details-header">
					<div
						className={
							isBlocksCheckout
								? 'wc-block-components-checkbox'
								: ''
						}
					>
						<label htmlFor="save_user_in_woopay">
							<input
								type="checkbox"
								checked={ isSaveDetailsChecked }
								onChange={ handleCheckboxClick }
								name="save_user_in_woopay"
								id="save_user_in_woopay"
								value="true"
								className={ `save-details-checkbox ${
									isBlocksCheckout
										? 'wc-block-components-checkbox__input'
										: ''
								}` }
								aria-checked={ isSaveDetailsChecked }
							/>
							{ isBlocksCheckout && (
								<svg
									className="wc-block-components-checkbox__mark"
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 20"
								>
									<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
								</svg>
							) }
							<span className="wc-block-components-checkbox__label">
								{ __(
									'Securely save my information for 1-click checkout',
									'poocommerce-payments'
								) }
							</span>
						</label>
					</div>
				</div>
				{ isSaveDetailsChecked && (
					<div
						className="save-details-form form-row"
						data-testid="save-user-form"
					>
						<input
							type="hidden"
							name="woopay_source_url"
							value={
								wcSettings?.storePages?.checkout?.permalink
							}
						/>
						<input
							type="hidden"
							name="woopay_viewport"
							value={ `${ viewportWidth }x${ viewportHeight }` }
						/>
						<div className={ isPhoneValid ? '' : 'has-error' }>
							<PhoneNumberInput
								value={ phoneNumber }
								onValueChange={ setPhoneNumber }
								onValidationChange={ onPhoneValidationChange }
								onCountryDropdownClick={
									handleCountryDropdownClick
								}
								onClick={ () =>
									( isPhoneNumberTouched.current = true )
								}
								inputProps={ {
									name:
										'woopay_user_phone_field[no-country-code]',
								} }
								isBlocksCheckout={ isBlocksCheckout }
							/>
						</div>
						{ isBlocksCheckout && (
							<ValidationInputError
								elementId={ errorId }
								propertyName={ errorId }
							/>
						) }
						{ ! isBlocksCheckout && ! isPhoneValid && (
							<p
								id="validate-error-invalid-woopay-phone-number"
								hidden={ isPhoneValid !== false }
							>
								{ __(
									'Please enter a valid mobile phone number.',
									'poocommerce-payments'
								) }
							</p>
						) }
						<AdditionalInformation />
						<Agreement />
					</div>
				) }
			</div>
		</Container>
	);
};

export default CheckoutPageSaveUser;
