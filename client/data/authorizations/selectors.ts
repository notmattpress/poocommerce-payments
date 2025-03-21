/** @format */
/**
 * External dependencies
 */

import type { Query } from '@poocommerce/navigation';

/**
 * Internal dependencies
 */
import { getResourceId } from 'utils/data';
import { ApiError } from 'wcpay/types/errors';
import {
	AuthorizationsSummary,
	Authorization,
} from 'wcpay/types/authorizations';

/**
 * Retrieves the authorizations state from the wp.data store if the state
 * has been initialized, otherwise returns an empty state.
 *
 * @param {Object} state Current wp.data state.
 *
 * @return {Object} The authorizations state.
 */
const getAuthorizationsState = ( state: Record< string, any > ) => {
	if ( ! state ) {
		return {};
	}

	return state.authorizations || {};
};

/**
 * Retrieves the authorizations corresponding to the provided query or a sane
 * default if they don't exist.
 *
 * @param {Object} state Current wp.data state.
 * @param {Object} query The authorizations query.
 *
 * @return {Object} The list of authorizations for the given query.
 */
const getAuthorizationsForQuery = (
	state: Record< string, any >,
	query: Query
): Record< string, any > => {
	const index = getResourceId( query );
	return getAuthorizationsState( state )[ index ] || {};
};

export const getAuthorizations = (
	state: Record< string, any >,
	query: Query
): Array< Authorization > => {
	return getAuthorizationsForQuery( state, query ).data || [];
};

export const getAuthorization = (
	state: Record< string, any >,
	id: string
): Record< string, any > => {
	const authorizationById = getAuthorizationsState( state ).byId || {};
	return authorizationById[ id ];
};

export const getAuthorizationsError = (
	state: Record< string, any >,
	query: Query
): ApiError => {
	return getAuthorizationsForQuery( state, query ).error || {};
};

/**
 * Retrieves the authorizations summary corresponding to the provided query.
 *
 * @param {Object} state Current wp.data state.
 * @param {Object} query The authorizations summary query.
 *
 * @return {Object} The transaction summary for the given query.
 */
const getAuthorizationsSummaryForQuery = (
	state: Record< string, any >,
	query: Query
): Record< string, any > => {
	const index = getResourceId( query );
	return getAuthorizationsState( state ).summary[ index ] || {};
};

export const getAuthorizationsSummary = (
	state: Record< string, any >,
	query: Query
): AuthorizationsSummary => {
	return getAuthorizationsSummaryForQuery( state, query ).data || {};
};

export const getAuthorizationsSummaryError = (
	state: Record< string, any >,
	query: Query
): ApiError => {
	return getAuthorizationsSummaryForQuery( state, query ).error || {};
};

export const getIsRequesting = ( state: Record< string, any > ): boolean =>
	getAuthorizationsState( state ).isRequesting;
