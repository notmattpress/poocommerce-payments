/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { Notice } from 'wcpay/components/wp-components-wrapped/components/notice';

/**
 * Internal dependencies
 */
import { getPaymentSettingsUrl } from '../../utils';

const JetpackIdcNotice = () => {
	return (
		wcpaySettings.hasOwnProperty( 'isJetpackIdcActive' ) &&
		wcpaySettings.isJetpackIdcActive && (
			<Notice
				status="error"
				isDismissible={ false }
				className="wcpay-jetpack-idc-notice"
			>
				{ __(
					'Your site is currently in Safe Mode.',
					'poocommerce-payments'
				) }
				<span>&nbsp;</span>
				<a href={ getPaymentSettingsUrl() }>
					{ __( 'Please take action', 'poocommerce-payments' ) }
				</a>
			</Notice>
		)
	);
};

export default JetpackIdcNotice;
