/** @format */

/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import interpolateComponents from '@automattic/interpolate-components';
import './account-fees.scss';

/**
 * Internal dependencies
 */
import { formatCurrency } from 'multi-currency/interface/functions';
import { formatFee } from 'utils/fees';
import React from 'react';
import { BaseFee, DiscountFee, FeeStructure } from 'wcpay/types/fees';
import { createInterpolateElement } from '@wordpress/element';
import { ExternalLink } from 'wcpay/components/wp-components-wrapped/components/external-link';
import PAYMENT_METHOD_IDS from 'constants/payment-method';

const countryFeeStripeDocsBaseLink =
	'https://poocommerce.com/document/woopayments/fees-and-debits/fees/#';
const countryFeeStripeDocsBaseLinkNoCountry =
	'https://poocommerce.com/document/woopayments/fees-and-debits/fees/';
const countryFeeStripeDocsSectionNumbers: Record< string, string > = {
	AE: 'united-arab-emirates',
	AU: 'australia',
	AT: 'austria',
	BE: 'belgium',
	BG: 'bulgaria',
	CA: 'canada',
	CY: 'cyprus',
	CZ: 'czech-republic',
	FR: 'france',
	LU: 'luxembourg',
	DE: 'germany',
	DK: 'denmark',
	EE: 'estonia',
	FI: 'finland',
	GR: 'greece',
	HK: 'hong-kong',
	HR: 'croatia',
	HU: 'hungary',
	IE: 'ireland',
	IT: 'italy',
	JP: 'japan',
	LT: 'lithuania',
	LV: 'latvia',
	MT: 'malta',
	NL: 'netherlands',
	NO: 'norway',
	NZ: 'new-zealand',
	PL: 'poland',
	PT: 'portugal',
	SG: 'singapore',
	SI: 'slovenia',
	SK: 'slovakia',
	SW: 'sweden',
	ES: 'spain',
	CH: 'switzerland',
	UK: 'united-kingdom',
	US: 'united-states',
	RO: 'romania',
};

const stripeFeeSectionExistsForCountry = ( country: string ): boolean => {
	return countryFeeStripeDocsSectionNumbers.hasOwnProperty( country );
};

const getStripeFeeSectionUrl = ( country: string ): string => {
	return sprintf(
		'%s%s',
		countryFeeStripeDocsBaseLink,
		countryFeeStripeDocsSectionNumbers[ country ]
	);
};

const getFeeDescriptionString = (
	fee: BaseFee,
	discountBasedMultiplier = 1
): string => {
	if ( fee.fixed_rate && fee.percentage_rate ) {
		return sprintf(
			'%1$f%% + %2$s',
			formatFee( fee.percentage_rate * discountBasedMultiplier ),
			formatCurrency(
				fee.fixed_rate * discountBasedMultiplier,
				fee.currency
			)
		);
	} else if ( fee.fixed_rate ) {
		return sprintf(
			'%1$s',
			formatCurrency(
				fee.fixed_rate * discountBasedMultiplier,
				fee.currency
			)
		);
	} else if ( fee.percentage_rate ) {
		return sprintf(
			'%1$f%%',
			formatFee( fee.percentage_rate * discountBasedMultiplier )
		);
	}
	return '';
};

export const getCurrentBaseFee = (
	accountFees: FeeStructure
): BaseFee | DiscountFee => {
	return accountFees.discount.length
		? accountFees.discount[ 0 ]
		: accountFees.base;
};

export const formatMethodFeesTooltip = (
	accountFees?: FeeStructure
): JSX.Element => {
	if ( ! accountFees ) return <></>;

	const discountAdjustedFeeRate: number =
		accountFees.discount.length && accountFees.discount[ 0 ].discount
			? 1 - accountFees.discount[ 0 ].discount
			: 1;

	// Per https://poocommerce.com/terms-conditions/woopayments-promotion-2023/ we exclude FX fees from discounts.
	const total = {
		percentage_rate:
			accountFees.base.percentage_rate * discountAdjustedFeeRate +
			accountFees.additional.percentage_rate * discountAdjustedFeeRate +
			accountFees.fx.percentage_rate,
		fixed_rate:
			accountFees.base.fixed_rate * discountAdjustedFeeRate +
			accountFees.additional.fixed_rate * discountAdjustedFeeRate +
			accountFees.fx.fixed_rate,
		currency: accountFees.base.currency,
	};

	const hasFees = ( fee: BaseFee ): boolean => {
		return fee.fixed_rate > 0.0 || fee.percentage_rate > 0.0;
	};

	return (
		<div className={ 'wcpay-fees-tooltip' }>
			<div>
				<div>{ __( 'Base fee', 'poocommerce-payments' ) }</div>
				<div>
					{ getFeeDescriptionString(
						accountFees.base,
						discountAdjustedFeeRate
					) }
				</div>
			</div>
			{ hasFees( accountFees.additional ) ? (
				<div>
					<div>
						{ __(
							'International payment method fee',
							'poocommerce-payments'
						) }
					</div>
					<div>
						{ getFeeDescriptionString(
							accountFees.additional,
							discountAdjustedFeeRate
						) }
					</div>
				</div>
			) : (
				''
			) }
			{ hasFees( accountFees.fx ) ? (
				<div>
					<div>
						{ __(
							'Currency conversion fee',
							'poocommerce-payments'
						) }
					</div>
					<div>{ getFeeDescriptionString( accountFees.fx ) }</div>
				</div>
			) : (
				''
			) }
			<div>
				<div>
					{ __( 'Total per transaction', 'poocommerce-payments' ) }
				</div>
				<div className={ 'wcpay-fees-tooltip__bold' }>
					{ getFeeDescriptionString( total ) }
				</div>
			</div>
			{ wcpaySettings &&
			wcpaySettings.connect &&
			wcpaySettings.connect.country ? (
				<div className="wcpay-fees-tooltip__hint-text">
					<span>
						{ stripeFeeSectionExistsForCountry(
							wcpaySettings.connect.country
						)
							? interpolateComponents( {
									mixedString: sprintf(
										/* translators: %s: WooPayments */
										__(
											'{{linkToStripePage /}} about %s Fees in your country',
											'poocommerce-payments'
										),
										'WooPayments'
									),
									components: {
										linkToStripePage: (
											<ExternalLink
												href={ getStripeFeeSectionUrl(
													wcpaySettings.connect
														.country
												) }
											>
												{ __(
													'Learn more',
													'poocommerce-payments'
												) }
											</ExternalLink>
										),
									},
							  } )
							: interpolateComponents( {
									mixedString: sprintf(
										/* translators: %s: WooPayments */
										__(
											'{{linkToStripePage /}} about %s Fees',
											'poocommerce-payments'
										),
										'WooPayments'
									),
									components: {
										linkToStripePage: (
											<ExternalLink
												href={
													countryFeeStripeDocsBaseLinkNoCountry
												}
											>
												{ __(
													'Learn more',
													'poocommerce-payments'
												) }
											</ExternalLink>
										),
									},
							  } ) }
					</span>
				</div>
			) : (
				''
			) }
		</div>
	);
};

