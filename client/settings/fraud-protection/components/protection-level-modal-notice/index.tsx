/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { Notice } from 'wcpay/components/wp-components-wrapped/components/notice';

/**
 * Internal dependencies
 */
import { TipIcon } from 'wcpay/icons';
import { ProtectionLevel } from '../../advanced-settings/constants';

interface ProtectionLevelModalNoticeProps {
	level: string;
}

const ProtectionLevelModalNotice: React.FC< ProtectionLevelModalNoticeProps > = ( {
	level,
} ) => {
	const modalTexts = {
		[ ProtectionLevel.BASIC ]: __(
			'Provides basic anti-fraud protection only.',
			'poocommerce-payments'
		),
		[ ProtectionLevel.STANDARD ]: __(
			"Provides a standard level of filtering that's suitable for most business.",
			'poocommerce-payments'
		),
		[ ProtectionLevel.HIGH ]: __(
			'Offers the highest level of filtering for stores, but may catch some legitimate transactions.',
			'poocommerce-payments'
		),
	};

	return (
		<Notice
			className="component-notice--is-info"
			status="info"
			isDismissible={ false }
		>
			<div className="component-notice__content--flex">
				<TipIcon className="component-notice__icon" />
				<p>{ modalTexts[ level ] }</p>
			</div>
		</Notice>
	);
};

export default ProtectionLevelModalNotice;
