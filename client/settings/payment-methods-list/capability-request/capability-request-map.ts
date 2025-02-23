/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { CapabilityRequestMap } from './types';

const CapabilityRequestList: Array< CapabilityRequestMap > = [
	{
		id: 'jcb',
		label: __( 'JCB', 'poocommerce-payments' ),
		country: 'JP',
		states: {
			unrequested: {
				status: 'info',
				content: __(
					'Enable JCB for your customers, the only international payment brand based in Japan.',
					'poocommerce-payments'
				),
				actions: 'request',
				actionsLabel: __( 'Enable JCB', 'poocommerce-payments' ),
			},
			pending_verification: {
				status: 'warning',
				content: __(
					'To enable JCB for your customers, you need to provide more information.',
					'poocommerce-payments'
				),
				actions: 'link',
				actionUrl:
					'https://poocommerce.com/document/woopayments/payment-methods/jcb-for-merchants-in-japan/',
				actionsLabel: __( 'Finish setup', 'poocommerce-payments' ),
			},
			pending: {
				status: 'info',
				content: __(
					'Your information has been submitted and your JCB account is pending approval.',
					'poocommerce-payments'
				),
			},
			inactive: {
				status: 'info',
				content: __(
					'Your JCB account was rejected based on the information provided.',
					'poocommerce-payments'
				),
			},
			active: {
				status: 'info',
				content: __(
					'JCB is now enabled on your store.',
					'poocommerce-payments'
				),
			},
		},
	},
];

export default CapabilityRequestList;
