/**
 * External dependencies
 */
import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';

/**
 * Internal dependencies
 */
import DuplicateNotice from '..';
import { saveOption } from 'wcpay/data/settings/actions';

jest.mock( 'wcpay/data/settings/actions', () => ( {
	saveOption: jest.fn(),
} ) );

const mockSaveOption = saveOption as jest.MockedFunction< any >;

describe( 'DuplicateNotice', () => {
	afterEach( () => {
		cleanup();
	} );

	test( 'does not render when the payment method is dismissed', () => {
		const dismissedDuplicateNotices = {
			bancontact: [ 'poocommerce_payments' ],
		};
		render(
			<DuplicateNotice
				paymentMethod="bancontact"
				gatewaysEnablingPaymentMethod={ [ 'poocommerce_payments' ] }
				dismissedNotices={ dismissedDuplicateNotices }
				setDismissedDuplicateNotices={ jest.fn() }
			/>
		);
		expect(
			screen.queryByText(
				'This payment method is enabled by other extensions. Review extensions to improve the shopper experience.'
			)
		).not.toBeInTheDocument();
	} );

	test( 'renders correctly when the payment method is dismissed by some plugins but not all', () => {
		const dismissedDuplicateNotices = {
			bancontact: [ 'poocommerce_payments' ],
		};

		render(
			<DuplicateNotice
				paymentMethod="bancontact"
				gatewaysEnablingPaymentMethod={ [
					'poocommerce_payments',
					'another_plugin',
				] }
				dismissedNotices={ dismissedDuplicateNotices }
				setDismissedDuplicateNotices={ jest.fn() }
			/>
		);
		expect(
			screen.getByText(
				'This payment method is enabled by other extensions. Review extensions to improve the shopper experience.'
			)
		).toBeInTheDocument();
		cleanup();
	} );

	test( 'renders correctly when the payment method is not dismissed', () => {
		render(
			<DuplicateNotice
				paymentMethod="card"
				gatewaysEnablingPaymentMethod={ [ 'poocommerce_payments' ] }
				dismissedNotices={ {} }
				setDismissedDuplicateNotices={ jest.fn() }
			/>
		);
		expect(
			screen.getByText(
				'This payment method is enabled by other extensions. Review extensions to improve the shopper experience.'
			)
		).toBeInTheDocument();
		cleanup();
	} );

	test( 'dismissal process triggers appropriate actions', () => {
		const paymentMethod = 'ideal';
		const props = {
			paymentMethod: paymentMethod,
			gatewaysEnablingPaymentMethod: [ 'poocommerce_payments' ],
			dismissedNotices: {},
			setDismissedDuplicateNotices: jest.fn(),
		};
		const { container } = render( <DuplicateNotice { ...props } /> );
		const dismissButton = container.querySelector(
			'.components-button.components-notice__dismiss.has-icon'
		);
		if ( dismissButton ) {
			fireEvent.click( dismissButton );
		} else {
			throw new Error( 'Dismiss button not found' );
		}

		// Check if local state update function and Redux action dispatcher are called correctly
		expect( props.setDismissedDuplicateNotices ).toHaveBeenCalledWith( {
			[ paymentMethod ]: [ 'poocommerce_payments' ],
		} );
		expect(
			mockSaveOption
		).toHaveBeenCalledWith(
			'wcpay_duplicate_payment_method_notices_dismissed',
			{ [ paymentMethod ]: [ 'poocommerce_payments' ] }
		);
	} );

	test( 'clicking on the Review extensions link navigates correctly', () => {
		const { getByText } = render(
			<DuplicateNotice
				{ ...{
					paymentMethod: 'ideal',
					gatewaysEnablingPaymentMethod: [],
					dismissedNotices: {},
					setDismissedDuplicateNotices: jest.fn(),
				} }
			/>
		);
		expect(
			getByText( 'Review extensions' ).closest( 'a' )
		).toHaveAttribute( 'href', 'admin.php?page=wc-settings&tab=checkout' );
	} );
} );
