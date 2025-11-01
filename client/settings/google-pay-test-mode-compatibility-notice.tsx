/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import interpolateComponents from '@automattic/interpolate-components';
import React, { useContext } from 'react';

/**
 * Internal dependencies
 */
import { usePaymentRequestEnabledSettings, useTestMode } from 'wcpay/data';
import InlineNotice from 'wcpay/components/inline-notice';
import WCPaySettingsContext from 'wcpay/settings/wcpay-settings-context';

const GooglePayTestModeCompatibilityNotice = () => {
	const [ isTestModeEnabled ] = useTestMode();
	const [ isPaymentRequestEnabled ] = usePaymentRequestEnabledSettings();
	const {
		accountStatus: { isLive: isLiveAccount },
	} = useContext( WCPaySettingsContext );

	if ( ! isLiveAccount ) {
		return null;
	}

	if ( ! isTestModeEnabled ) {
		return null;
	}

	if ( ! isPaymentRequestEnabled ) {
		return null;
	}

	return (
		<InlineNotice status="warning" icon={ true } isDismissible={ false }>
			{ interpolateComponents( {
				mixedString: __(
					'Google Pay is incompatible with test mode. {{learnMore}}Learn more{{/learnMore}}.',
					'poocommerce-payments'
				),
				components: {
					learnMore: (
						// @ts-expect-error: children is provided when interpolating the component
						<ExternalLink href="https://poocommerce.com/document/woopayments/payment-methods/google-pay/#testing" />
					),
				},
			} ) }
		</InlineNotice>
	);
};

export default GooglePayTestModeCompatibilityNotice;
