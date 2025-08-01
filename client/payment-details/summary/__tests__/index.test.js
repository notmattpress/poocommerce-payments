/** @format */
/**
 * External dependencies
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import moment from 'moment';

/**
 * Internal dependencies
 */
import PaymentDetailsSummary from '../';
import { useAuthorization } from 'wcpay/data';
import { paymentIntentMock } from 'wcpay/data/payment-intents/test/hooks';
import WCPaySettingsContext from 'wcpay/settings/wcpay-settings-context';

// Mock dateI18n
jest.mock( '@wordpress/date', () => ( {
	dateI18n: jest.fn( ( format, date ) => {
		return jest
			.requireActual( '@wordpress/date' )
			.dateI18n( format, date, 'UTC' ); // Ensure UTC is used
	} ),
} ) );

const mockDisputeDoAccept = jest.fn();

jest.mock( 'wcpay/data', () => ( {
	useAuthorization: jest.fn( () => ( {
		authorization: null,
	} ) ),
	useDisputeAccept: jest.fn( () => ( {
		doAccept: mockDisputeDoAccept,
		isLoading: false,
	} ) ),
} ) );

jest.mock( '@wordpress/data', () => ( {
	createRegistryControl: jest.fn(),
	dispatch: jest.fn( () => ( {
		setIsMatching: jest.fn(),
		onLoad: jest.fn(),
	} ) ),
	registerStore: jest.fn(),
	select: jest.fn(),
	useDispatch: jest.fn( () => ( {
		createErrorNotice: jest.fn(),
	} ) ),
	useSelect: jest.fn( () => ( { getNotices: jest.fn() } ) ),
	withDispatch: jest.fn( () => jest.fn() ),
	withSelect: jest.fn( () => jest.fn() ),
} ) );

const mockUseAuthorization = useAuthorization;

const getBaseCharge = () => ( {
	id: 'ch_38jdHA39KKA',
	payment_intent: 'pi_abc',
	/* Stripe data comes in seconds, instead of the default Date milliseconds */
	created: 1568913840,
	amount: 2000,
	amount_refunded: 0,
	application_fee_amount: 70,
	disputed: false,
	dispute: null,
	currency: 'usd',
	type: 'charge',
	status: 'succeeded',
	paid: true,
	captured: true,
	balance_transaction: {
		amount: 2000,
		currency: 'usd',
		fee: 70,
	},
	refunds: {
		data: [],
	},
	order: {
		number: 45981,
		url: 'https://somerandomorderurl.com/?edit_order=45981',
	},
	billing_details: {
		name: 'Customer name',
		email: 'mock@example.com',
	},
	payment_method_details: {
		card: {
			brand: 'visa',
			last4: '4242',
		},
		type: 'card',
	},
	outcome: {
		risk_level: 'normal',
	},
} );

const getBaseDispute = () => ( {
	id: 'dp_1',
	amount: 2000,
	charge: 'ch_38jdHA39KKA',
	order: null,
	balance_transactions: [
		{
			amount: -2000,
			currency: 'usd',
			fee: 1500,
			reporting_category: 'dispute',
		},
	],
	created: 1693453017,
	currency: 'usd',
	evidence: {
		billing_address: '123 test address',
		customer_email_address: 'test@email.com',
		customer_name: 'Test customer',
		shipping_address: '123 test address',
	},
	evidence_details: {
		due_by: 1694303999,
		has_evidence: false,
		past_due: false,
		submission_count: 0,
	},
	issuer_evidence: null,
	metadata: {},
	payment_intent: 'pi_1',
	reason: 'fraudulent',
	status: 'needs_response',
} );

const createTapToPayMetadata = ( readerModel, platform ) => ( {
	platform,
	reader_id: 'APPLEBUILTINSIMULATOR-1',
	reader_model: readerModel,
} );

function renderCharge( charge, metadata = {}, isLoading = false, props = {} ) {
	const { container } = render(
		<WCPaySettingsContext.Provider value={ global.wcpaySettings }>
			<PaymentDetailsSummary
				charge={ charge }
				metadata={ metadata }
				isLoading={ isLoading }
				{ ...props }
			/>
		</WCPaySettingsContext.Provider>
	);
	return container;
}

