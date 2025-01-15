/** @format */
/**
 * External Dependencies
 */
import { Query } from '@poocommerce/navigation';
import { apiFetch } from '@wordpress/data-controls';
import { controls } from '@wordpress/data';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import TYPES from './action-types';
import {
	AuthorizationsSummary,
	Authorization,
	CaptureAuthorizationApiResponse,
} from 'wcpay/types/authorizations';
import { STORE_NAME } from '../constants';
import { ApiError } from 'wcpay/types/errors';

const getErrorMessage = ( apiError: {
	code?: string;
	message?: string;
} ): string => {
	// Map specific error codes to user-friendly messages
	const errorMessages: Record< string, string > = {
		wcpay_missing_order: __(
			'The order could not be found.',
			'poocommerce-payments'
		),
		wcpay_refunded_order_uncapturable: __(
			'Payment cannot be processed for partially or fully refunded orders.',
			'poocommerce-payments'
		),
		wcpay_intent_order_mismatch: __(
			'The payment cannot be processed due to a mismatch with order details.',
			'poocommerce-payments'
		),
		wcpay_payment_uncapturable: __(
			'This payment cannot be processed in its current state.',
			'poocommerce-payments'
		),
		wcpay_capture_error: __(
			'The payment capture failed to complete.',
			'poocommerce-payments'
		),
		wcpay_cancel_error: __(
			'The payment cancellation failed to complete.',
			'poocommerce-payments'
		),
		wcpay_server_error: __(
			'An unexpected error occurred. Please try again later.',
			'poocommerce-payments'
		),
	};

	return (
		errorMessages[ apiError.code ?? '' ] ??
		__(
			'Unable to process the payment. Please try again later.',
			'poocommerce-payments'
		)
	);
};

export function updateAuthorizations(
	query: Query,
	data: Authorization[]
): {
	type: string;
	data: Authorization[];
	query: Query;
} {
	return {
		type: TYPES.SET_AUTHORIZATIONS,
		data,
		query,
	};
}

export function updateErrorForAuthorizations(
	query: Query,
	error: ApiError
): {
	type: string;
	query: Query;
	error: ApiError;
} {
	return {
		type: TYPES.SET_ERROR_FOR_AUTHORIZATIONS,
		query,
		error,
	};
}

export function updateAuthorization(
	data: Authorization
): { type: string; data: Authorization } {
	return {
		type: TYPES.SET_AUTHORIZATION,
		data,
	};
}

export function updateAuthorizationsSummary(
	query: Query,
	data: AuthorizationsSummary
): {
	type: string;
	data: AuthorizationsSummary;
	query: Query;
} {
	return {
		type: TYPES.SET_AUTHORIZATIONS_SUMMARY,
		data,
		query,
	};
}

export function setIsRequestingAuthorization(
	data: boolean
): { type: string; data: boolean } {
	return { type: TYPES.SET_IS_REQUESTING_AUTHORIZATION, data };
}

export function* submitCaptureAuthorization(
	paymentIntentId: string,
	orderId: number
): Generator< unknown | Authorization > {
	try {
		yield controls.dispatch(
			STORE_NAME,
			'startResolution',
			'getAuthorization',
			[ paymentIntentId ]
		);

		yield controls.dispatch(
			STORE_NAME,
			'setIsRequestingAuthorization',
			true
		);

		const result = yield apiFetch( {
			path: `/wc/v3/payments/orders/${ orderId }/capture_authorization`,
			method: 'post',
			data: {
				payment_intent_id: paymentIntentId,
			},
		} );

		const authorization = {
			payment_intent_id: ( result as CaptureAuthorizationApiResponse ).id,
			captured:
				( result as CaptureAuthorizationApiResponse ).status ===
				'succeeded',
		};

		yield updateAuthorization( authorization as Authorization );

		// Need to invalidate the resolution so that the components will render again.
		yield controls.dispatch(
			STORE_NAME,
			'invalidateResolutionForStoreSelector',
			'getAuthorizations'
		);

		yield controls.dispatch(
			STORE_NAME,
			'invalidateResolutionForStoreSelector',
			'getAuthorizationsSummary'
		);

		yield controls.dispatch(
			STORE_NAME,
			'invalidateResolutionForStoreSelector',
			'getFraudOutcomeTransactions'
		);

		yield controls.dispatch(
			STORE_NAME,
			'invalidateResolutionForStoreSelector',
			'getFraudOutcomeTransactionsSummary'
		);

		yield controls.dispatch(
			STORE_NAME,
			'invalidateResolutionForStoreSelector',
			'getTimeline'
		);

		yield controls.dispatch(
			STORE_NAME,
			'invalidateResolutionForStoreSelector',
			'getPaymentIntent'
		);

		// Need to invalidate transactions tab to update newly captured transaction if needed.
		yield controls.dispatch(
			STORE_NAME,
			'invalidateResolutionForStoreSelector',
			'getTransactions'
		);

		// Create success notice.
		yield controls.dispatch(
			'core/notices',
			'createSuccessNotice',
			sprintf(
				// translators: %s Order id
				__(
					'Payment for order #%s captured successfully.',
					'poocommerce-payments'
				),
				orderId
			)
		);
	} catch ( error ) {
		const baseErrorMessage = sprintf(
			// translators: %s Order id
			__(
				'There has been an error capturing the payment for order #%s.',
				'poocommerce-payments'
			),
			orderId
		);

		const apiError = error as {
			code?: string;
			message?: string;
			data?: {
				status?: number;
			};
		};

		const errorDetails = getErrorMessage( apiError );

		yield controls.dispatch(
			'core/notices',
			'createErrorNotice',
			`${ baseErrorMessage } ${ errorDetails }`
		);
	} finally {
		yield controls.dispatch(
			STORE_NAME,
			'finishResolution',
			'getAuthorization',
			[ paymentIntentId ]
		);

		yield controls.dispatch(
			STORE_NAME,
			'setIsRequestingAuthorization',
			false
		);
	}
}

