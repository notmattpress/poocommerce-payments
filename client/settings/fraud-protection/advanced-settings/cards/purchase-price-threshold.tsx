/**
 * External dependencies
 */
import React, { useContext, useMemo, SetStateAction, Dispatch } from 'react';
import { __ } from '@wordpress/i18n';
import AmountInput from 'wcpay/components/amount-input';

/**
 * Internal dependencies
 */
import { getCurrency } from 'multi-currency/interface/functions';
import FraudProtectionRuleCard from '../rule-card';
import FraudProtectionRuleToggle from '../rule-toggle';
import FraudProtectionRuleDescription from '../rule-description';
import FraudProtectionRuleCardNotice from '../rule-card-notice';
import FraudPreventionSettingsContext from '../context';
import {
	FraudPreventionPurchasePriceThresholdSetting,
	FraudPreventionSettings,
	isPurchasePriceThresholdSetting,
} from '../../interfaces';

const getFloatValue = ( value: string ) => {
	return '' === value || '0' === value ? 0 : parseFloat( value );
};

const getCurrencySymbol = () => {
	const fallbackCurrency = { symbol: '$' };

	if ( '1' !== wcpaySettings.isMultiCurrencyEnabled ) {
		return fallbackCurrency.symbol;
	}

	const currency = getCurrency( wcpaySettings.storeCurrency );
	const { symbol } =
		( currency as any )?.getCurrencyConfig() || fallbackCurrency;

	return symbol;
};

interface PurchasePriceThresholdCustomFormProps {
	setting: string;
}

const PurchasePriceThresholdCustomForm: React.FC< PurchasePriceThresholdCustomFormProps > = ( {
	setting,
} ) => {
	const {
		protectionSettingsUI,
		setProtectionSettingsUI,
		setIsDirty,
	} = useContext( FraudPreventionSettingsContext );

	const settingUI = useMemo(
		() =>
			protectionSettingsUI[
				setting
			] as FraudPreventionPurchasePriceThresholdSetting,
		[ protectionSettingsUI, setting ]
	);

	const minAmount = parseFloat( settingUI.min_amount + '' );
	const maxAmount = parseFloat( settingUI.max_amount + '' );

	const areInputsEmpty =
		! getFloatValue( minAmount + '' ) && ! getFloatValue( maxAmount + '' );
	const isMinGreaterThanMax =
		minAmount &&
		maxAmount &&
		getFloatValue( minAmount + '' ) > getFloatValue( maxAmount + '' );

	const currencySymbol = getCurrencySymbol();

	const handleAmountInputChange = ( name: string ) => ( val: string ) => {
		setProtectionSettingsUI( ( settings ) => ( {
			...settings,
			[ setting ]: {
				...settings[ setting ],
				[ name ]: val ? parseFloat( val + '' ) : null,
			},
		} ) );
		setIsDirty( true );
	};

	return (
		<div className="fraud-protection-rule-toggle-children-container">
			<strong>Limits</strong>
			<div className="fraud-protection-rule-toggle-children-horizontal-form">
				<div className="fraud-protection-rule-toggle-children-vertical-form">
					<label htmlFor="fraud-protection-purchase-price-minimum">
						{ __(
							'Minimum purchase price',
							'poocommerce-payments'
						) }
					</label>
					<AmountInput
						id={ 'fraud-protection-purchase-price-minimum' }
						prefix={ currencySymbol }
						placeholder={ '0.00' }
						value={ minAmount.toString() }
						onChange={ handleAmountInputChange( 'min_amount' ) }
						help={ __(
							'Leave blank for no limit',
							'poocommerce-payments'
						) }
					/>
				</div>
				<div className="fraud-protection-rule-toggle-children-vertical-form">
					<label htmlFor="fraud-protection-purchase-price-maximum">
						{ __(
							'Maximum purchase price',
							'poocommerce-payments'
						) }
					</label>
					<AmountInput
						id={ 'fraud-protection-purchase-price-maximum' }
						prefix={ currencySymbol }
						placeholder={ '0.00' }
						value={ maxAmount.toString() }
						onChange={ handleAmountInputChange( 'max_amount' ) }
						help={ __(
							'Leave blank for no limit',
							'poocommerce-payments'
						) }
					/>
				</div>
			</div>
			{ areInputsEmpty && (
				<div className="fraud-protection-rule-toggle-children-notice">
					<br />
					<FraudProtectionRuleCardNotice type={ 'warning' }>
						{ __(
							'A price range must be set for this filter to take effect.',
							'poocommerce-payments'
						) }
					</FraudProtectionRuleCardNotice>
				</div>
			) }
			{ isMinGreaterThanMax ? (
				<div className="fraud-protection-rule-toggle-children-notice">
					<br />
					<FraudProtectionRuleCardNotice type={ 'error' }>
						{ __(
							'Maximum purchase price must be greater than the minimum purchase price.',
							'poocommerce-payments'
						) }
					</FraudProtectionRuleCardNotice>
				</div>
			) : null }
		</div>
	);
};

const PurchasePriceThresholdRuleCard: React.FC = () => (
	<FraudProtectionRuleCard
		title={ __( 'Purchase Price Threshold', 'poocommerce-payments' ) }
		id="purchase-price-threshold-card"
	>
		<FraudProtectionRuleToggle
			setting={ 'purchase_price_threshold' }
			label={ __(
				'Enable Purchase Price Threshold filter',
				'poocommerce-payments'
			) }
			description={ __(
				'This filter compares the purchase price of an order to the minimum and maximum purchase amounts that you specify. ' +
					'When enabled the payment will be blocked.',
				'poocommerce-payments'
			) }
		>
			<PurchasePriceThresholdCustomForm
				setting={ 'purchase_price_threshold' }
			/>
		</FraudProtectionRuleToggle>
		<FraudProtectionRuleDescription>
			{ __(
				'An unusually high purchase amount, compared to the average for your business, ' +
					'can indicate potential fraudulent activity.',
				'poocommerce-payments'
			) }
		</FraudProtectionRuleDescription>
	</FraudProtectionRuleCard>
);

export const PurchasePriceThresholdValidation = (
	setting: FraudPreventionSettings,
	setValidationError: Dispatch< SetStateAction< string | null > >
): boolean => {
	if ( setting.enabled && isPurchasePriceThresholdSetting( setting ) ) {
		const { min_amount: minAmount, max_amount: maxAmount } = setting;

		const minAmountFloat = getFloatValue( minAmount + '' );
		const maxAmountFloat = getFloatValue( maxAmount + '' );

		if ( ! minAmountFloat && ! maxAmountFloat ) {
			setValidationError(
				__(
					'A price range must be set for the "Purchase Price threshold" filter.',
					'poocommerce-payments'
				)
			);
			return false;
		}

		if ( minAmount && maxAmount && minAmountFloat > maxAmountFloat ) {
			setValidationError(
				__(
					'Maximum purchase price must be greater than the minimum purchase price.',
					'poocommerce-payments'
				)
			);
			return false;
		}
	}
	return true;
};

export default PurchasePriceThresholdRuleCard;
