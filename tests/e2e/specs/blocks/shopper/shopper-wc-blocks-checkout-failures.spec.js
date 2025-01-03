/* eslint-disable jest/no-test-prefixes */

/**
 * External dependencies
 */
import config from 'config';

const { shopper, merchant, uiUnblocked } = require( '@poocommerce/e2e-utils' );

/**
 * Internal dependencies
 */
import {
	shopperWCP,
	merchantWCP,
	describeif,
	checkPageExists,
	RUN_WC_BLOCKS_TESTS,
} from '../../../utils';

const billingDetails = config.get( 'addresses.customer.billing' );
const productName = config.get( 'products.simple.name' );

import {
	fillCardDetailsWCB,
	confirmCardAuthentication,
} from '../../../utils/payments';

describeif( RUN_WC_BLOCKS_TESTS )(
	'PooCommerce Blocks > Checkout failures',
	() => {
		beforeAll( async () => {
			// Check whether block checkout page exists & create if required
			try {
				await checkPageExists( 'checkout-wcb' );
			} catch ( error ) {
				await merchant.login();
				await merchantWCP.addNewPageCheckoutWCB();
				await merchant.logout();
			}

			await shopper.goToShop();
			await shopperWCP.addToCartFromShopPage( productName );
			await shopperWCP.openCheckoutWCB();
			await shopperWCP.fillBillingDetailsWCB( billingDetails );
			await page.waitForSelector(
				'.wc-block-components-main button:not(:disabled)'
			);
		} );

		afterEach( async () => {
			await page.reload( { waitUntil: 'networkidle0' } );
		} );

		afterAll( async () => {
			// Clear the cart at the end so it's ready for another test
			await shopperWCP.emptyCart();
		} );

		it( 'should throw an error that the card was simply declined', async () => {
			const declinedCard = config.get( 'cards.declined' );
			await fillCardDetailsWCB( page, declinedCard );
			await expect( page ).toClick( 'button > span', {
				text: 'Place Order',
			} );
			await uiUnblocked();
			await page.waitForSelector(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content'
			);
			await expect( page ).toMatchElement(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content',
				{
					text: 'Your card was declined.',
				}
			);
		} );

		it( 'should throw an error that the card expiration date is in the past', async () => {
			const cardInvalidExpDate = config.get( 'cards.invalid-exp-date' );
			await fillCardDetailsWCB( page, cardInvalidExpDate );
			await expect( page ).toClick( 'button > span', {
				text: 'Place Order',
			} );
			await uiUnblocked();
			await page.waitForSelector(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content'
			);
			await expect( page ).toMatchElement(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content',
				{
					text: "Your card's expiration year is in the past.",
				}
			);
		} );

		it( 'should throw an error that the card CVV number is invalid', async () => {
			const cardInvalidCVV = config.get( 'cards.invalid-cvv-number' );
			await fillCardDetailsWCB( page, cardInvalidCVV );
			await expect( page ).toClick( 'button > span', {
				text: 'Place Order',
			} );
			await uiUnblocked();
			await page.waitForSelector(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content'
			);
			await expect(
				page
			).toMatchElement(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content',
				{ text: "Your card's security code is incomplete." }
			);
		} );

		it( 'should throw an error that the card was declined due to insufficient funds', async () => {
			const cardInsufficientFunds = config.get( 'cards.declined-funds' );
			await fillCardDetailsWCB( page, cardInsufficientFunds );
			await expect( page ).toClick( 'button > span', {
				text: 'Place Order',
			} );
			await uiUnblocked();
			await page.waitForSelector(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content'
			);
			await expect( page ).toMatchElement(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content',
				{
					text: 'Your card has insufficient funds.',
				}
			);
		} );

		it( 'should throw an error that the card was declined due to expired card', async () => {
			const cardExpired = config.get( 'cards.declined-expired' );
			await fillCardDetailsWCB( page, cardExpired );
			await expect( page ).toClick( 'button > span', {
				text: 'Place Order',
			} );
			await uiUnblocked();
			await page.waitForSelector(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content'
			);
			await expect( page ).toMatchElement(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content',
				{
					text: 'Your card has expired.',
				}
			);
		} );

		it( 'should throw an error that the card was declined due to incorrect CVC number', async () => {
			const cardIncorrectCVC = config.get( 'cards.declined-cvc' );
			await fillCardDetailsWCB( page, cardIncorrectCVC );
			await expect( page ).toClick( 'button > span', {
				text: 'Place Order',
			} );
			await uiUnblocked();
			await page.waitForSelector(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content'
			);
			await expect( page ).toMatchElement(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content',
				{
					text: "Your card's security code is incorrect.",
				}
			);
		} );

		it( 'should throw an error that the card was declined due to processing error', async () => {
			const cardProcessingError = config.get(
				'cards.declined-processing'
			);
			await fillCardDetailsWCB( page, cardProcessingError );
			await expect( page ).toClick( 'button > span', {
				text: 'Place Order',
			} );
			await uiUnblocked();
			await page.waitForSelector(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content'
			);
			await expect( page ).toMatchElement(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content',
				{
					text:
						'An error occurred while processing your card. Try again in a little bit.',
				}
			);
		} );

		it( 'should throw an error that the card was declined due to incorrect card number', async () => {
			const cardIncorrectNumber = config.get(
				'cards.declined-incorrect'
			);
			await fillCardDetailsWCB( page, cardIncorrectNumber );
			await expect( page ).toClick( 'button > span', {
				text: 'Place Order',
			} );
			await uiUnblocked();
			await page.waitForSelector(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content'
			);
			// Verify the error message
			await expect( page ).toMatchElement(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content',
				{
					text: 'Your card number is invalid.',
				}
			);
		} );

		it( 'should throw an error that the card was declined due to invalid 3DS card', async () => {
			const declinedCard = config.get( 'cards.declined-3ds' );
			await fillCardDetailsWCB( page, declinedCard );
			await expect( page ).toClick( 'button > span', {
				text: 'Place Order',
			} );
			await confirmCardAuthentication( page );
			await page.waitForSelector(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content'
			);
			const declined3dsCardError = await page.$eval(
				'div.wc-block-components-notices > .wc-block-store-notice > .wc-block-components-notice-banner__content',
				( el ) => el.innerText
			);
			await expect( page ).toMatchTextContent(
				declined3dsCardError,
				'Your card was declined.'
			);
		} );
	}
);
