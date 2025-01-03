/**
 * External dependencies
 */
const { merchant } = require( '@poocommerce/e2e-utils' );

/**
 * Internal dependencies
 */
import { merchantWCP } from '../../../utils/flows';

describe( 'Admin disputes', () => {
	beforeAll( async () => {
		await merchant.login();
	} );

	it( 'page should load without any errors', async () => {
		await merchantWCP.openDisputes();
		await expect( page ).toMatchElement( 'h2', { text: 'Disputes' } );
	} );
} );
