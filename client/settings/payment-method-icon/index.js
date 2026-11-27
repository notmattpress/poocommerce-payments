/** @format */
/**
 * External dependencies
 */
import React from 'react';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import './style.scss';

const PaymentMethodIcon = ( { Icon, label } ) => {
	if ( ! Icon ) return null;

	return (
		<span className={ clsx( 'poocommerce-payments__payment-method-icon' ) }>
			<Icon />
			{ label && (
				<span className="poocommerce-payments__payment-method-icon__label">
					{ label }
				</span>
			) }
		</span>
	);
};

export default PaymentMethodIcon;
