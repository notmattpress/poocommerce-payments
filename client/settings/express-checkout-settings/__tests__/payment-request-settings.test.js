/** @format */

/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import PaymentRequestSettings from '../payment-request-settings';
import PaymentRequestButtonPreview from '../payment-request-button-preview';
import {
	usePaymentRequestEnabledSettings,
	usePaymentRequestLocations,
	usePaymentRequestButtonType,
	usePaymentRequestButtonSize,
	usePaymentRequestButtonTheme,
	useWooPayEnabledSettings,
} from '../../../data';
import WCPaySettingsContext from 'wcpay/settings/wcpay-settings-context';

jest.mock( '../../../data', () => ( {
	usePaymentRequestEnabledSettings: jest.fn(),
	usePaymentRequestLocations: jest.fn(),
	useTestMode: jest.fn().mockReturnValue( [ false ] ),
	usePaymentRequestButtonType: jest.fn().mockReturnValue( [ 'default' ] ),
	usePaymentRequestButtonBorderRadius: jest.fn().mockReturnValue( [ 4 ] ),
	usePaymentRequestButtonSize: jest.fn().mockReturnValue( [ 'small' ] ),
	usePaymentRequestButtonTheme: jest.fn().mockReturnValue( [ 'dark' ] ),
	useWooPayEnabledSettings: jest.fn(),
	useWooPayShowIncompatibilityNotice: jest.fn().mockReturnValue( false ),
} ) );

jest.mock( '../payment-request-button-preview' );
PaymentRequestButtonPreview.mockImplementation( () => '<></>' );

jest.mock( 'utils/express-checkout', () => ( {
	getExpressCheckoutConfig: jest.fn().mockReturnValue( {
		publishableKey: '123',
		accountId: '0001',
		locale: 'en',
	} ),
} ) );

const getMockPaymentRequestEnabledSettings = (
	isEnabled,
	updateIsPaymentRequestEnabledHandler
) => [ isEnabled, updateIsPaymentRequestEnabledHandler ];

const getMockWooPayEnabledSettings = ( isEnabled ) => [ isEnabled ];

const getMockPaymentRequestLocations = (
	isCheckoutEnabled,
	isProductPageEnabled,
	isCartEnabled,
	updatePaymentRequestLocationsHandler
) => [
	[
		isCheckoutEnabled && 'checkout',
		isProductPageEnabled && 'product',
		isCartEnabled && 'cart',
	].filter( Boolean ),
	updatePaymentRequestLocationsHandler,
];

const renderWithSettingsProvider = ( ui ) =>
	render(
		<WCPaySettingsContext.Provider
			value={ { accountStatus: {}, featureFlags: {} } }
		>
			{ ui }
		</WCPaySettingsContext.Provider>
	);

