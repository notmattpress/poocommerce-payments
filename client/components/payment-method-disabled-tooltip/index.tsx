/** @format */
/**
 * External dependencies
 */
import interpolateComponents from '@automattic/interpolate-components';
import { __ } from '@wordpress/i18n';
import React from 'react';

/**
 * Internal dependencies
 */
import { HoverTooltip } from 'components/tooltip';

export const DocumentationUrlForDisabledPaymentMethod = {
	DEFAULT:
		'https://poocommerce.com/document/woopayments/payment-methods/additional-payment-methods/#method-cant-be-enabled',
	BNPLS:
		'https://poocommerce.com/document/woopayments/payment-methods/buy-now-pay-later/#contact-support',
};

export const getDocumentationUrlForDisabledPaymentMethod = (
	paymentMethodId: string
): string => {
	const paymentMethodConfig =
		window.wooPaymentsPaymentMethodsConfig?.[ paymentMethodId ];

	if ( paymentMethodConfig?.isBnpl ) {
		return DocumentationUrlForDisabledPaymentMethod.BNPLS;
	}

	return DocumentationUrlForDisabledPaymentMethod.DEFAULT;
};

const PaymentMethodDisabledTooltip = ( {
	id,
	children,
}: {
	id: string;
	children: React.ReactNode;
} ): React.ReactElement => {
	return (
		<HoverTooltip
			content={ interpolateComponents( {
				// translators: {{learnMoreLink}}: placeholders are opening and closing anchor tags.
				mixedString: __(
					'We need more information from you to enable this method. ' +
						'{{learnMoreLink}}Learn more.{{/learnMoreLink}}',
					'poocommerce-payments'
				),
				components: {
					learnMoreLink: (
						// eslint-disable-next-line jsx-a11y/anchor-has-content
						<a
							target="_blank"
							rel="noreferrer"
							title={ __(
								'Learn more about enabling payment methods',
								'poocommerce-payments'
							) }
							/* eslint-disable-next-line max-len */
							href={ getDocumentationUrlForDisabledPaymentMethod(
								id
							) }
						/>
					),
				},
			} ) }
		>
			{ children }
		</HoverTooltip>
	);
};

export default PaymentMethodDisabledTooltip;
