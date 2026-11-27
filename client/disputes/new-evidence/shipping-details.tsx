/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { TextControl } from '@wordpress/components';

interface ShippingDetailsProps {
	shippingCarrier: string;
	shippingDate: string;
	shippingTrackingNumber: string;
	shippingAddress: string;
	readOnly?: boolean;
	onShippingCarrierChange: ( value: string ) => void;
	onShippingDateChange: ( value: string ) => void;
	onShippingTrackingNumberChange: ( value: string ) => void;
	onShippingAddressChange: ( value: string ) => void;
}

const ShippingDetails: React.FC< ShippingDetailsProps > = ( {
	shippingCarrier,
	shippingDate,
	shippingTrackingNumber,
	shippingAddress,
	readOnly = false,
	onShippingCarrierChange,
	onShippingDateChange,
	onShippingTrackingNumberChange,
	onShippingAddressChange,
} ) => {
	return (
		<section className="wcpay-dispute-evidence-shipping-details">
			<h3 className="wcpay-dispute-evidence-shipping-details__heading">
				{ __( 'Delivery details', 'poocommerce-payments' ) }
			</h3>
			<div className="wcpay-dispute-evidence-shipping-details__subheading">
				{ __(
					'Please ensure all prefilled information is correct and complete any missing details.',
					'poocommerce-payments'
				) }
			</div>
			<div className="wcpay-dispute-evidence-shipping-details__field-group">
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'SHIPPING CARRIER', 'poocommerce-payments' ) }
					onChange={ onShippingCarrierChange }
					value={ shippingCarrier }
					disabled={ readOnly }
				/>
			</div>
			<div className="wcpay-dispute-evidence-shipping-details__field-group">
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'SHIPPING DATE', 'poocommerce-payments' ) }
					onChange={ onShippingDateChange }
					type="date"
					value={
						shippingDate
							? new Date( shippingDate )
									.toISOString()
									.split( 'T' )[ 0 ]
							: new Date().toISOString().split( 'T' )[ 0 ]
					}
					disabled={ readOnly }
				/>
			</div>
			<div className="wcpay-dispute-evidence-shipping-details__field-group">
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'TRACKING NUMBER', 'poocommerce-payments' ) }
					onChange={ onShippingTrackingNumberChange }
					value={ shippingTrackingNumber }
					disabled={ readOnly }
				/>
			</div>
			<div className="wcpay-dispute-evidence-shipping-details__field-group">
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'SHIPPING ADDRESS', 'poocommerce-payments' ) }
					onChange={ onShippingAddressChange }
					value={ shippingAddress.replace( /\n/g, ' ' ) }
					disabled={ readOnly }
				/>
			</div>
		</section>
	);
};

export default ShippingDetails;
