/** @format */

/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { formatCurrency } from 'multi-currency/interface/functions';
import { formatDateTimeFromString } from 'wcpay/utils/date-time';

const ExpirationDescription = ( {
	feeData: { volume_allowance: volumeAllowance, end_time: endTime, ...rest },
} ) => {
	const currencyCode = rest.volume_currency ?? rest.currency;

	let description;
	if ( volumeAllowance && endTime ) {
		description = sprintf(
			/* translators: %1: total payment volume until this promotion expires %2: End date of the promotion */
			__(
				'Discounted base fee expires after the first %1$s of total payment volume or on %2$s.',
				'poocommerce-payments'
			),
			formatCurrency( volumeAllowance, currencyCode ),
			formatDateTimeFromString( endTime )
		);
	} else if ( volumeAllowance ) {
		description = sprintf(
			/* translators: %1: total payment volume until this promotion expires */
			__(
				'Discounted base fee expires after the first %1$s of total payment volume.',
				'poocommerce-payments'
			),
			formatCurrency( volumeAllowance, currencyCode )
		);
	} else if ( endTime ) {
		description = sprintf(
			/* translators: %1: End date of the promotion */
			__(
				'Discounted base fee expires on %1$s.',
				'poocommerce-payments'
			),
			formatDateTimeFromString( endTime )
		);
	} else {
		return null;
	}
	return <p className="description">{ description }</p>;
};

export default ExpirationDescription;