export const formatAccountFeesDescription = (
	accountFees: FeeStructure,
	customFormats = {}
): string | JSX.Element => {
	const baseFee = accountFees.base;
	const currentBaseFee = getCurrentBaseFee( accountFees );

	// Default formats will be used if no matching field was passed in the `formats` parameter.
	const formats = {
		/* translators: %1: Percentage part of the fee. %2: Fixed part of the fee */
		fee: __( '%1$f%% + %2$s per transaction', 'poocommerce-payments' ),
		/* translators: %f percentage discount to apply */
		discount: __( '(%f%% discount)', 'poocommerce-payments' ),
		displayBaseFeeIfDifferent: true,
		...customFormats,
	};

	const feeDescription = sprintf(
		formats.fee,
		formatFee( baseFee.percentage_rate ),
		formatCurrency( baseFee.fixed_rate, baseFee.currency )
	);
	const isFormattingWithDiscount =
		currentBaseFee.percentage_rate !== baseFee.percentage_rate ||
		currentBaseFee.fixed_rate !== baseFee.fixed_rate ||
		currentBaseFee.currency !== baseFee.currency;
	if ( isFormattingWithDiscount ) {
		const discountFee = currentBaseFee as DiscountFee;
		// TODO: Figure out how the UI should work if there are several "discount" fees stacked.
		let percentage, fixed;

		if ( discountFee.discount ) {
			// Proper discount fee (XX% off)
			percentage = baseFee.percentage_rate * ( 1 - discountFee.discount );
			fixed = baseFee.fixed_rate * ( 1 - discountFee.discount );
		} else {
			// Custom base fee (2% + $.20)
			percentage = currentBaseFee.percentage_rate;
			fixed = currentBaseFee.fixed_rate;
		}

		let currentBaseFeeDescription = sprintf(
			formats.fee,
			formatFee( percentage ),
			formatCurrency( fixed, baseFee.currency )
		);

		if ( formats.displayBaseFeeIfDifferent ) {
			currentBaseFeeDescription = sprintf(
				// eslint-disable-next-line max-len
				/* translators: %1 Base fee (that don't apply to this account at this moment), %2: Current fee (e.g: "2.9% + $.30 per transaction") */
				__( '<s>%1$s</s> %2$s', 'poocommerce-payments' ),
				feeDescription,
				currentBaseFeeDescription
			);
		}

		if ( discountFee.discount && 0 < formats.discount.length ) {
			currentBaseFeeDescription +=
				' ' +
				sprintf( formats.discount, formatFee( discountFee.discount ) );
		}

		const conversionMap: Record< string, any > = {
			s: <s />,
		};

		return createInterpolateElement(
			currentBaseFeeDescription,
			conversionMap
		);
	}

	return feeDescription;
};

export const formatMethodFeesDescription = (
	methodFees: FeeStructure | undefined
): string | JSX.Element => {
	if ( ! methodFees ) {
		return __( 'missing fees', 'poocommerce-payments' );
	}

	/* translators: %1: Percentage part of the fee. %2: Fixed part of the fee */
	const format = __( 'From %1$f%% + %2$s', 'poocommerce-payments' );

	return formatAccountFeesDescription( methodFees, {
		fee: format,
		discount: '',
		displayBaseFeeIfDifferent: false,
	} );
};

export const getTransactionsPaymentMethodName = (
	paymentMethod: PAYMENT_METHOD_IDS
): string => {
	// Special cases that won't be in wooPaymentsPaymentMethodsConfig
	// `card` WILL be in that config, but it's title is "Cards" and we want to show "Card transactions."
	switch ( paymentMethod ) {
		case 'card':
			return __( 'Card transactions', 'poocommerce-payments' );
		case 'card_present':
			return __( 'In-person transactions', 'poocommerce-payments' );
	}

	// Try to get the title from wooPaymentsPaymentMethodsConfig
	const methodConfig = wooPaymentsPaymentMethodsConfig[ paymentMethod ];
	if ( methodConfig?.title ) {
		return sprintf(
			/* translators: %s: Payment method title */
			__( '%s transactions', 'poocommerce-payments' ),
			methodConfig.title
		);
	}

	// Fallback for unknown payment methods
	return __( 'Unknown transactions', 'poocommerce-payments' );
};
