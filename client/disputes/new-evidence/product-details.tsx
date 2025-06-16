/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	SelectControl,
	TextareaControl,
} from 'wcpay/components/wp-components-wrapped';

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
			<div className="wcpay-dispute-evidence-product-details__field-group">
				<SelectControl
					label={ __( 'PRODUCT TYPE', 'poocommerce-payments' ) }
					help={ __(
						'First select the kind of product you fulfilled.',
						'poocommerce-payments'
					) }
					value={ productType }
					onChange={ onProductTypeChange }
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
					label={ __(
						'PRODUCT DESCRIPTION',
						'poocommerce-payments'
					) }
					help={ __(
						'Please make sure this is an accurate description of the product.',
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
