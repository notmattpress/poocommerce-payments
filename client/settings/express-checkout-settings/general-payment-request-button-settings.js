/** @format */
/**
 * External dependencies
 */
import React, { useMemo } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalNumberControl as NumberControl,
	SelectControl,
	RadioControl,
	RangeControl,
} from '@wordpress/components';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CardBody from '../card-body';
import PaymentRequestButtonPreview from './payment-request-button-preview';
import interpolateComponents from '@automattic/interpolate-components';
import { getExpressCheckoutConfig } from 'utils/express-checkout';
import WCPaySettingsContext from '../wcpay-settings-context';
import InlineNotice from 'wcpay/components/inline-notice';
import {
	usePaymentRequestButtonType,
	usePaymentRequestButtonSize,
	usePaymentRequestButtonTheme,
	usePaymentRequestButtonBorderRadius,
	usePaymentRequestEnabledSettings,
	useWooPayEnabledSettings,
} from 'wcpay/data';

const makeButtonSizeText = ( string ) =>
	interpolateComponents( {
		mixedString: string,
		components: {
			helpText: (
				<span className="payment-method-settings__option-muted-text" />
			),
		},
	} );

const buttonSizeOptions = [
	{
		label: makeButtonSizeText(
			__(
				'Small {{helpText}}(40 px){{/helpText}}',
				'poocommerce-payments'
			)
		),
		value: 'small',
	},
	{
		label: makeButtonSizeText(
			__(
				'Medium {{helpText}}(48 px){{/helpText}}',
				'poocommerce-payments'
			)
		),
		value: 'medium',
	},
	{
		label: makeButtonSizeText(
			__(
				'Large {{helpText}}(55 px){{/helpText}}',
				'poocommerce-payments'
			)
		),
		value: 'large',
	},
];

const buttonActionOptions = [
	{
		label: __( 'Only icon', 'poocommerce-payments' ),
		value: 'default',
	},
	{
		label: __( 'Buy with', 'poocommerce-payments' ),
		value: 'buy',
	},
	{
		label: __( 'Donate with', 'poocommerce-payments' ),
		value: 'donate',
	},
	{
		label: __( 'Book with', 'poocommerce-payments' ),
		value: 'book',
	},
];

const makeButtonThemeText = ( string ) =>
	interpolateComponents( {
		mixedString: string,
		components: {
			br: <br />,
			helpText: (
				<span className="payment-method-settings__option-help-text" />
			),
		},
	} );

const buttonThemeOptions = [
	{
		label: makeButtonThemeText(
			__(
				'Dark {{br/}}{{helpText}}Recommended for white or light-colored backgrounds with high contrast.{{/helpText}}',
				'poocommerce-payments'
			)
		),
		value: 'dark',
	},
	{
		label: makeButtonThemeText(
			__(
				'Light {{br/}}{{helpText}}Recommended for dark or colored backgrounds with high contrast.{{/helpText}}',
				'poocommerce-payments'
			)
		),
		value: 'light',
	},
	{
		label: makeButtonThemeText(
			__(
				'Outline {{br/}}{{helpText}}Recommended for white or light-colored backgrounds with insufficient contrast.{{/helpText}}',
				'poocommerce-payments'
			)
		),
		value: 'light-outline',
	},
];

