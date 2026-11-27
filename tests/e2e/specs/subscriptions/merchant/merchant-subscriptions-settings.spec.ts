/**
 * External dependencies
 */
import test, { expect } from 'playwright/test';
import { describeif, useMerchant } from '../../../utils/helpers';
import { shouldRunSubscriptionsTests } from '../../../utils/constants';
import { goToPooCommerceSettings } from '../../../utils/merchant-navigation';

describeif( shouldRunSubscriptionsTests )(
	'PooCommerce > Settings > Subscriptions',
	() => {
		useMerchant();
		test( 'Merchant should be able to load PooCommerce Subscriptions settings tab', async ( {
			page,
		} ) => {
			await goToPooCommerceSettings( page, 'subscriptions' );
			const menuItem = page.getByRole( 'main' ).getByRole( 'link', {
				name: 'Subscriptions',
				exact: true,
			} );
			await expect( menuItem ).toBeVisible();

			// An alternative way to verify the subscriptions menu page is active, avoiding the active tab classname.
			const heading = await page
				.getByRole( 'heading', {
					name: 'Subscriptions',
				} )
				.first();
			await expect( heading ).toBeVisible();
		} );
	}
);
