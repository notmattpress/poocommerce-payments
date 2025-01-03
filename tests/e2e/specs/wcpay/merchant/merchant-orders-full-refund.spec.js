/**
 * External dependencies
 */
import config from 'config';

const { merchant, shopper } = require( '@poocommerce/e2e-utils' );

/**
 * Internal dependencies
 */
import { merchantWCP, takeScreenshot } from '../../../utils';
import { fillCardDetails, setupProductCheckout } from '../../../utils/payments';

let orderId;
let orderAmount;

describe( 'Order > Full refund', () => {
	beforeAll( async () => {
		// Disable multi-currency in the merchant settings. This step is important because local environment setups
		// might have multi-currency enabled. We need to ensure a consistent
		// environment for the test.
		await merchant.login();
		await merchantWCP.deactivateMulticurrency();
		await merchant.logout();

		await shopper.login();
		// Place an order to refund later
		await setupProductCheckout(
			config.get( 'addresses.customer.billing' )
		);
		const card = config.get( 'cards.basic' );
		await fillCardDetails( page, card );
		await shopper.placeOrder();
		await expect( page ).toMatchTextContent( 'Order received' );

		// Get the order ID so we can open it in the merchant view
		const ORDER_RECEIVED_ID_SELECTOR =
			'.poocommerce-order-overview__order.order > strong';
		const orderIdField = await page.$( ORDER_RECEIVED_ID_SELECTOR );
		orderId = await orderIdField.evaluate( ( el ) => el.innerText );

		// Get the order total so we can verify the refund amount
		const ORDER_RECEIVED_AMOUNT_SELECTOR =
			'.poocommerce-order-overview__total .poocommerce-Price-amount';
		const orderTotalField = await page.$( ORDER_RECEIVED_AMOUNT_SELECTOR );
		orderAmount = await orderTotalField.evaluate( ( el ) => el.innerText );

		// Login and open the order
		await merchant.login();
		await merchant.goToOrder( orderId );

		// We need to remove any listeners on the `dialog` event otherwise we can't catch the dialog below
		await page.removeAllListeners( 'dialog' );
	} );

	afterAll( async () => {
		page.removeAllListeners( 'dialog' );
		page.on( 'dialog', async function ( dialog ) {
			try {
				await dialog.accept();
			} catch ( err ) {}
		} );
		await merchant.logout();
	} );

	it( 'should process a full refund for an order', async () => {
		// Click the Refund button
		await expect( page ).toClick( 'button.refund-items' );

		// Verify the refund section shows
		await page.waitForSelector( 'div.wc-order-refund-items', {
			visible: true,
		} );

		// Verify Refund via WooPayments button is displayed
		await page.waitForSelector( 'button.do-api-refund' );

		// Initiate a refund
		await expect( page ).toFill( '.refund_line_total', orderAmount );
		await expect( page ).toFill( '#refund_reason', 'No longer wanted' );

		await expect( page ).toMatchElement( '.do-api-refund', {
			text: `Refund ${ orderAmount } via WooPayments`,
		} );
		await takeScreenshot( 'merchant-orders-full-refund_refunding' );

		const refundDialog = await expect( page ).toDisplayDialog( async () => {
			await expect( page ).toClick( 'button.do-api-refund' );
		} );

		// Accept the refund
		await refundDialog.accept();

		await page.waitForNavigation( { waitUntil: 'networkidle0' } );

		await Promise.all( [
			// Verify the product line item shows the refunded amount
			expect( page ).toMatchElement( '.line_cost .refunded', {
				text: `-${ orderAmount }`,
			} ),

			// Verify the refund shows in the list with the amount
			expect( page ).toMatchElement( '.refund > .line_cost', {
				text: `-${ orderAmount }`,
			} ),

			// Verify system note was added
			expect( page ).toMatchElement( '.system-note', {
				text: `A refund of ${ orderAmount } was successfully processed using WooPayments. Reason: No longer wanted`,
			} ),
		] );
		await takeScreenshot( 'merchant-orders-full-refund_refunded' );
	} );

	it( 'should be able to view a refunded transaction', async () => {
		// Pull out and follow the link to avoid working in multiple tabs
		const paymentDetailsLink = await page.$eval(
			'p.order_number > a',
			( anchor ) => anchor.getAttribute( 'href' )
		);

		await merchantWCP.openPaymentDetails( paymentDetailsLink );
		await takeScreenshot( 'merchant-orders-full-refund_payment-details' );

		// Verify the transaction timeline reflects the refund events
		await Promise.all( [
			expect( page ).toMatchElement( 'li.poocommerce-timeline-item', {
				text: `A payment of ${ orderAmount } was successfully refunded.`,
			} ),
			expect( page ).toMatchElement( 'li.poocommerce-timeline-item', {
				text: 'Payment status changed to Refunded.',
			} ),
		] );
	} );
} );
