/**
 * External dependencies
 */
import { describeif, RUN_SUBSCRIPTIONS_TESTS } from '../../../utils';

const { merchant } = require( '@poocommerce/e2e-utils' );

describeif( RUN_SUBSCRIPTIONS_TESTS )(
	'PooCommerce > Settings > Subscriptions',
	() => {
		beforeAll( async () => {
			await merchant.login();
		} );
		afterAll( async () => {
			await merchant.logout();
		} );

		it( 'should be able to load PooCommerce Subscriptions Settings tab', async () => {
			await merchant.openSettings( 'subscriptions' );
			await expect( page ).toMatchElement( 'a.nav-tab-active', {
				text: 'Subscriptions',
			} );
		} );
	}
);
