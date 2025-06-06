/** @format */

/**
 * External dependencies
 */
import React from 'react';
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import DetailsLink from '../';

describe( 'Details link', () => {
	test( 'renders transaction details with charge ID', () => {
		const { container: link } = render(
			<DetailsLink id="ch_mock" parentSegment="transactions" />
		);
		expect( link ).toMatchSnapshot();
	} );

	test( 'renders dispute details with ID', () => {
		const { container: link } = render(
			<DetailsLink id="po_mock" parentSegment="payouts" />
		);
		expect( link ).toMatchSnapshot();
	} );

	test( 'empty render with no ID', () => {
		const { container: link } = render(
			<DetailsLink parentSegment="payouts" />
		);
		expect( link ).toMatchSnapshot();
	} );
} );
