/**
 * External dependencies
 */
import { test, expect, Page } from '@playwright/test';
/**
 * Internal dependencies
 */
import { useMerchant } from '../../../utils/helpers';
import {
	activateMulticurrency,
	addMulticurrencyWidget,
	deactivateMulticurrency,
	disableAllEnabledCurrencies,
	removeMultiCurrencyWidgets,
	restoreCurrencies,
} from '../../../utils/merchant';
import * as navigation from '../../../utils/merchant-navigation';

test.describe( 'Multi-currency', { tag: '@critical' }, () => {
	let wasMulticurrencyEnabled: boolean;
	let page: Page;

	// Use the merchant user for this test suite.
	useMerchant();

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage();
		wasMulticurrencyEnabled = await activateMulticurrency( page );

		await disableAllEnabledCurrencies( page );
	} );

	test.afterAll( async ( {}, { project } ) => {
		await restoreCurrencies( page );
		await removeMultiCurrencyWidgets( project.use.baseURL );
		if ( ! wasMulticurrencyEnabled ) {
			await deactivateMulticurrency( page );
		}
		await page.close();
	} );

	test( 'page load without any errors', async () => {
		await navigation.goToMultiCurrencySettings( page );
		await expect(
			page.getByRole( 'heading', { name: 'Enabled currencies' } )
		).toBeVisible();
		await expect( page.getByText( 'Default currency' ) ).toBeVisible();
		// TODO: fix flaky visual regression test.
		// await expect(
		// 	page.locator( '.multi-currency-settings' ).last()
		// ).toHaveScreenshot();
	} );

	test( 'add the currency switcher to the sidebar', async () => {
		await addMulticurrencyWidget( page );
	} );

	test( 'can add the currency switcher to a post/page', async () => {
		await navigation.goToNewPost( page );

		if ( await page.getByRole( 'button', { name: 'Close' } ).isVisible() ) {
			await page.getByRole( 'button', { name: 'Close' } ).click();
		}

		if ( await page.locator( '[name="editor-canvas"]' ).isVisible() ) {
			await expect(
				page.locator( '[name="editor-canvas"]' )
			).toBeAttached();
			const editor = page
				.locator( '[name="editor-canvas"]' )
				.contentFrame();
			await editor.getByRole( 'button', { name: 'Add block' } ).click();
		} else {
			// Fallback for WC 7.7.0.
			await page.getByRole( 'button', { name: 'Add block' } ).click();
		}

		await page
			.locator( 'input[placeholder="Search"]' )
			.pressSequentially( 'switcher', { delay: 20 } );
		await expect(
			page.getByRole( 'option', { name: 'Currency Switcher Block' } )
		).toBeVisible();
	} );
} );
