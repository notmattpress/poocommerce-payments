/** @format */
/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import React from 'react';

/**
 * Internal dependencies
 */
import { Card, CardBody } from '@wordpress/components';
import WCPayLogo from './wcpay-logo';
import './banner.scss';

const Banner = ( { style } ) => {
	let logoWidth,
		logoHeight,
		showPill,
		className = 'poocommerce-payments-banner';
	if ( style === 'account-page' ) {
		logoWidth = 196;
		logoHeight = 65;
		showPill = true;
		className += ' account-page';
	} else {
		logoWidth = 257;
		logoHeight = 70;
		showPill = false;
	}
	return (
		<Card size="large" className={ className }>
			<CardBody>
				<WCPayLogo
					width={ logoWidth }
					height={ logoHeight }
					className="poocommerce-payments-banner-logo"
				/>
				{ showPill && (
					<div className="poocommerce-payments-banner-pill">
						<div>
							{ __( 'Recommended', 'poocommerce-payments' ) }
						</div>
					</div>
				) }
			</CardBody>
		</Card>
	);
};

export default Banner;
