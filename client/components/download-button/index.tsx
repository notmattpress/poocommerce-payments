/** @format **/

/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';

interface DownloadButtonProps {
	isDisabled: boolean;
	isBusy?: boolean;
	onClick: ( event: any ) => void;
}

const DownloadButton: React.FunctionComponent< React.PropsWithChildren<
	DownloadButtonProps
> > = ( { isDisabled, isBusy, onClick } ) => (
	<Button
		className="poocommerce-table__download-button"
		disabled={ isDisabled }
		onClick={ onClick }
		isBusy={ isBusy }
		__next40pxDefaultSize
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="currentColor"
		>
			<path d="M18.5 15v5H20v-5h-1.5zM4 15v5h1.5v-5H4zm0 5h16v-1.5H4V20z" />
			<path
				d="M12.25 16L6.5 10.75M12.25 16V3M12.25 16l5.25-5.25"
				stroke="currentColor"
				strokeWidth="1.5"
				fill="none"
			/>
		</svg>
		<span className="poocommerce-table__download-button__label">
			{ __( 'Export', 'poocommerce-payments' ) }
		</span>
	</Button>
);

export default DownloadButton;
