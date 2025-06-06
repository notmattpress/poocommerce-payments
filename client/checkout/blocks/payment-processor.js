/**
 * External dependencies
 */
import { PaymentElement, useElements } from '@stripe/react-stripe-js';
import {
	getPaymentMethods,
	// eslint-disable-next-line import/no-unresolved
} from '@poocommerce/blocks-registry';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from 'react';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import { usePaymentCompleteHandler, usePaymentFailHandler } from './hooks';
import {
	getStripeElementOptions,
	blocksShowLinkButtonHandler,
	getBlocksEmailValue,
	isLinkEnabled,
	getGatewayIdBy,
} from 'wcpay/checkout/utils/upe';
import { useCustomerData } from './utils';
import enableStripeLinkPaymentMethod from 'wcpay/checkout/stripe-link';
import { getUPEConfig } from 'wcpay/utils/checkout';
import { validateElements } from 'wcpay/checkout/classic/payment-processing';
import { PAYMENT_METHOD_ERROR } from 'wcpay/checkout/constants';

const getBillingDetails = ( billingData ) => {
	return {
		name: `${ billingData.first_name } ${ billingData.last_name }`.trim(),
		email: billingData.email,
		phone: billingData.phone,
		address: {
			city: billingData.city,
			country: billingData.country,

			line1: billingData.address_1,
			line2: billingData.address_2,
			postal_code: billingData.postcode,
			state: billingData.state,
		},
	};
};

const getFraudPreventionToken = () => {
	return window.wcpayFraudPreventionToken ?? '';
};

const noop = () => null;

