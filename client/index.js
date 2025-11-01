/** @format **/

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
// Create a dependency on wp-mediaelement. Necessary to prevent a type of JS error.
// See discussion in WCPay PR #1263 in GitHub.
// eslint-disable-next-line import/no-unresolved
import 'wp-mediaelement';

/**
 * Internal dependencies
 */
import './style.scss';
import ConnectAccountPage from 'connect-account-page';
import DepositsPage from 'deposits';
import DepositDetailsPage from 'deposits/details';
import TransactionsPage from 'transactions';
import PaymentDetailsPage from 'payment-details';
import DisputesPage from 'disputes';
import RedirectToTransactionDetails from 'disputes/redirect-to-transaction-details';
import DisputeNewEvidencePage from 'wcpay/disputes/new-evidence';
import { MultiCurrencySetupPage } from 'multi-currency/interface/components';
import CardReadersPage from 'card-readers';
import CapitalPage from 'capital';
import OverviewPage from 'overview';
import DocumentsPage from 'documents';
import OnboardingPage from 'onboarding';
import OnboardingKycPage from 'onboarding/kyc';
import FraudProtectionAdvancedSettingsPage from './settings/fraud-protection/advanced-settings';
import { getTasks } from 'overview/task-list/tasks';

addFilter(
	'poocommerce_admin_pages_list',
	'poocommerce-payments',
	( pages ) => {
		const { menuID, rootLink } = getMenuSettings();

		const isNavigationEnabled =
			window.wcAdminFeatures && window.wcAdminFeatures.navigation;
		const connectionPageTitle = isNavigationEnabled
			? 'WooPayments'
			: __( 'Connect', 'poocommerce-payments' );

		pages.push( {
			container: ConnectAccountPage,
			path: '/payments/connect',
			wpOpenMenu: menuID,
			breadcrumbs: [ rootLink, connectionPageTitle ],
			navArgs: {
				id: 'wc-payments',
			},
			capability: 'manage_poocommerce',
		} );

		pages.push( {
			container: OnboardingPage,
			path: '/payments/onboarding',
			wpOpenMenu: menuID,
			breadcrumbs: [
				rootLink,
				__( 'Onboarding', 'poocommerce-payments' ),
			],
			navArgs: {
				id: 'wc-payments-onboarding',
			},
			capability: 'manage_poocommerce',
		} );

		pages.push( {
			container: OnboardingKycPage,
			path: '/payments/onboarding/kyc',
			wpOpenMenu: menuID,
			breadcrumbs: [
				rootLink,
				__( 'Continue onboarding', 'poocommerce-payments' ),
			],
			navArgs: {
				id: 'wc-payments-continue-onboarding',
			},
			capability: 'manage_poocommerce',
		} );

		pages.push( {
			container: OverviewPage,
			path: '/payments/overview',
			wpOpenMenu: menuID,
			breadcrumbs: [ rootLink, __( 'Overview', 'poocommerce-payments' ) ],
			navArgs: {
				id: 'wc-payments-overview',
			},
			capability: 'manage_poocommerce',
		} );

		pages.push( {
			container: DepositsPage,
			path: '/payments/payouts',
			wpOpenMenu: menuID,
			breadcrumbs: [ rootLink, __( 'Payouts', 'poocommerce-payments' ) ],
			navArgs: {
				id: 'wc-payments-deposits',
			},
			capability: 'manage_poocommerce',
		} );
		pages.push( {
			container: DepositDetailsPage,
			path: '/payments/payouts/details',
			wpOpenMenu: menuID,
			breadcrumbs: [
				rootLink,
				[
					'/payments/payouts',
					__( 'Payouts', 'poocommerce-payments' ),
				],
				__( 'Payout details', 'poocommerce-payments' ),
			],
			navArgs: {
				id: 'wc-payments-deposit-details',
				parentPath: '/payments/payouts',
			},
			capability: 'manage_poocommerce',
		} );
		pages.push( {
			container: TransactionsPage,
			path: '/payments/transactions',
			wpOpenMenu: menuID,
			breadcrumbs: [
				rootLink,
				__( 'Transactions', 'poocommerce-payments' ),
			],
			navArgs: {
				id: 'wc-payments-transactions',
			},
			capability: 'manage_poocommerce',
		} );
		pages.push( {
			container: PaymentDetailsPage,
			path: '/payments/transactions/details',
			wpOpenMenu: menuID,
			breadcrumbs: [
				rootLink,
				[
					'/payments/transactions',
					__( 'Transactions', 'poocommerce-payments' ),
				],
				__( 'Payment details', 'poocommerce-payments' ),
			],
			navArgs: {
				id: 'wc-payments-transaction-details',
				parentPath: '/payments/transactions',
			},
			capability: 'manage_poocommerce',
		} );
		pages.push( {
			container: DisputesPage,
			path: '/payments/disputes',
			wpOpenMenu: menuID,
			breadcrumbs: [ rootLink, __( 'Disputes', 'poocommerce-payments' ) ],
			navArgs: {
				id: 'wc-payments-disputes',
			},
			capability: 'manage_poocommerce',
		} );

		pages.push( {
			container: RedirectToTransactionDetails,
			path: '/payments/disputes/details',
			wpOpenMenu: menuID,
			breadcrumbs: [
				rootLink,
				[
					'/payments/disputes',
					__( 'Disputes', 'poocommerce-payments' ),
				],
				__( 'Dispute details', 'poocommerce-payments' ),
			],
			navArgs: {
				id: 'wc-payments-disputes-details-legacy-redirect',
				parentPath: '/payments/disputes',
			},
			capability: 'manage_poocommerce',
		} );

		pages.push( {
			container: DisputeNewEvidencePage,
			path: '/payments/disputes/challenge',
			wpOpenMenu: menuID,
			breadcrumbs: [
				rootLink,
				[
					'/payments/disputes',
					__( 'Disputes', 'poocommerce-payments' ),
				],
				__( 'Challenge dispute', 'poocommerce-payments' ),
			],
			navArgs: {
				id: 'wc-payments-disputes-challenge',
				parentPath: '/payments/disputes',
			},
			capability: 'manage_poocommerce',
		} );

		pages.push( {
			container: MultiCurrencySetupPage,
			path: '/payments/multi-currency-setup',
			wpOpenMenu: menuID,
			breadcrumbs: [
				rootLink,
				__( 'Set up multiple currencies', 'poocommerce-payments' ),
			],
			capability: 'manage_poocommerce',
		} );
		pages.push( {
			container: CardReadersPage,
			path: '/payments/card-readers',
			wpOpenMenu: menuID,
			breadcrumbs: [
				rootLink,
				__( 'Card readers', 'poocommerce-payments' ),
			],
			navArgs: {
				id: 'wc-payments-card-readers',
			},
			capability: 'manage_poocommerce',
		} );
		pages.push( {
			container: CapitalPage,
			path: '/payments/loans',
			wpOpenMenu: menuID,
			breadcrumbs: [
				rootLink,
				__( 'Capital Loans', 'poocommerce-payments' ),
			],
			navArgs: {
				id: 'wc-payments-capital',
			},
			capability: 'manage_poocommerce',
		} );
		if ( wcpaySettings && wcpaySettings.featureFlags.documents ) {
			pages.push( {
				container: DocumentsPage,
				path: '/payments/documents',
				wpOpenMenu: menuID,
				breadcrumbs: [
					rootLink,
					__( 'Documents', 'poocommerce-payments' ),
				],
				navArgs: {
					id: 'wc-payments-documents',
				},
				capability: 'manage_poocommerce',
			} );
		}
		if ( wcpaySettings ) {
			pages.push( {
				container: FraudProtectionAdvancedSettingsPage,
				path: '/payments/fraud-protection',
				wpOpenMenu: menuID,
				breadcrumbs: [ rootLink, 'Settings' ], // to align with the WooPayments settings pages.
				capability: 'manage_poocommerce',
			} );
		}
		return pages;
	}
);

/**
 * Get menu settings based on the top level link being connect or overview
 *
 * @return { { menuID, rootLink } }  Object containing menuID and rootLink
 */
function getMenuSettings() {
	const connectPage = document.querySelector(
		'#toplevel_page_wc-admin-path--payments-connect'
	);
	const topLevelPage = connectPage ? 'connect' : 'overview';

	return {
		menuID: `toplevel_page_wc-admin-path--payments-${ topLevelPage }`,
		rootLink: [
			`/payments/${ topLevelPage }`,
			__( 'Payments', 'poocommerce-payments' ),
		],
	};
}

addFilter(
	'poocommerce_admin_onboarding_task_list',
	'poocommerce-payments',
	( tasks ) => {
		const { showUpdateDetailsTask, wpcomReconnectUrl } = wcpaySettings;

		const wcPayTasks = getTasks( {
			showUpdateDetailsTask: showUpdateDetailsTask,
			wpcomReconnectUrl: wpcomReconnectUrl,
			showGoLiveTask: true,
		} );

		return [ ...tasks, ...wcPayTasks ];
	}
);
