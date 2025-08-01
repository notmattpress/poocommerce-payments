/** @format **/

/**
 * External dependencies
 */

import React from 'react';
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */

import './style.scss';
import CardNotice from 'wcpay/components/card-notice';
import Loadable from 'wcpay/components/loadable';
import { Charge } from 'wcpay/types/charges';

interface MissingOrderNoticeProps {
	charge: Charge;
	isLoading: boolean;
	onButtonClick: () => void;
}

const MissingOrderNotice: React.FC< MissingOrderNoticeProps > = ( {
	charge,
	isLoading,
	onButtonClick,
} ) => {
	return (
		<>
			<Loadable isLoading={ isLoading } placeholder="">
				<CardNotice
					actions={
						! charge.refunded ? (
							<Button
								variant="primary"
								isSmall={ false }
								onClick={ onButtonClick }
							>
								{ __( 'Refund', 'poocommerce-payments' ) }
							</Button>
						) : (
							<></>
						)
					}
				>
					{ __(
						'This transaction is not connected to order. ',
						'poocommerce-payments'
					) }
					{ charge.refunded
						? __(
								'It has been refunded and is not a subject for disputes.',
								'poocommerce-payments'
						  )
						: __(
								'Investigate this purchase and refund the transaction as needed.',
								'poocommerce-payments'
						  ) }
				</CardNotice>
			</Loadable>
		</>
	);
};

export default MissingOrderNotice;
