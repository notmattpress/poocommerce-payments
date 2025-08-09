/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SelectControl } from 'wcpay/components/wp-components-wrapped/components/select-control';
import { TextareaControl } from 'wcpay/components/wp-components-wrapped/components/textarea-control';

interface ProductDetailsProps {
	productType: string;
	onProductTypeChange: ( value: string ) => void;
	productDescription: string;
	onProductDescriptionChange: ( value: string ) => void;
	readOnly?: boolean;
}

const ProductDetails: React.FC< ProductDetailsProps > = ( {
	productType,
	onProductTypeChange,
	productDescription,
	onProductDescriptionChange,
	readOnly = false,
} ) => {
	return (
		<section className="wcpay-dispute-evidence-product-details">
			<h3 className="wcpay-dispute-evidence-product-details__heading">
				{ __( 'Product details', 'poocommerce-payments' ) }
			</h3>
			<div className="wcpay-dispute-evidence-product-details__subheading">
				{ __(
					'Please ensure the product type and description have been entered accurately.',
					'poocommerce-payments'
				) }
			</div>
			<div className="wcpay-dispute-evidence-product-details__field-group">
				<SelectControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'PRODUCT TYPE', 'poocommerce-payments' ) }
					value={ productType }
					onChange={ onProductTypeChange }
					data-testid={ 'dispute-challenge-product-type-selector' }
					options={ [
						{
							label: __(
								'Physical products',
								'poocommerce-payments'
							),
							value: 'physical_product',
						},
						{
							label: __(
								'Digital products',
								'poocommerce-payments'
							),
							value: 'digital_product_or_service',
						},
						{
							label: __(
								'Offline service',
								'poocommerce-payments'
							),
							value: 'offline_service',
						},
						{
							label: __(
								'Multiple product types',
								'poocommerce-payments'
							),
							value: 'multiple',
						},
					] }
					disabled={ readOnly }
				/>
			</div>
			<div className="wcpay-dispute-evidence-product-details__field-group">
				<TextareaControl
					__nextHasNoMarginBottom
					label={ __(
						'PRODUCT DESCRIPTION',
						'poocommerce-payments'
					) }
					value={ productDescription }
					onChange={ onProductDescriptionChange }
					disabled={ readOnly }
				/>
			</div>
		</section>
	);
};

export default ProductDetails;
