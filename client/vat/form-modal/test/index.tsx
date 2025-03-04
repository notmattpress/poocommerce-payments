/** @format */

/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import user from '@testing-library/user-event';
import React from 'react';

/**
 * Internal dependencies
 */
import VatFormModal from '..';
import VatForm from '../../form';

jest.mock( '../../form', () => jest.fn() );

describe( 'Tax details modal', () => {
	beforeEach( () => {
		jest.mocked( VatForm ).mockReturnValue( <p>VAT Form</p> );
	} );

	it( 'should render when isModalOpen is true', () => {
		render(
			<VatFormModal
				isModalOpen={ true }
				setModalOpen={ () => ( {} ) }
				onCompleted={ () => ( {} ) }
			/>
		);
		expect(
			screen.getByRole( 'dialog', { name: 'Set your tax details' } )
		).toBeVisible();
	} );

	it( 'should not render when isModalOpen is false', () => {
		render(
			<VatFormModal
				isModalOpen={ false }
				setModalOpen={ () => ( {} ) }
				onCompleted={ () => ( {} ) }
			/>
		);
		expect(
			screen.queryByRole( 'dialog', { name: 'Set your tax details' } )
		).toBeNull();
	} );

	it( 'should render the VAT Form', () => {
		render(
			<VatFormModal
				isModalOpen={ true }
				setModalOpen={ () => ( {} ) }
				onCompleted={ () => ( {} ) }
			/>
		);
		expect(
			screen.getByRole( 'dialog', { name: 'Set your tax details' } )
		).toMatchSnapshot();
	} );

	it( 'should close when clicking on the dismiss button', () => {
		let isModalOpen = true;
		const setModalOpen = ( value: boolean ) => ( isModalOpen = value );
		const { rerender } = render(
			<VatFormModal
				isModalOpen={ isModalOpen }
				setModalOpen={ setModalOpen }
				onCompleted={ () => ( {} ) }
			/>
		);

		user.click( screen.getByRole( 'button', { name: 'Close dialog' } ) );

		// The isModalOpen prop should have changed, so we need to force a rerender.
		rerender(
			<VatFormModal
				isModalOpen={ isModalOpen }
				setModalOpen={ setModalOpen }
				onCompleted={ () => ( {} ) }
			/>
		);

		expect(
			screen.queryByRole( 'dialog', { name: 'Set your tax details' } )
		).toBeNull();
	} );
} );
