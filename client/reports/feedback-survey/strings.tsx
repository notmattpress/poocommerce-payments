/**
 * External dependencies
 */
import React from 'react';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export const feedbackQuestion = __(
	'Did this report give you the information you needed?',
	'poocommerce-payments'
);

export const thumbsUpLabel = __(
	'What did you use this report for? (optional)',
	'poocommerce-payments'
);

export const thumbsDownLabel = __(
	"What's missing? (optional)",
	'poocommerce-payments'
);

export const thumbsUpAriaLabel = __(
	'This report was helpful',
	'poocommerce-payments'
);

export const thumbsDownAriaLabel = __(
	'This report was not helpful',
	'poocommerce-payments'
);

export const reportFeedbackRatingAriaLabel = __(
	'Report feedback rating',
	'poocommerce-payments'
);

export const closeAriaLabel = __(
	'Dismiss feedback survey',
	'poocommerce-payments'
);
export const cancelLabel = __( 'Cancel', 'poocommerce-payments' );
export const sendLabel = __( 'Send', 'poocommerce-payments' );
export const submitErrorMessage = __(
	'Your feedback could not be sent. Please try again.',
	'poocommerce-payments'
);
export const submitSuccessMessage = __(
	'Thanks for your feedback!',
	'poocommerce-payments'
);

export const privacyDisclaimer = createInterpolateElement(
	__(
		'Your feedback will only be shared with PooCommerce and treated pursuant to our <a>privacy policy</a>.',
		'poocommerce-payments'
	),
	{
		a: (
			// eslint-disable-next-line jsx-a11y/anchor-has-content
			<a
				href="https://automattic.com/privacy/"
				target="_blank"
				rel="noopener noreferrer"
			/>
		),
	}
);
