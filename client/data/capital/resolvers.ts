/** @format */

/**
 * External dependencies
 */
import { apiFetch } from '@wordpress/data-controls';
import { controls } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { NAMESPACE } from '../constants';
import {
	updateActiveLoanSummary,
	updateErrorForActiveLoanSummary,
	updateErrorForLoans,
	updateLoans,
} from './actions';
import { Summary, LoansList } from './types';
import { ApiError } from '../../types/errors';

/**
 * Retrieve the summary data for the currently active loan.
 */
export function* getActiveLoanSummary(): unknown {
	const path = `${ NAMESPACE }/capital/active_loan_summary`;

	try {
		const result = yield apiFetch( { path } );
		yield updateActiveLoanSummary( result as Summary );
	} catch ( e ) {
		yield controls.dispatch(
			'core/notices',
			'createErrorNotice',
			__(
				'Error retrieving the active loan summary.',
				'poocommerce-payments'
			)
		);
		yield updateErrorForActiveLoanSummary( e as ApiError );
	}
}

/**
 * Retrieve all the past and present capital loans.
 */
export function* getLoans(): unknown {
	const path = `${ NAMESPACE }/capital/loans`;

	try {
		const result = yield apiFetch( { path } );
		yield updateLoans( result as LoansList );
	} catch ( e ) {
		yield controls.dispatch(
			'core/notices',
			'createErrorNotice',
			__(
				'Error retrieving the active loan summary.',
				'poocommerce-payments'
			)
		);
		yield updateErrorForLoans( e as ApiError );
	}
}
