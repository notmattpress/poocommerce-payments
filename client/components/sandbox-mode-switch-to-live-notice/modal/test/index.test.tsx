/**
 * External dependencies
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import user from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import SetupLivePaymentsModal from '../index';

jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn().mockReturnValue( { updateOptions: jest.fn() } ),
} ) );

declare const global: {
	wcpaySettings: {
		connectUrl: string;
	};
};

describe( 'Setup Live Payments Modal', () => {
	global.wcpaySettings = {
		connectUrl: 'https://wcpay.test/connect',
	};

	it( 'modal is open by default', () => {
		render(
			<SetupLivePaymentsModal
				from="bogus"
				source="bogus-again"
				onClose={ () => jest.fn() }
			/>
		);

		expect(
			screen.queryByText(
				"Before continuing, please make sure that you're aware of the following:"
			)
		).toBeInTheDocument();
	} );

	it( 'calls `handleSetup` when setup button is clicked', () => {
		Object.defineProperty( window, 'location', {
			configurable: true,
			enumerable: true,
			value: new URL( window.location.href ),
		} );

		render(
			<SetupLivePaymentsModal
				from="bogus"
				source="bogus-again"
				onClose={ () => jest.fn() }
			/>
		);

		user.click(
			screen.getByRole( 'button', {
				name: 'Activate payments',
			} )
		);

		expect( window.location.href ).toBe(
			`https://wcpay.test/connect?wcpay-disable-onboarding-test-mode=true&from=bogus&source=wcpay-setup-live-payments`
		);
	} );
} );