const PaymentProcessor = ( {
	api,
	activePaymentMethod,
	testingInstructions,
	eventRegistration: { onPaymentSetup, onCheckoutSuccess, onCheckoutFail },
	emitResponse,
	paymentMethodId,
	upeMethods,
	errorMessage,
	shouldSavePayment,
	fingerprint,
	onLoadError = noop,
	theme,
} ) => {
	const elements = useElements();
	const hasLoadErrorRef = useRef( false );
	const linkCleanupRef = useRef( null );

	const paymentMethodsConfig = getUPEConfig( 'paymentMethodsConfig' );
	const isTestMode = getUPEConfig( 'testMode' );
	const gatewayId = upeMethods[ paymentMethodId ].gatewayId;
	const gatewayConfig = getPaymentMethods()[ gatewayId ];
	const {
		billingAddress: billingData,
		setShippingAddress,
		setBillingAddress,
	} = useCustomerData();

	useEffect( () => {
		if (
			activePaymentMethod === getGatewayIdBy( 'card' ) &&
			isLinkEnabled( paymentMethodsConfig )
		) {
			enableStripeLinkPaymentMethod( {
				api: api,
				elements: elements,
				emailId: 'email',
				onAutofill: ( billingAddress, shippingAddress ) => {
					// in some cases (e.g.: customer doesn't select the payment method in the Link modal), the billing address is empty.
					if ( billingAddress ) {
						// setting the country first, in case the "state"/"county"/"province"
						// select changes from a select to a text field (or vice-versa).
						setBillingAddress( {
							country: billingAddress.country,
						} );
						// after the country, we can safely set the other fields
						setBillingAddress( {
							...billingAddress,
						} );
					}

					// in some cases (e.g.: customer doesn't select the shipping address method in the Link modal),
					// the shipping address is empty.
					if ( shippingAddress ) {
						// setting the country first, in case the "state"/"county"/"province"
						// select changes from a select to a text field (or vice-versa).
						setShippingAddress( {
							country: shippingAddress.country,
						} );
						// after the country, we can safely set the other fields
						setShippingAddress( {
							...shippingAddress,
						} );
					}

					// after all the above, we can now set the email field by getting its value from the DOM.
					setBillingAddress( {
						email: getBlocksEmailValue(),
					} );
					setShippingAddress( {
						email: getBlocksEmailValue(),
					} );
				},
				onButtonShow: blocksShowLinkButtonHandler,
			} ).then( ( cleanup ) => {
				linkCleanupRef.current = cleanup;
			} );

			// Cleanup the Link button when the component unmounts
			return () => {
				if ( linkCleanupRef.current ) {
					linkCleanupRef.current();
					linkCleanupRef.current = null;
				}
			};
		}
	}, [
		api,
		elements,
		activePaymentMethod,
		paymentMethodsConfig,
		setBillingAddress,
		setShippingAddress,
	] );

	useEffect(
		() =>
			onPaymentSetup( () => {
				async function handlePaymentProcessing() {
					if ( gatewayId !== activePaymentMethod ) {
						return;
					}

					if ( hasLoadErrorRef.current ) {
						return {
							type: 'error',
							message: __(
								'Invalid or missing payment details. Please ensure the provided payment method is correctly entered.',
								'poocommerce-payments'
							),
						};
					}

					if ( errorMessage ) {
						return {
							type: 'error',
							message: errorMessage,
						};
					}

					if (
						gatewayConfig.supports.showSaveOption &&
						shouldSavePayment &&
						! paymentMethodsConfig[ paymentMethodId ].isReusable
					) {
						return {
							type: 'error',
							message: __(
								'This payment method cannot be saved for future use.',
								'poocommerce-payments'
							),
						};
					}

					try {
						await validateElements( elements );
					} catch ( e ) {
						return {
							type: 'error',
							message: e.message,
						};
					}

					const stripeForUPE = await api.getStripeForUPE(
						paymentMethodId
					);

					const result = await stripeForUPE.createPaymentMethod( {
						elements,
						params: {
							billing_details: getBillingDetails( billingData ),
						},
					} );

					if ( result.error ) {
						return {
							// We return a `success` type even when there's an error since we want the checkout request to go
							// through, so we can have this attempt recorded in an Order.
							type: 'success',
							meta: {
								paymentMethodData: {
									payment_method: gatewayId,
									'wcpay-payment-method': PAYMENT_METHOD_ERROR,
									'wcpay-payment-method-error-code':
										result.error.code,
									'wcpay-payment-method-error-decline-code':
										result.error.decline_code,
									'wcpay-payment-method-error-message':
										result.error.message,
									'wcpay-payment-method-error-type':
										result.error.type,
									'wcpay-fraud-prevention-token': getFraudPreventionToken(),
									'wcpay-fingerprint': fingerprint,
								},
							},
						};
					}

					return {
						type: 'success',
						meta: {
							paymentMethodData: {
								payment_method: gatewayId,
								'wcpay-payment-method': result.paymentMethod.id,
								'wcpay-fraud-prevention-token': getFraudPreventionToken(),
								'wcpay-fingerprint': fingerprint,
							},
						},
					};
				}
				return handlePaymentProcessing();
			} ),
		[
			activePaymentMethod,
			api,
			elements,
			fingerprint,
			gatewayConfig,
			paymentMethodId,
			paymentMethodsConfig,
			shouldSavePayment,
			gatewayId,
			errorMessage,
			onPaymentSetup,
			billingData,
		]
	);

	usePaymentCompleteHandler(
		api,
		onCheckoutSuccess,
		emitResponse,
		shouldSavePayment
	);

	usePaymentFailHandler( onCheckoutFail, emitResponse );

	const setHasLoadError = ( event ) => {
		hasLoadErrorRef.current = true;
		onLoadError( event );
	};

	return (
		<>
			{ isTestMode && (
				<p
					className={ clsx( 'content', {
						[ `theme--${ theme }` ]: theme,
					} ) }
					dangerouslySetInnerHTML={ {
						__html: testingInstructions,
					} }
				/>
			) }
			<PaymentElement
				options={ getStripeElementOptions(
					shouldSavePayment,
					paymentMethodsConfig
				) }
				onLoadError={ setHasLoadError }
				className="wcpay-payment-element"
			/>
		</>
	);
};

export default PaymentProcessor;
