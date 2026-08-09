/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MegaphoneIcon from './megaphone-icon';
import builtItIllustration from 'assets/images/illustrations/review-prompt-built-it.svg?asset';
import checkInIllustration from 'assets/images/illustrations/review-prompt-check-in.svg?asset';
import './style.scss';

export interface ReviewPromptVariantContent {
	heading: string;
	description: string;
	/** Small corner icon (Spotlight `icon` prop) — control only. */
	icon?: JSX.Element;
	/** Full-width banner artwork (Spotlight `image` prop) — treatments only. */
	image?: JSX.Element;
}

const controlVariant = 'control';

const illustrationBanner = ( src: string ): JSX.Element => (
	<div className="wcpay-review-prompt__illustration">
		<img src={ src } alt="" aria-hidden="true" />
	</div>
);

const variants: Record< string, ReviewPromptVariantContent > = {
	[ controlVariant ]: {
		heading: __( 'Enjoying WooPayments so far?', 'poocommerce-payments' ),
		description: __(
			'Your feedback shapes our roadmap and supports the PooCommerce community. We are all ears!',
			'poocommerce-payments'
		),
		icon: <MegaphoneIcon />,
	},
	treatment_illustration: {
		heading: __(
			'We built it. You use it. What do you think?',
			'poocommerce-payments'
		),
		description: __(
			'Leave a quick review and help shape what WooPayments does next.',
			'poocommerce-payments'
		),
		image: illustrationBanner( builtItIllustration ),
	},
	treatment_revised: {
		heading: __( 'Quick check-in?', 'poocommerce-payments' ),
		description: __(
			'Your review helps us improve WooPayments and build a better experience for every store owner.',
			'poocommerce-payments'
		),
		image: illustrationBanner( checkInIllustration ),
	},
};

/**
 * Resolve variant content; any unknown or missing key falls back to control.
 */
export const getVariantContent = (
	variant: string | undefined
): ReviewPromptVariantContent =>
	variants[ variant ?? controlVariant ] ?? variants[ controlVariant ];
