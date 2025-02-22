/**
 * External dependencies
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
	loadConnectAndInitialize,
	StripeConnectInstance,
} from '@stripe/connect-js/pure';
import {
	ConnectAccountOnboarding,
	ConnectComponentsProvider,
} from '@stripe/react-connect-js';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import appearance from '../kyc/appearance';
import BannerNotice from 'wcpay/components/banner-notice';
import StripeSpinner from 'wcpay/components/stripe-spinner';
import { useOnboardingContext } from 'wcpay/onboarding/context';
import {
	createAccountSession,
	finalizeOnboarding,
	isPoEligible,
} from 'wcpay/onboarding/utils';
import { getConnectUrl, getOverviewUrl } from 'wcpay/utils';
import {
	trackEmbeddedStepChange,
	trackRedirected,
} from 'wcpay/onboarding/tracking';

interface Props {
	continueKyc?: boolean;
	collectPayoutRequirements?: boolean;
}

// TODO: extract this logic and move it to a generic component to be used for all embedded components, not just onboarding.
const EmbeddedKyc: React.FC< Props > = ( {
	continueKyc = false,
	collectPayoutRequirements = false,
} ) => {
	const { data } = useOnboardingContext();
	const [ locale, setLocale ] = useState( '' );
	const [ publishableKey, setPublishableKey ] = useState( '' );
	const [ clientSecret, setClientSecret ] = useState<
		( () => Promise< string > ) | null
	>( null );
	const [
		stripeConnectInstance,
		setStripeConnectInstance,
	] = useState< StripeConnectInstance | null >( null );
	const [ loading, setLoading ] = useState( true );
	const [ finalizingAccount, setFinalizingAccount ] = useState( false );
	const [ loadErrorMessage, setLoadErrorMessage ] = useState( '' );

	const fetchAccountSession = useCallback( async () => {
		try {
			const isEligible = ! continueKyc && ( await isPoEligible( data ) );
			const accountSession = await createAccountSession(
				data,
				isEligible
			);
			if ( accountSession && accountSession.clientSecret ) {
				trackRedirected( isEligible, true );
				return accountSession; // Return the full account session object
			}

			setLoadErrorMessage(
				__(
					"Failed to create account session. Please check that you're using the latest version of WooPayments.",
					'poocommerce-payments'
				)
			);
		} catch ( error ) {
			setLoadErrorMessage(
				__(
					'Failed to retrieve account session. Please try again later.',
					'poocommerce-payments'
				)
			);
		}

		// Return null if an error occurred.
		return null;
	}, [ continueKyc, data ] );

	// Function to fetch clientSecret for use in Stripe auto-refresh or initialization
	const fetchClientSecret = useCallback( async () => {
		const accountSession = await fetchAccountSession();
		if ( accountSession ) {
			return accountSession.clientSecret; // Only return the clientSecret
		}
		throw new Error( 'Error fetching the client secret' );
	}, [ fetchAccountSession ] );

	// Effect to fetch the publishable key and clientSecret on initial render
	useEffect( () => {
		const fetchKeys = async () => {
			try {
				const accountSession = await fetchAccountSession();
				if ( accountSession ) {
					setLocale( accountSession.locale );
					setPublishableKey( accountSession.publishableKey );
					setClientSecret( () => fetchClientSecret );
				}
			} catch ( error ) {
				setLoadErrorMessage(
					__(
						'Failed to create account session. Please check that you are using the latest version of WooPayments.',
						'poocommerce-payments'
					)
				);
			}
		};

		fetchKeys();
	}, [ data, continueKyc, fetchAccountSession, fetchClientSecret ] );

	// Effect to initialize the Stripe Connect instance once publishableKey and clientSecret are ready.
	useEffect( () => {
		if ( publishableKey && clientSecret && ! stripeConnectInstance ) {
			const stripeInstance = loadConnectAndInitialize( {
				publishableKey,
				fetchClientSecret,
				appearance: {
					overlays: 'drawer',
					variables: appearance.variables,
				},
				locale: locale.replace( '_', '-' ),
			} );

			setStripeConnectInstance( stripeInstance );
		}
	}, [
		publishableKey,
		clientSecret,
		stripeConnectInstance,
		fetchClientSecret,
		locale,
	] );

	const handleStepChange = ( step: string ) => {
		trackEmbeddedStepChange( step );
	};

	const handleOnExit = async () => {
		const urlParams = new URLSearchParams( window.location.search );
		const urlSource =
			urlParams.get( 'source' )?.replace( /[^\w-]+/g, '' ) || 'unknown';

		setFinalizingAccount( true );

		try {
			const response = await finalizeOnboarding( urlSource );
			if ( response.success ) {
				window.location.href = getOverviewUrl(
					{
						...response.params,
						'wcpay-connection-success': '1',
					},
					'WCPAY_ONBOARDING_WIZARD'
				);
			} else {
				window.location.href = getConnectUrl(
					{
						...response.params,
						'wcpay-connection-error': '1',
					},
					'WCPAY_ONBOARDING_WIZARD'
				);
			}
		} catch ( error ) {
			window.location.href = getConnectUrl(
				{
					'wcpay-connection-error': '1',
					source: urlSource,
				},
				'WCPAY_ONBOARDING_WIZARD'
			);
		}
	};

	return (
		<>
			{ loading && (
				<div className="embedded-kyc-loader-wrapper padded">
					<StripeSpinner />
				</div>
			) }
			{ loadErrorMessage && (
				<BannerNotice status="error">{ loadErrorMessage }</BannerNotice>
			) }
			{ finalizingAccount && (
				<div className="embedded-kyc-loader-wrapper">
					<StripeSpinner />
				</div>
			) }
			{ stripeConnectInstance && (
				<ConnectComponentsProvider
					connectInstance={ stripeConnectInstance }
				>
					<ConnectAccountOnboarding
						onLoaderStart={ () => setLoading( false ) }
						onLoadError={ ( loadError ) =>
							setLoadErrorMessage(
								loadError.error.message || 'Unknown error'
							)
						}
						onExit={ handleOnExit }
						onStepChange={ ( stepChange ) =>
							handleStepChange( stepChange.step )
						}
						collectionOptions={ {
							fields: collectPayoutRequirements
								? 'eventually_due'
								: 'currently_due',
							futureRequirements: 'omit',
						} }
					/>
				</ConnectComponentsProvider>
			) }
		</>
	);
};

export default EmbeddedKyc;
