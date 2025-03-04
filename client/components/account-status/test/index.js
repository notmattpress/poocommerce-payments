/** @format */
/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import AccountStatus from '../';
import StatusChip from '../status-chip';

describe( 'AccountStatus', () => {
	beforeEach( () => {
		global.wcpaySettings = {
			devMode: false,
			zeroDecimalCurrencies: [],
			connect: {
				country: 'FR',
			},
			currencyData: {
				FR: {
					code: 'EUR',
					symbol: '€',
					symbolPosition: 'right_space',
					thousandSeparator: ' ',
					decimalSeparator: ',',
					precision: 2,
				},
			},
		};
	} );

	test( 'renders error status', () => {
		const { container: accountStatus } = renderAccountStatus(
			{ error: 'Test error' },
			{}
		);
		expect( accountStatus ).toMatchSnapshot();
	} );

	test( 'renders normal status', () => {
		const { container: accountStatus } = renderAccountStatus(
			{
				status: 'complete',
				accountLink: 'https://stripe.example.com/account',
				paymentsEnabled: 1,
				deposits: {
					status: 'enabled',
					interval: 'weekly',
				},
				progressiveOnboarding: {
					isEnabled: false,
					isComplete: false,
				},
			},
			[
				{
					payment_method: 'card',
					fee: {
						base: {
							currency: 'EUR',
							percentage_rate: 0.029,
							fixed_rate: 0.3,
						},
						discount: [
							{
								end_time: null,
								volume_allowance: null,
								volume_currency: null,
								current_volume: null,
								percentage_rate: 0.029,
								fixed_rate: 30,
							},
						],
					},
				},
			]
		);
		expect( accountStatus ).toMatchSnapshot();
	} );

	test( 'does not render edit details when no account link', () => {
		const { container: accountStatus } = renderAccountStatus(
			{
				status: 'complete',
				accountLink: false,
				paymentsEnabled: 1,
				deposits: {
					status: 'enabled',
					interval: 'weekly',
				},
				progressiveOnboarding: {
					isEnabled: false,
					isComplete: false,
				},
			},
			[
				{
					payment_method: 'card',
					fee: {
						base: {
							currency: 'EUR',
							percentage_rate: 0.029,
							fixed_rate: 0.3,
						},
						discount: [
							{
								end_time: null,
								volume_allowance: null,
								volume_currency: null,
								current_volume: null,
								percentage_rate: 0.029,
								fixed_rate: 30,
							},
						],
					},
				},
			]
		);
		expect( accountStatus ).toMatchSnapshot();
	} );

	test( 'renders account tools', () => {
		global.wcpaySettings.testModeOnboarding = true;

		const { container: accountStatus } = renderAccountStatus(
			{
				status: 'complete',
				accountLink: 'https://stripe.example.com/account',
				paymentsEnabled: 1,
				deposits: {
					status: 'enabled',
					interval: 'weekly',
				},
				progressiveOnboarding: {
					isEnabled: false,
					isComplete: false,
				},
			},
			[
				{
					payment_method: 'card',
					fee: {
						base: {
							currency: 'EUR',
							percentage_rate: 0.029,
							fixed_rate: 0.3,
						},
						discount: [
							{
								end_time: null,
								volume_allowance: null,
								volume_currency: null,
								current_volume: null,
								percentage_rate: 0.029,
								fixed_rate: 30,
							},
						],
					},
				},
			]
		);
		expect( accountStatus ).toMatchSnapshot();
	} );

	function renderAccountStatus( accountStatus, accountFees ) {
		return render(
			<AccountStatus
				accountStatus={ accountStatus }
				accountFees={ accountFees }
			/>
		);
	}
} );

describe( 'StatusChip', () => {
	test( 'renders complete status', () => {
		const { container: statusChip } = renderStatusChip( 'complete' );
		expect( statusChip ).toMatchSnapshot();
	} );

	test( 'renders enabled status', () => {
		const { container: statusChip } = renderStatusChip( 'enabled' );
		expect( statusChip ).toMatchSnapshot();
	} );

	test( 'renders restricted soon status', () => {
		const { container: statusChip } = renderStatusChip( 'restricted_soon' );
		expect( statusChip ).toMatchSnapshot();
	} );

	test( 'renders restricted status', () => {
		const { container: statusChip } = renderStatusChip( 'restricted' );
		expect( statusChip ).toMatchSnapshot();
	} );

	test( 'renders partially restricted status', () => {
		const { container: statusChip } = renderStatusChip(
			'restricted_partially'
		);
		expect( statusChip ).toMatchSnapshot();
	} );

	test( 'renders rejected status', () => {
		const { container: statusChip } = renderStatusChip( 'rejected_' );
		expect( statusChip ).toMatchSnapshot();
	} );

	test( 'renders under review status', () => {
		const { container: statusChip } = renderStatusChip( 'under_review' );
		expect( statusChip ).toMatchSnapshot();
	} );

	test( 'renders pending verification status', () => {
		const { container: statusChip } = renderStatusChip(
			'pending_verification'
		);
		expect( statusChip ).toMatchSnapshot();
	} );

	test( 'renders pending verification status for progressive onboarding', () => {
		const { container: statusChip } = renderStatusChip(
			'pending_verification',
			true,
			false
		);
		expect( statusChip ).toMatchSnapshot();
	} );

	test( 'renders unknown status', () => {
		const { container: statusChip } = renderStatusChip( 'foobar' );
		expect( statusChip ).toMatchSnapshot();
	} );

	function renderStatusChip(
		accountStatus,
		poEnabled = false,
		poComplete = false
	) {
		return render(
			<StatusChip
				accountStatus={ accountStatus }
				poEnabled={ poEnabled }
				poComplete={ poComplete }
			/>
		);
	}
} );
