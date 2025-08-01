/** @format **/

/**
 * External dependencies
 */
import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';

/**
 * Internal dependencies
 */
import { useAuthorization } from 'wcpay/data';

interface CancelAuthorizationButtonProps {
	orderId: number;
	paymentIntentId: string;
	isDestructive?: boolean;
	isSmall?: boolean;
	onClick?: () => void;
}

const CancelAuthorizationButton: React.FC< React.PropsWithChildren<
	CancelAuthorizationButtonProps
> > = ( {
	orderId,
	children,
	paymentIntentId,
	isDestructive = true,
	isSmall = false,
	onClick = () => undefined,
} ) => {
	const { doCancelAuthorization, isLoading, isRequesting } = useAuthorization(
		paymentIntentId,
		orderId
	);

	// Use local state to prevent the button to be in 'busy' state when it loads
	const [ IsCancelRequested, setIsCancelRequested ] = useState( false );

	return (
		<Button
			isDestructive={ isDestructive }
			isSmall={ isSmall }
			onClick={ () => {
				onClick();
				setIsCancelRequested( true );
				doCancelAuthorization();
			} }
			isBusy={ isLoading && IsCancelRequested } // Button should be in busy state when the cancel is requested
			disabled={ ( isLoading && IsCancelRequested ) || isRequesting } // Button should be disabled when the cancel is requested
		>
			{ children || __( 'Cancel', 'poocommerce-payments' ) }
		</Button>
	);
};

export default CancelAuthorizationButton;
