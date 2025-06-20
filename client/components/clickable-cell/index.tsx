/** @format **/

/**
 * External dependencies
 */
import { Link } from '@poocommerce/components';
import React, { ReactNode, ComponentProps } from 'react';

/**
 * Internal dependencies
 */
import './style.scss';

interface ClickableCellProps
	extends Omit< ComponentProps< typeof Link >, 'href' > {
	href?: string;
	children: ReactNode;
}

const ClickableCell = ( {
	href,
	children,
	...linkProps
}: ClickableCellProps ) =>
	href ? (
		<Link
			href={ href }
			className="poocommerce-table__clickable-cell"
			tabIndex="-1"
			{ ...linkProps }
		>
			{ children }
		</Link>
	) : (
		<>{ children }</>
	);

export default ClickableCell;
