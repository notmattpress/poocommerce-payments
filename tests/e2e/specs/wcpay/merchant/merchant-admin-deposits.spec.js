/**
 * External dependencies
 */
const { merchant } = require( '@poocommerce/e2e-utils' );

/**
 * Internal dependencies
 */
import { merchantWCP, takeScreenshot } from '../../../utils';

describe( 'Admin deposits', () => {
	beforeAll( async () => {
		await merchant.login();
	} );

	it( 'page should load without any errors', async () => {
		await merchantWCP.openDeposits();
		await expect( page ).toMatchElement( 'h2', {
			text: 'Payout history',
		} );
		await takeScreenshot( 'merchant-admin-deposits' );
	} );
} );
