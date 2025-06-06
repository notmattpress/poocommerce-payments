/**
 * External dependencies
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import ProductDetails from '../product-details';

describe( 'ProductDetails', () => {
	const baseProps = {
		productType: 'physical_product',
		onProductTypeChange: jest.fn(),
		productDescription: 'A great product',
		onProductDescriptionChange: jest.fn(),
		readOnly: false,
	};

	it( 'renders product type selector and description', () => {
		render( <ProductDetails { ...baseProps } /> );
		expect( screen.getByLabelText( /PRODUCT TYPE/i ) ).toBeInTheDocument();
		expect(
			screen.getByLabelText( /PRODUCT DESCRIPTION/i )
		).toBeInTheDocument();
		expect(
			screen.getByDisplayValue( 'A great product' )
		).toBeInTheDocument();
	} );

	it( 'disables fields when readOnly', () => {
		render( <ProductDetails { ...baseProps } readOnly={ true } /> );
		expect( screen.getByLabelText( /PRODUCT TYPE/i ) ).toBeDisabled();
		expect(
			screen.getByLabelText( /PRODUCT DESCRIPTION/i )
		).toBeDisabled();
	} );

	it( 'calls change handlers', () => {
		render( <ProductDetails { ...baseProps } /> );
		fireEvent.change( screen.getByLabelText( /PRODUCT DESCRIPTION/i ), {
			target: { value: 'New desc' },
		} );
		expect( baseProps.onProductDescriptionChange ).toHaveBeenCalledWith(
			'New desc'
		);
		fireEvent.change( screen.getByLabelText( /PRODUCT TYPE/i ), {
			target: { value: 'digital_product_or_service' },
		} );
		expect( baseProps.onProductTypeChange ).toHaveBeenCalled();
	} );
} );