export function* submitCancelAuthorization(
	paymentIntentId: string,
	orderId: number
): Generator< unknown | Authorization > {
	try {
		yield controls.dispatch(
			STORE_NAME,
			'startResolution',
			'getAuthorization',
			[ paymentIntentId ]
		);

		yield controls.dispatch(
			STORE_NAME,
			'setIsRequestingAuthorization',
			true
		);

		const result = yield apiFetch( {
			path: `/wc/v3/payments/orders/${ orderId }/cancel_authorization`,
			method: 'post',
			data: {
				payment_intent_id: paymentIntentId,
			},
		} );

		const authorization = {
			payment_intent_id: ( result as CaptureAuthorizationApiResponse ).id,
			captured:
				( result as CaptureAuthorizationApiResponse ).status ===
				'succeeded',
		};

		yield updateAuthorization( authorization as Authorization );

		// Need to invalidate the resolution so that the components will render again.
		yield controls.dispatch(
			STORE_NAME,
			'invalidateResolutionForStoreSelector',
			'getAuthorizations'
		);

		yield controls.dispatch(
			STORE_NAME,
			'invalidateResolutionForStoreSelector',
			'getAuthorizationsSummary'
		);

		yield controls.dispatch(
			STORE_NAME,
			'invalidateResolutionForStoreSelector',
			'getFraudOutcomeTransactions'
		);

		yield controls.dispatch(
			STORE_NAME,
			'invalidateResolutionForStoreSelector',
			'getFraudOutcomeTransactionsSummary'
		);

		yield controls.dispatch(
			STORE_NAME,
			'invalidateResolutionForStoreSelector',
			'getTimeline'
		);

		yield controls.dispatch(
			STORE_NAME,
			'invalidateResolutionForStoreSelector',
			'getPaymentIntent'
		);

		// Create success notice.
		yield controls.dispatch(
			'core/notices',
			'createSuccessNotice',
			sprintf(
				// translators: %s Order id
				__(
					'Payment for order #%s canceled successfully.',
					'poocommerce-payments'
				),
				orderId
			)
		);
	} catch ( error ) {
		const baseErrorMessage = sprintf(
			// translators: %s Order id
			__(
				'There has been an error canceling the payment for order #%s.',
				'poocommerce-payments'
			),
			orderId
		);

		const apiError = error as {
			code?: string;
			message?: string;
			data?: {
				status?: number;
			};
		};

		const errorDetails = getErrorMessage( apiError );

		yield controls.dispatch(
			'core/notices',
			'createErrorNotice',
			`${ baseErrorMessage } ${ errorDetails }`
		);
	} finally {
		yield controls.dispatch(
			STORE_NAME,
			'finishResolution',
			'getAuthorization',
			[ paymentIntentId ]
		);

		yield controls.dispatch(
			STORE_NAME,
			'setIsRequestingAuthorization',
			false
		);
	}
}

export function updateErrorForAuthorizationsSummary(
	query: Query,
	error: Error
): {
	type: string;
	query: Query;
	error: Error;
} {
	return {
		type: TYPES.SET_ERROR_FOR_AUTHORIZATIONS_SUMMARY,
		query,
		error,
	};
}
