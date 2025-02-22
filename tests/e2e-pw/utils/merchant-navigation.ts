/**
 * External dependencies
 */
import { Page } from 'playwright/test';
import { dataHasLoaded } from './merchant';

export const goToOrder = async ( page: Page, orderId: string ) => {
	await page.goto(
		`/wp-admin/admin.php?page=wc-orders&action=edit&id=${ orderId }`,
		{
			waitUntil: 'load',
		}
	);
};

export const goToPaymentDetails = async (
	page: Page,
	paymentIntentId: string
) => {
	await page.goto(
		`/wp-admin/admin.php?page=wc-admin&path=%2Fpayments%2Ftransactions%2Fdetails&id=${ paymentIntentId }`
	);
};

export const goToWooPaymentsSettings = async ( page: Page ) => {
	await page.goto(
		'/wp-admin/admin.php?page=wc-settings&tab=checkout&section=poocommerce_payments'
	);
};

export const goToPooCommerceSettings = async ( page: Page, tab?: string ) => {
	await page.goto(
		'/wp-admin/admin.php?page=wc-settings' + ( tab ? '&tab=' + tab : '' )
	);
};

export const goToOptionsPage = async ( page: Page ) => {
	await page.goto( '/wp-admin/options.php', {
		waitUntil: 'load',
	} );
};

export const goToActionScheduler = async (
	page: Page,
	status?: string,
	search?: string
) => {
	let pageUrl = '/wp-admin/tools.php?page=action-scheduler';
	if ( status ) {
		pageUrl += `&status=${ status }`;
	}
	if ( search ) {
		pageUrl += `&s=${ search }`;
	}
	await page.goto( pageUrl, {
		waitUntil: 'load',
	} );
};

export const goToOrderAnalytics = async ( page: Page ) => {
	await page.goto(
		'/wp-admin/admin.php?page=wc-admin&path=%2Fanalytics%2Forders',
		{ waitUntil: 'load' }
	);
	await dataHasLoaded( page );
};

export const goToTransactions = async ( page: Page ) => {
	await page.goto(
		'/wp-admin/admin.php?page=wc-admin&path=%2Fpayments%2Ftransactions',
		{ waitUntil: 'load' }
	);
	await dataHasLoaded( page );
};

export const goToMultiCurrencySettings = async ( page: Page ) => {
	await page.goto(
		'/wp-admin/admin.php?page=wc-settings&tab=wcpay_multi_currency',
		{ waitUntil: 'load' }
	);
	await dataHasLoaded( page );
};

export const goToWidgets = async ( page: Page ) => {
	await page.goto( '/wp-admin/widgets.php', {
		waitUntil: 'load',
	} );
};

export const goToNewPost = async ( page: Page ) => {
	await page.goto( '/wp-admin/post-new.php', {
		waitUntil: 'load',
	} );
};

export const goToThemes = async ( page: Page ) => {
	await page.goto( '/wp-admin/themes.php', {
		waitUntil: 'load',
	} );
};

export const goToMultiCurrencyOnboarding = async ( page: Page ) => {
	await page.goto(
		'/wp-admin/admin.php?page=wc-admin&path=%2Fpayments%2Fmulti-currency-setup',
		{ waitUntil: 'load' }
	);
	await dataHasLoaded( page );
};

export const goToConnect = async ( page: Page ) => {
	await page.goto(
		'/wp-admin/admin.php?page=wc-admin&path=/payments/connect'
	);
	await dataHasLoaded( page );
};

export const goToSubscriptions = async ( page: Page ) =>
	await page.goto( '/wp-admin/admin.php?page=wc-orders--shop_subscription', {
		waitUntil: 'load',
	} );

export const goToSubscriptionPage = async (
	page: Page,
	subscriptionId: number
) => {
	await goToSubscriptions( page );
	const orderRow = page.locator(
		'tr#order-' + subscriptionId + ' .order_title a:nth-child(1)'
	);
	orderRow.evaluate( ( el: HTMLLinkElement ) => el.click() );
	await dataHasLoaded( page );
};