const GeneralPaymentRequestButtonSettings = ( { type } ) => {
	const [ buttonType, setButtonType ] = usePaymentRequestButtonType();
	const [ size, setSize ] = usePaymentRequestButtonSize();
	const [ theme, setTheme ] = usePaymentRequestButtonTheme();
	const [ radius, setRadius ] = usePaymentRequestButtonBorderRadius();
	const [ isWooPayEnabled ] = useWooPayEnabledSettings();
	const [ isPaymentRequestEnabled ] = usePaymentRequestEnabledSettings();
	const {
		featureFlags: { woopay: isWooPayFeatureFlagEnabled },
	} = useContext( WCPaySettingsContext );

	const stripePromise = useMemo( () => {
		const stripeSettings = getExpressCheckoutConfig( 'stripe' );
		return loadStripe( stripeSettings.publishableKey, {
			stripeAccount: stripeSettings.accountId,
			locale: stripeSettings.locale,
		} );
	}, [] );

	const otherButtons =
		type === 'woopay'
			? __( 'Apple Pay / Google Pay buttons', 'poocommerce-payments' )
			: __( 'WooPay button', 'poocommerce-payments' );

	const showWarning =
		isWooPayEnabled &&
		isPaymentRequestEnabled &&
		isWooPayFeatureFlagEnabled;

	return (
		<CardBody>
			{ showWarning && (
				<>
					<InlineNotice
						status="warning"
						icon={ true }
						isDismissible={ false }
					>
						{ sprintf(
							/* translators: %s type of button to which the settings will be applied */
							__(
								'These settings will also apply to the %s on your store.',
								'poocommerce-payments'
							),
							otherButtons
						) }
					</InlineNotice>
					<InlineNotice
						status="warning"
						icon={ true }
						isDismissible={ false }
					>
						{ __(
							'Some appearance settings may be overridden in the express payment section of the Cart & Checkout blocks.'
						) }
					</InlineNotice>
				</>
			) }
			<h4>{ __( 'Call to action', 'poocommerce-payments' ) }</h4>
			<SelectControl
				className="payment-method-settings__cta-selection"
				label={ __( 'Call to action', 'poocommerce-payments' ) }
				help={ __(
					'Select a button label that fits best with the flow of purchase or payment experience on your store.',
					'poocommerce-payments'
				) }
				hideLabelFromVision
				value={ buttonType }
				options={ buttonActionOptions }
				onChange={ setButtonType }
			/>
			<h4>{ __( 'Button size', 'poocommerce-payments' ) }</h4>
			<RadioControl
				selected={ size }
				options={ buttonSizeOptions }
				onChange={ setSize }
			/>
			<h4>{ __( 'Theme', 'poocommerce-payments' ) }</h4>
			<RadioControl
				selected={ theme }
				options={ buttonThemeOptions }
				onChange={ setTheme }
			/>
			<h4>{ __( 'Border radius', 'poocommerce-payments' ) }</h4>
			<div className="payment-method-settings__border-radius">
				<NumberControl
					label={ __(
						/* translators: Label for a number input, hidden from view. Intended for accessibility. */
						'Border radius, number input',
						'poocommerce-payments'
					) }
					hideLabelFromVision
					isPressEnterToChange={ true }
					value={ radius }
					max={ 30 }
					min={ 0 }
					hideHTMLArrows
					onChange={ ( value ) => {
						if ( typeof value === 'string' ) {
							setRadius( parseInt( value, 10 ) );
						} else {
							setRadius( value );
						}
					} }
					suffix={
						<div className="payment-method-settings__border-radius__number-control__suffix">
							px
						</div>
					}
				/>
				<RangeControl
					label={ __(
						/* translators: Label for an input slider, hidden from view. Intended for accessibility. */
						'Border radius, slider',
						'poocommerce-payments'
					) }
					hideLabelFromVision
					className="payment-method-settings__border-radius__slider"
					value={ radius }
					max={ 30 }
					min={ 0 }
					withInputField={ false }
					onChange={ setRadius }
				/>
			</div>
			<p className="payment-method-settings__option-help-text">
				{ __(
					'Controls the corner roundness of express payment buttons.',
					'poocommerce-payments'
				) }
			</p>
			<h4>{ __( 'Preview', 'poocommerce-payments' ) }</h4>
			<div className="payment-method-settings__option-help-text">
				{ __(
					'See the preview of enabled express payment buttons.',
					'poocommerce-payments'
				) }
			</div>
			<Elements stripe={ stripePromise }>
				<PaymentRequestButtonPreview />
			</Elements>
		</CardBody>
	);
};

export default GeneralPaymentRequestButtonSettings;