describe( 'PaymentRequestSettings', () => {
	beforeEach( () => {
		usePaymentRequestEnabledSettings.mockReturnValue(
			getMockPaymentRequestEnabledSettings( true, jest.fn() )
		);

		usePaymentRequestLocations.mockReturnValue(
			getMockPaymentRequestLocations( true, true, true, jest.fn() )
		);

		useWooPayEnabledSettings.mockReturnValue(
			getMockWooPayEnabledSettings( true )
		);
	} );

	it( 'renders enable settings with defaults', () => {
		renderWithSettingsProvider(
			<PaymentRequestSettings section="enable" />
		);

		// confirm there is a heading
		expect(
			screen.queryByText(
				'Enable Apple Pay and Google Pay on selected pages'
			)
		).toBeInTheDocument();

		// confirm checkbox groups displayed
		const [ enableCheckbox ] = screen.queryAllByRole( 'checkbox' );

		expect( enableCheckbox ).toBeInTheDocument();
	} );

	it( 'triggers the hooks when the enable setting is being interacted with', () => {
		const updateIsPaymentRequestEnabledHandler = jest.fn();

		usePaymentRequestEnabledSettings.mockReturnValue(
			getMockPaymentRequestEnabledSettings(
				true,
				updateIsPaymentRequestEnabledHandler
			)
		);

		renderWithSettingsProvider(
			<PaymentRequestSettings section="enable" />
		);

		expect( updateIsPaymentRequestEnabledHandler ).not.toHaveBeenCalled();

		expect( screen.getByLabelText( 'Checkout Page' ) ).toBeChecked();
		expect( screen.getByLabelText( 'Product Page' ) ).toBeChecked();
		expect( screen.getByLabelText( 'Cart Page' ) ).toBeChecked();

		userEvent.click( screen.getByLabelText( /Enable Apple Pay/ ) );
		expect( updateIsPaymentRequestEnabledHandler ).toHaveBeenCalledWith(
			false
		);
	} );

	it( 'renders general settings with defaults', () => {
		renderWithSettingsProvider(
			<PaymentRequestSettings section="general" />
		);

		// confirm settings headings
		expect(
			screen.queryByRole( 'heading', { name: 'Call to action' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'heading', { name: 'Button size' } )
		).toBeInTheDocument();

		expect(
			screen.queryByRole( 'heading', { name: 'Theme' } )
		).toBeInTheDocument();

		expect(
			screen.queryByRole( 'heading', { name: 'Preview' } )
		).toBeInTheDocument();

		// confirm radio button groups displayed
		const [ sizeRadio, themeRadio ] = screen.queryAllByRole( 'radio' );

		expect( sizeRadio ).toBeInTheDocument();
		expect( themeRadio ).toBeInTheDocument();

		// confirm default values
		expect(
			screen.getByRole( 'combobox', {
				name: 'Call to action',
			} )
		).toHaveValue( 'default' );
		expect( screen.getByLabelText( 'Small (40 px)' ) ).toBeChecked();
		expect( screen.getByLabelText( /Dark/ ) ).toBeChecked();
	} );

	it( 'triggers the hooks when the enabled settings are being interacted with', () => {
		const updatePaymentRequestLocationsHandler = jest.fn();
		usePaymentRequestLocations.mockReturnValue(
			getMockPaymentRequestLocations(
				false,
				false,
				false,
				updatePaymentRequestLocationsHandler
			)
		);
		renderWithSettingsProvider(
			<PaymentRequestSettings section="enable" />
		);

		expect( updatePaymentRequestLocationsHandler ).not.toHaveBeenCalled();

		userEvent.click( screen.getByLabelText( /Checkout/ ) );
		expect(
			updatePaymentRequestLocationsHandler
		).toHaveBeenLastCalledWith( [ 'checkout' ] );

		userEvent.click( screen.getByLabelText( /Product Page/ ) );
		expect(
			updatePaymentRequestLocationsHandler
		).toHaveBeenLastCalledWith( [ 'product' ] );

		userEvent.click( screen.getByLabelText( /Cart/ ) );
		expect(
			updatePaymentRequestLocationsHandler
		).toHaveBeenLastCalledWith( [ 'cart' ] );
	} );

	it( 'triggers the hooks when the general settings are being interacted with', () => {
		const setButtonTypeMock = jest.fn();
		const setButtonSizeMock = jest.fn();
		const setButtonThemeMock = jest.fn();

		usePaymentRequestButtonType.mockReturnValue( [
			'default',
			setButtonTypeMock,
		] );
		usePaymentRequestButtonSize.mockReturnValue( [
			'small',
			setButtonSizeMock,
		] );
		usePaymentRequestButtonTheme.mockReturnValue( [
			'dark',
			setButtonThemeMock,
		] );

		renderWithSettingsProvider(
			<PaymentRequestSettings section="general" />
		);

		expect( setButtonTypeMock ).not.toHaveBeenCalled();
		expect( setButtonSizeMock ).not.toHaveBeenCalled();
		expect( setButtonThemeMock ).not.toHaveBeenCalled();

		userEvent.click( screen.getByLabelText( /Light/ ) );
		expect( setButtonThemeMock ).toHaveBeenCalledWith( 'light' );

		userEvent.selectOptions(
			screen.getByRole( 'combobox', {
				name: 'Call to action',
			} ),
			'book'
		);
		expect( setButtonTypeMock ).toHaveBeenCalledWith(
			'book',
			expect.anything()
		);

		userEvent.click( screen.getByLabelText( 'Large (55 px)' ) );
		expect( setButtonSizeMock ).toHaveBeenCalledWith( 'large' );
	} );

	it( 'should trigger an action to save the checked locations when un-checking the location checkboxes', async () => {
		const updatePaymentRequestLocationsHandler = jest.fn();

		usePaymentRequestLocations.mockReturnValue(
			getMockPaymentRequestLocations(
				true,
				true,
				true,
				updatePaymentRequestLocationsHandler
			)
		);

		renderWithSettingsProvider(
			<PaymentRequestSettings section="enable" />
		);

		// Uncheck each checkbox, and verify them what kind of action should have been called
		userEvent.click( screen.getByText( 'Product Page' ) );
		expect(
			updatePaymentRequestLocationsHandler
		).toHaveBeenLastCalledWith( [ 'checkout', 'cart' ] );

		userEvent.click( screen.getByText( 'Checkout Page' ) );
		expect(
			updatePaymentRequestLocationsHandler
		).toHaveBeenLastCalledWith( [ 'product', 'cart' ] );

		userEvent.click( screen.getByText( 'Cart Page' ) );
		expect(
			updatePaymentRequestLocationsHandler
		).toHaveBeenLastCalledWith( [ 'checkout', 'product' ] );
	} );
} );
