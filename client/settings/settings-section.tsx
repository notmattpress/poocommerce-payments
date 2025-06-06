/** @format */
/**
 * External dependencies
 */
import React from 'react';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import './settings-section.scss';

const SettingsSection: React.FunctionComponent< {
	children?: React.ReactNode;
	className?: string;
	description?: React.FunctionComponent;
	title?: string;
	id?: string;
} > = ( {
	description: Description = () => null,
	children,
	className,
	id,
} ) => (
	<div className={ clsx( 'settings-section', className ) } id={ id }>
		<div className="settings-section__details">
			<Description />
		</div>
		<div className="settings-section__controls">{ children }</div>
	</div>
);

export default SettingsSection;