// Add this helper function to expand the accordion
const expandAccordion = ( title ) => {
	const accordionTitle = screen.getByText( title, {
		selector: '.wcpay-accordion__title-content',
	} );
	fireEvent.click( accordionTitle );
};

describe( 'PaymentDetailsSummary', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		global.wcpaySettings = {
			accountStatus: {
				country: 'US',
			},
			isSubscriptionsActive: false,
			shouldUseExplicitPrice: false,
			zeroDecimalCurrencies: [ 'jpy' ],
			connect: {
				country: 'US',
			},
			featureFlags: {
				isAuthAndCaptureEnabled: true,
			},
			currencyData: {
				US: {
					code: 'USD',
					symbol: '$',
					symbolPosition: 'left',
					thousandSeparator: ',',
					decimalSeparator: '.',
					precision: 2,
				},
				JP: {
					code: 'JPY',
					symbol: '¥',
					symbolPosition: 'left',
					thousandSeparator: ',',
					decimalSeparator: '.',
					precision: 0,
				},
			},
			dateFormat: 'M j, Y',
			timeFormat: 'g:ia',
		};

		// mock Date.now that moment library uses to get current date for testing purposes
		Date.now = jest.fn( () =>
			new Date( '2023-09-08T12:33:37.000Z' ).getTime()
		);
	} );

	afterEach( () => {
		Date.now = () => new Date().getTime();
	} );

	test( 'correctly renders a charge', () => {
		expect( renderCharge( getBaseCharge() ) ).toMatchSnapshot();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		expect( console ).toHaveWarnedWith(
			// eslint-disable-next-line max-len
			'List with items prop is deprecated is deprecated and will be removed in version 9.0.0. Note: See ExperimentalList / ExperimentalListItem for the new API that will replace this component in future versions.'
		);
	} );

	test( 'correctly renders when payment intent is missing', () => {
		const baseCharge = getBaseCharge();
		baseCharge.payment_intent = null;
		expect( renderCharge( baseCharge ) ).toMatchSnapshot();
	} );

	test( 'renders partially refunded information for a charge', () => {
		const charge = getBaseCharge();
		charge.refunded = false;
		charge.amount_refunded = 1200;
		charge.refunds?.data.push( {
			balance_transaction: {
				amount: -charge.amount_refunded,
				currency: 'usd',
			},
		} );

		expect( renderCharge( charge ) ).toMatchSnapshot();
	} );

	test( 'renders fully refunded information for a charge', () => {
		const charge = getBaseCharge();
		charge.refunded = true;
		charge.amount_refunded = 2000;
		charge.refunds?.data.push( {
			balance_transaction: {
				amount: -charge.amount_refunded,
				currency: 'usd',
			},
		} );

		const container = renderCharge( charge );
		screen.getByText( /Refunded: -\$20.00/i );
		expect( container ).toMatchSnapshot();
	} );

	test( 'renders the Tap to Pay channel from metadata with ios COTS_DEVICE', () => {
		const charge = getBaseCharge();
		const metadata = createTapToPayMetadata( 'COTS_DEVICE', 'ios' );

		expect( renderCharge( charge, metadata ) ).toMatchSnapshot();
	} );

	test( 'renders the Tap to Pay channel from metadata with android TAP_TO_PAY_DEVICE', () => {
		const charge = getBaseCharge();
		const metadata = createTapToPayMetadata(
			'TAP_TO_PAY_DEVICE',
			'android'
		);

		expect( renderCharge( charge, metadata ) ).toMatchSnapshot();
	} );

	test( 'renders a charge with subscriptions', () => {
		global.wcpaySettings.isSubscriptionsActive = true;

		const charge = getBaseCharge();
		if ( charge.order ) {
			charge.order.subscriptions = [
				{
					number: 'custom-246',
					url: 'https://example.com/subscription/246',
				},
			];
		}

		expect( renderCharge( charge ) ).toMatchSnapshot();
	} );

	test( 'renders loading state', () => {
		expect( renderCharge( {}, true ) ).toMatchSnapshot();
	} );

	describe( 'capture notification and fraud buttons', () => {
		beforeAll( () => {
			// Mock current date and time to fixed value in moment
			const fixedCurrentDate = new Date( '2023-01-01T01:00:00.000Z' );
			jest.spyOn( Date, 'now' ).mockImplementation( () =>
				fixedCurrentDate.getTime()
			);
		} );

		afterAll( () => {
			jest.spyOn( Date, 'now' ).mockRestore();
		} );

		test( 'renders capture section correctly', () => {
			mockUseAuthorization.mockReturnValueOnce( {
				authorization: {
					captured: false,
					charge_id: 'ch_mock',
					amount: 1000,
					currency: 'usd',
					created: moment.utc().format(),
					order_id: 123,
					risk_level: 1,
					customer_country: 'US',
					customer_email: 'test@example.com',
					customer_name: 'Test Customer',
					payment_intent_id: 'pi_mock',
				},
				isLoading: false,
				isRequesting: false,
				doCaptureAuthorization: jest.fn(),
				doCancelAuthorization: jest.fn(),
			} );
			const charge = getBaseCharge();
			charge.captured = false;

			const container = renderCharge( charge );

			expect(
				screen.getByRole( 'button', { name: /Capture/i } )
			).toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );

		test( 'renders the fraud outcome buttons', () => {
			mockUseAuthorization.mockReturnValueOnce( {
				authorization: {
					captured: false,
					charge_id: 'ch_mock',
					amount: 1000,
					currency: 'usd',
					created: new Date( Date.now() ).toISOString(),
					order_id: 123,
					risk_level: 1,
					customer_country: 'US',
					customer_email: 'test@example.com',
					customer_name: 'Test Customer',
					payment_intent_id: 'pi_mock',
				},
				isLoading: false,
				isRequesting: false,
				doCaptureAuthorization: jest.fn(),
				doCancelAuthorization: jest.fn(),
			} );
			const charge = getBaseCharge();
			charge.captured = false;

			const container = renderCharge( charge, {}, false, {
				paymentIntent: paymentIntentMock,
			} );

			expect(
				screen.getByRole( 'button', { name: /Approve Transaction/i } )
			).toBeInTheDocument();

			expect(
				screen.getByRole( 'button', { name: /Block Transaction/i } )
			).toBeInTheDocument();

			expect(
				screen.queryByRole( 'button', { name: /Capture/i } )
			).not.toBeInTheDocument();

			expect(
				screen.getByText(
					/Approving this transaction will capture the charge./
				)
			).toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );
	} );

	test( 'renders the information of a disputed charge', () => {
		const charge = getBaseCharge();
		charge.disputed = true;
		charge.dispute = getBaseDispute();
		charge.dispute.status = 'needs_response';

		renderCharge( charge );

		// Dispute Notice
		screen.getByText(
			/The cardholder claims this is an unauthorized transaction/,
			{ ignore: '.a11y-speak-region' }
		);

		// Don't render the staged evidence message
		expect(
			screen.queryByText( /You initiated a challenge to this dispute/, {
				ignore: '.a11y-speak-region',
			} )
		).toBeNull();

		// Expand the steps accordion
		expandAccordion( 'Steps you can take' );

		// Steps to resolve
		screen.getByText( /Steps you can take/i, {
			selector: '.wcpay-accordion__title-content',
		} );

		screen.getByText( /Contact your customer/i, {
			selector: '.dispute-steps__item-name',
		} );
		screen.getByText( /Ask for the dispute to be withdrawn/i, {
			selector: '.dispute-steps__item-name',
		} );
		screen.getByText( /Challenge or accept the dispute/i, {
			selector: '.dispute-steps__item-name',
		} );

		screen.getByText(
			/Identify the issue and work towards a resolution where possible\./i,
			{ selector: '.dispute-steps__item-description' }
		);
		screen.getByText(
			/If you've managed to resolve the issue with your customer, help them with the withdrawal of their dispute\./i,
			{ selector: '.dispute-steps__item-description' }
		);
		screen.getByText(
			// eslint-disable-next-line max-len
			/Disagree with the dispute\? You can challenge it with the customer's bank\. Otherwise, accept it to close the case — the order amount and dispute fee won't be refunded\./i,
			{ selector: '.dispute-steps__item-description' }
		);
		screen.getByRole( 'link', { name: /Email customer/i } );
		expect(
			screen.getAllByRole( 'link', { name: /Learn more/i } ).length
		).toBe( 2 );

		// Actions
		screen.getByRole( 'button', {
			name: /Challenge dispute/,
		} );
		screen.getByRole( 'button', {
			name: /Accept dispute/,
		} );

		// Refund menu is not rendered
		expect(
			screen.queryByRole( 'button', {
				name: /Transaction actions/i,
			} )
		).toBeNull();
	} );

	test( 'renders the information of a disputed charge when the store/charge currency differ', () => {
		// True when multi-currency is enabled.
		global.wcpaySettings.shouldUseExplicitPrice = true;

		// In this case, charge currency is JPY, but store currency is NOK.
		const charge = getBaseCharge();
		charge.currency = 'jpy';
		charge.amount = 10000;
		charge.balance_transaction = {
			amount: 72581,
			currency: 'nok',
			reporting_category: 'charge',
			fee: 4152,
		};
		charge.disputed = true;
		charge.dispute = getBaseDispute();
		charge.dispute.status = 'needs_response';
		charge.dispute.amount = 10000;
		charge.dispute.currency = 'jpy';
		charge.dispute.balance_transactions = [
			{
				amount: -72581,
				currency: 'nok',
				fee: 15000,
				reporting_category: 'dispute',
			},
		];
		renderCharge( charge );

		// Disputed amount should show the shopper/transaction currency.
		expect(
			screen.getByText( /Dispute Amount/i ).nextSibling
		).toHaveTextContent( /¥10,000 JPY/i );
	} );

	test( 'renders the information of a dispute-reversal charge', () => {
		const charge = getBaseCharge();
		charge.disputed = true;
		charge.dispute = getBaseDispute();
		charge.dispute.status = 'won';

		charge.dispute.balance_transactions = [
			{
				amount: -2000,
				fee: 1500,
				currency: 'usd',
				reporting_category: 'dispute',
			},
			{
				amount: 2000,
				fee: -1500,
				currency: 'usd',
				reporting_category: 'dispute_reversal',
			},
		];

		const container = renderCharge( charge );
		expect(
			screen.queryByText( /Deducted: \$-15.00/i )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', {
				name: /Fee breakdown/i,
			} )
		).not.toBeInTheDocument();
		expect( container ).toMatchSnapshot();
	} );

	test( 'renders the fee breakdown tooltip of a disputed charge', () => {
		const charge = {
			...getBaseCharge(),
			currency: 'jpy',
			amount: 10000,
			balance_transaction: {
				amount: 2000,
				currency: 'usd',
				fee: 70,
			},
			disputed: true,
			dispute: {
				...getBaseDispute(),
				amount: 10000,
				status: 'under_review',
				balance_transactions: [
					{
						amount: -1500,
						fee: 1500,
						currency: 'usd',
						reporting_category: 'dispute',
					},
				],
			},
		};

		renderCharge( charge );

		// Open tooltip content
		const tooltipButton = screen.getByRole( 'button', {
			name: /Fee breakdown/i,
		} );
		userEvent.click( tooltipButton );

		// Check fee breakdown calculated correctly
		const tooltipContent = screen.getByRole( 'tooltip' );
		expect(
			within( tooltipContent ).getByLabelText( /Transaction fee/ )
		).toHaveTextContent( /\$0.70/ );

		expect(
			within( tooltipContent ).getByLabelText( /Dispute fee/ )
		).toHaveTextContent( /\$15.00/ );

		expect(
			within( tooltipContent ).getByLabelText( /Total fees/ )
		).toHaveTextContent( /\$15.70/ );
	} );

	test( 'renders the information of an inquiry when the store/charge currency differ', () => {
		// True when multi-currency is enabled.
		global.wcpaySettings.shouldUseExplicitPrice = true;

		// In this case, charge currency is JPY, but store currency is NOK.
		const charge = getBaseCharge();
		charge.currency = 'jpy';
		charge.amount = 10000;
		charge.balance_transaction = {
			amount: 72581,
			currency: 'nok',
			reporting_category: 'charge',
			fee: 4152,
		};
		charge.disputed = true;
		charge.dispute = getBaseDispute();
		charge.dispute.status = 'warning_needs_response';
		charge.dispute.amount = 10000;
		charge.dispute.currency = 'jpy';
		// Inquiries don't have balance transactions.
		charge.dispute.balance_transactions = [];
		renderCharge( charge );

		// Disputed amount should show the shopper/transaction currency.
		expect(
			screen.getByText( /Dispute Amount/i ).nextSibling
		).toHaveTextContent( /¥10,000 JPY/i );
	} );

	test( 'correctly renders dispute details for a dispute with staged evidence', () => {
		const charge = getBaseCharge();
		charge.disputed = true;
		charge.dispute = getBaseDispute();
		charge.dispute.status = 'needs_response';
		charge.dispute.evidence_details = {
			has_evidence: true,
			due_by: 1694303999,
			past_due: false,
			submission_count: 0,
		};

		renderCharge( charge );

		screen.getByText(
			/The cardholder claims this is an unauthorized transaction/,
			{ ignore: '.a11y-speak-region' }
		);

		// Render the staged evidence message
		screen.getByText( /You initiated a challenge to this dispute/, {
			ignore: '.a11y-speak-region',
		} );

		screen.getByRole( 'button', {
			name: /Continue with challenge/,
		} );
	} );

	test( 'correctly renders the accept dispute modal and accepts', () => {
		const charge = getBaseCharge();
		charge.disputed = true;
		charge.dispute = getBaseDispute();
		charge.dispute.status = 'needs_response';

		renderCharge( charge );

		const openModalButton = screen.getByRole( 'button', {
			name: /Accept dispute/,
		} );

		// Open the modal
		openModalButton.click();

		screen.getByRole( 'heading', {
			name: /Accept the dispute?/,
		} );
		screen.getByText( /\$15.00 dispute fee/, {
			ignore: '.a11y-speak-region',
		} );

		screen.getByRole( 'button', {
			name: /Cancel/,
		} );
		const acceptButton = screen.getByRole( 'button', {
			name: /Accept dispute/,
		} );

		// Accept the dispute
		acceptButton.click();

		expect( mockDisputeDoAccept ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'navigates to the dispute challenge screen when the challenge button is clicked', () => {
		const charge = getBaseCharge();
		charge.disputed = true;
		charge.dispute = getBaseDispute();
		charge.dispute.status = 'needs_response';
		charge.dispute.id = 'dp_test123';

		renderCharge( charge );

		const challengeButton = screen.getByRole( 'button', {
			name: /Challenge dispute/,
		} );

		challengeButton.click();

		expect( window.location.href ).toContain(
			`admin.php?page=wc-admin&path=%2Fpayments%2Fdisputes%2Fchallenge&id=${ charge.dispute.id }`
		);
	} );

	test( 'correctly renders dispute details for "won" disputes', () => {
		const charge = getBaseCharge();
		charge.disputed = true;
		charge.dispute = getBaseDispute();
		charge.dispute.status = 'won';
		charge.dispute.metadata.__evidence_submitted_at = '1693400000';
		renderCharge( charge );

		screen.getByText( /Good news — you've won this dispute/i, {
			ignore: '.a11y-speak-region',
		} );
		screen.getByRole( 'button', { name: /View dispute details/i } );

		// No actions or steps rendered
		expect( screen.queryByText( /Steps to resolve/i ) ).toBeNull();
		expect(
			screen.queryByRole( 'button', {
				name: /Challenge/i,
			} )
		).toBeNull();
		expect(
			screen.queryByRole( 'button', {
				name: /Accept/i,
			} )
		).toBeNull();

		// Refund menu is rendered
		screen.getByRole( 'button', {
			name: /Transaction actions/i,
		} );
	} );

	test( 'correctly renders dispute details for "under_review" disputes', () => {
		const charge = getBaseCharge();
		charge.disputed = true;
		charge.dispute = getBaseDispute();
		charge.dispute.status = 'under_review';
		charge.dispute.metadata.__evidence_submitted_at = '1693400000';

		renderCharge( charge );

		screen.getByText(
			/The customer's bank is currently reviewing the evidence you submitted/i,
			{
				ignore: '.a11y-speak-region',
			}
		);
		screen.getByRole( 'button', { name: /View submitted evidence/i } );

		// No actions or steps rendered
		expect( screen.queryByText( /Steps to resolve/i ) ).toBeNull();
		expect(
			screen.queryByRole( 'button', {
				name: /Challenge/i,
			} )
		).toBeNull();
		expect(
			screen.queryByRole( 'button', {
				name: /Accept/i,
			} )
		).toBeNull();

		// Refund menu is not rendered
		expect(
			screen.queryByRole( 'button', {
				name: /Transaction actions/i,
			} )
		).toBeNull();
	} );

	test( 'correctly renders dispute details for "accepted" disputes', () => {
		const charge = getBaseCharge();
		charge.disputed = true;
		charge.dispute = getBaseDispute();
		charge.dispute.status = 'lost';
		charge.dispute.metadata.__closed_by_merchant = '1';
		charge.dispute.metadata.__dispute_closed_at = '1693453017';

		renderCharge( charge );

		screen.getByText( /You accepted this dispute/i, {
			ignore: '.a11y-speak-region',
		} );
		// Check for the correct fee amount
		screen.getByText( /\$15.00 fee/i, {
			ignore: '.a11y-speak-region',
		} );

		// No actions or steps rendered
		expect( screen.queryByText( /Steps to resolve/i ) ).toBeNull();
		expect(
			screen.queryByRole( 'button', {
				name: /Challenge/i,
			} )
		).toBeNull();
		expect(
			screen.queryByRole( 'button', {
				name: /Accept/i,
			} )
		).toBeNull();

		// Refund menu is not rendered
		expect(
			screen.queryByRole( 'button', {
				name: /Transaction actions/i,
			} )
		).toBeNull();
	} );

	test( 'correctly renders dispute details for "lost" disputes', () => {
		const charge = getBaseCharge();
		charge.disputed = true;
		charge.dispute = getBaseDispute();
		charge.dispute.status = 'lost';
		charge.dispute.metadata.__evidence_submitted_at = '1693400000';
		charge.dispute.metadata.__dispute_closed_at = '1693453017';

		renderCharge( charge );

		screen.getByText( /Unfortunately, you've lost this dispute/i, {
			ignore: '.a11y-speak-region',
		} );
		// Check for the correct fee amount
		screen.getByText( /\$15.00 fee/i, {
			ignore: '.a11y-speak-region',
		} );
		screen.getByRole( 'button', { name: /View dispute details/i } );

		// No actions or steps rendered
		expect( screen.queryByText( /Steps to resolve/i ) ).toBeNull();
		expect(
			screen.queryByRole( 'button', {
				name: /Challenge/i,
			} )
		).toBeNull();
		expect(
			screen.queryByRole( 'button', {
				name: /Accept/i,
			} )
		).toBeNull();

		// Refund menu is not rendered
		expect(
			screen.queryByRole( 'button', {
				name: /Transaction actions/i,
			} )
		).toBeNull();
	} );

	test( 'correctly renders dispute details for "warning_needs_response" inquiry disputes', () => {
		const charge = getBaseCharge();
		charge.disputed = true;
		charge.dispute = getBaseDispute();
		charge.dispute.status = 'warning_needs_response';

		renderCharge( charge );

		// Dispute Notice
		screen.getByText(
			/The cardholder claims this is an unauthorized transaction/,
			{ ignore: '.a11y-speak-region' }
		);

		// Expand the steps accordion
		expandAccordion( 'Steps you can take' );

		// Steps to resolve
		screen.getByText( /Steps you can take/i, {
			selector: '.wcpay-accordion__title-content',
		} );
		screen.getByRole( 'link', {
			name: /Email customer/i,
		} );
		screen.getByText( /Submit evidence or issue a refund/i );

		// Actions
		screen.getByRole( 'button', {
			name: /Submit evidence$/i,
		} );
		screen.getByRole( 'button', {
			name: /Issue refund/i,
		} );

		// Refund menu is rendered
		screen.getByRole( 'button', {
			name: /Transaction actions/i,
		} );
	} );

	test( 'correctly renders dispute details for "warning_under_review" inquiry disputes', () => {
		const charge = getBaseCharge();
		charge.disputed = true;
		charge.dispute = getBaseDispute();
		charge.dispute.status = 'warning_under_review';
		charge.dispute.metadata.__evidence_submitted_at = '1693400000';

		renderCharge( charge );

		screen.getByText( /You submitted evidence for this inquiry/i, {
			ignore: '.a11y-speak-region',
		} );
		screen.getByRole( 'button', { name: /View submitted evidence/i } );

		// No actions rendered
		expect(
			screen.queryByRole( 'button', {
				name: /Challenge/i,
			} )
		).toBeNull();
		expect(
			screen.queryByRole( 'button', {
				name: /Accept/i,
			} )
		).toBeNull();

		// Refund menu is rendered
		screen.getByRole( 'button', {
			name: /Transaction actions/i,
		} );
	} );

	test( 'correctly renders dispute details for "warning_closed" inquiry disputes', () => {
		const charge = getBaseCharge();
		charge.disputed = true;
		charge.dispute = getBaseDispute();
		charge.dispute.status = 'warning_closed';
		charge.dispute.metadata.__evidence_submitted_at = '1693400000';
		charge.dispute.metadata.__dispute_closed_at = '1693453017';

		renderCharge( charge );

		screen.getByText( /This inquiry was closed/i, {
			ignore: '.a11y-speak-region',
		} );
		screen.getByRole( 'button', { name: /View submitted evidence/i } );

		// No actions rendered
		expect(
			screen.queryByRole( 'button', {
				name: /Challenge/i,
			} )
		).toBeNull();
		expect(
			screen.queryByRole( 'button', {
				name: /Accept/i,
			} )
		).toBeNull();

		// Refund menu is rendered
		screen.getByRole( 'button', {
			name: /Transaction actions/i,
		} );
	} );

	describe( 'order missing notice', () => {
		test( 'renders notice if order missing', () => {
			const charge = getBaseCharge();
			charge.order = null;

			const container = renderCharge( charge );

			expect(
				screen.getByRole( 'button', { name: /Refund/i } )
			).toBeInTheDocument();

			expect(
				screen.getByText(
					/This transaction is not connected to order. Investigate this purchase and refund the transaction as needed./
				)
			).toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );

		test( 'does not render notice if order present', () => {
			const charge = getBaseCharge();

			const container = renderCharge( charge );

			expect(
				screen.queryByRole( 'button', { name: /Refund/i } )
			).not.toBeInTheDocument();

			expect(
				screen.queryByText(
					/This transaction is not connected to order. Investigate this purchase and refund the transaction as needed./
				)
			).not.toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );
	} );

	describe( 'Refund actions menu', () => {
		test( 'Refund control menu is visible when conditions are met', () => {
			renderCharge( getBaseCharge() );
			expect(
				screen.getByLabelText( 'Transaction actions' )
			).toBeInTheDocument();
		} );

		test( 'Refund in full option is available when no amount has been refunded', () => {
			renderCharge( getBaseCharge() );
			fireEvent.click( screen.getByLabelText( 'Transaction actions' ) );
			expect( screen.getByText( 'Refund in full' ) ).toBeInTheDocument();
		} );

		test( 'Refund in full option is not available when an amount has been refunded', () => {
			renderCharge( { ...getBaseCharge(), amount_refunded: 42 } );
			fireEvent.click( screen.getByLabelText( 'Transaction actions' ) );
			expect(
				screen.queryByText( 'Refund in full' )
			).not.toBeInTheDocument();
		} );

		test( 'Partial refund option is available when charge is associated with an order', () => {
			renderCharge( getBaseCharge() );
			fireEvent.click( screen.getByLabelText( 'Transaction actions' ) );
			expect( screen.getByText( 'Partial refund' ) ).toBeInTheDocument();
		} );

		test( 'Refund control menu is not visible when charge is not captured', () => {
			renderCharge( { ...getBaseCharge(), captured: false } );
			expect(
				screen.queryByLabelText( 'Transaction actions' )
			).not.toBeInTheDocument();
		} );
	} );
} );
