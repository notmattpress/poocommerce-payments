/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { __ } from '@wordpress/i18n';

export const formatFeeType = (
	type: string,
	additionalType?: string,
	isDiscounted?: boolean
): string => {
	const feeTypes: Record< string, string | Record< string, string > > = {
		total: __( 'Total', 'poocommerce-payments' ),
		base: __( 'Base fee', 'poocommerce-payments' ),
		additional: {
			international: __(
				'International payment fee',
				'poocommerce-payments'
			),
			fx: __( 'Currency conversion fee', 'poocommerce-payments' ),
		},
	};

	const suffix = isDiscounted ? ' (discounted)' : '';

	if ( type === 'additional' && additionalType ) {
		const additionalFees = feeTypes.additional as Record< string, string >;
		return (
			( additionalFees[ additionalType ] ||
				__( 'Fee', 'poocommerce-payments' ) ) + suffix
		);
	}

	const baseType = feeTypes[ type ];
	return typeof baseType === 'string'
		? baseType + suffix
		: __( 'Fee', 'poocommerce-payments' ) + suffix;
};
