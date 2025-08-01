/* global wcpay_tos_settings */

/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { isEnabled, recordEvent } from 'tracks';

export const makeTosAcceptanceRequest = async ( {
	accept,
}: {
	accept: boolean;
} ) =>
	apiFetch( {
		path: '/wc/v3/payments/tos',
		method: 'POST',
		data: { accept },
	} );

export const enableGatewayAfterTosDecline = async () =>
	apiFetch( {
		path: '/wc/v3/payments/tos/reactivate',
		method: 'POST',
	} );

/**
 * Records track if we're able to and send an API request to delete the option
 * that triggers this track.
 */
export const maybeTrackStripeConnected = async () => {
	const trackStripeConnected = wcpay_tos_settings.trackStripeConnected;
	if ( ! isEnabled() || ! trackStripeConnected ) {
		return;
	}

	recordEvent( 'wcpay_stripe_connected', {
		is_existing_stripe_account:
			trackStripeConnected.is_existing_stripe_account,
	} );

	apiFetch( {
		path: '/wc/v3/payments/tos/stripe_track_connected',
		method: 'POST',
	} );
};
