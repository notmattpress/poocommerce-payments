/**
 * External dependencies
 */
import React, { FC, ReactNode } from 'react';
import { Pill as WC_Pill } from '@poocommerce/components';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import './style.scss';

export type PillType = 'primary' | 'success' | 'alert' | 'danger' | 'light';

type PillProps = {
	type?: PillType;
	className?: string;
	children?: ReactNode;
};

const Pill: FC< React.PropsWithChildren< PillProps > > = ( {
	type = '',
	className = '',
	children,
} ) => {
	const types = [ 'primary', 'success', 'alert', 'danger', 'light' ];

	const classes = clsx(
		`wcpay-pill${ types.includes( type ) ? '__' + type : '' }`,
		className
	);

	return <WC_Pill className={ classes }>{ children }</WC_Pill>;
};

export default Pill;
