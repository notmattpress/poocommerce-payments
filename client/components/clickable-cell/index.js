/** @format **/

/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import './style.scss';
import { Link } from '@poocommerce/components';

const ClickableCell = ( { href, children, ...linkProps } ) =>
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
		children
	);

export default ClickableCell;
