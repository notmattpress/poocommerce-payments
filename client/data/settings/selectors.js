/** @format */

/**
 * Internal dependencies
 */
import { ProtectionLevel } from '../../settings/fraud-protection/advanced-settings/constants';
import { getDefaultBorderRadius } from 'wcpay/utils/express-checkout';

const EMPTY_OBJ = {};
const EMPTY_ARR = [];

const getSettingsState = ( state ) => {
	if ( ! state ) {
		return EMPTY_OBJ;
	}

	return state.settings || EMPTY_OBJ;
};

export const getSettings = ( state ) => {
	return getSettingsState( state ).data || EMPTY_OBJ;
};

export const getDuplicatedPaymentMethodIds = ( state ) => {
	return getSettings( state ).duplicated_payment_method_ids || EMPTY_OBJ;
};

export const getIsWCPayEnabled = ( state ) => {
	return getSettings( state ).is_wcpay_enabled || false;
};

export const getEnabledPaymentMethodIds = ( state ) => {
	return getSettings( state ).enabled_payment_method_ids || EMPTY_ARR;
};

export const getAvailablePaymentMethodIds = ( state ) => {
	return getSettings( state ).available_payment_method_ids || EMPTY_ARR;
};

export const getPaymentMethodStatuses = ( state ) => {
	return getSettings( state ).payment_method_statuses || EMPTY_OBJ;
};

export const isSavingSettings = ( state ) => {
	return getSettingsState( state ).isSaving || false;
};

export const isDirty = ( state ) => {
	return getSettingsState( state ).isDirty || false;
};

export const getAccountStatementDescriptor = ( state ) => {
	return getSettings( state ).account_statement_descriptor || '';
};

export const getAccountStatementDescriptorKanji = ( state ) => {
	return getSettings( state ).account_statement_descriptor_kanji || '';
};

export const getAccountStatementDescriptorKana = ( state ) => {
	return getSettings( state ).account_statement_descriptor_kana || '';
};

export const getAccountBusinessSupportEmail = ( state ) => {
	return getSettings( state ).account_business_support_email || '';
};

export const getAccountBusinessSupportPhone = ( state ) => {
	return getSettings( state ).account_business_support_phone || '';
};

export const getAccountDomesticCurrency = ( state ) => {
	return getSettings( state ).account_domestic_currency || '';
};

export const getDepositScheduleInterval = ( state ) => {
	return getSettings( state ).deposit_schedule_interval || '';
};

export const getDepositScheduleWeeklyAnchor = ( state ) => {
	return getSettings( state ).deposit_schedule_weekly_anchor || '';
};

export const getDepositScheduleMonthlyAnchor = ( state ) => {
	return getSettings( state ).deposit_schedule_monthly_anchor || '';
};

export const getDepositDelayDays = ( state ) => {
	return getSettings( state ).deposit_delay_days || '7'; // default to 7 days
};

export const getCompletedWaitingPeriod = ( state ) => {
	return getSettings( state ).deposit_completed_waiting_period || false;
};

export const getDepositStatus = ( state ) => {
	return getSettings( state ).deposit_status || '';
};

export const getDepositRestrictions = ( state ) => {
	return getSettings( state ).deposit_restrictions || '';
};

export const getIsManualCaptureEnabled = ( state ) => {
	return getSettings( state ).is_manual_capture_enabled || false;
};

export const getIsTestModeEnabled = ( state ) => {
	return getSettings( state ).is_test_mode_enabled || false;
};

export const getIsTestModeOnboarding = ( state ) => {
	return getSettings( state ).is_test_mode_onboarding || false;
};

export const getIsDevModeEnabled = ( state ) => {
	return getSettings( state ).is_dev_mode_enabled || false;
};

export const getIsPaymentRequestEnabled = ( state ) => {
	return getSettings( state ).is_payment_request_enabled || false;
};

export const getIsDebugLogEnabled = ( state ) => {
	return getSettings( state ).is_debug_log_enabled || false;
};

export const getIsMultiCurrencyEnabled = ( state ) => {
	return getSettings( state ).is_multi_currency_enabled || false;
};

export const getPaymentRequestLocations = ( state ) => {
	return getSettings( state ).payment_request_enabled_locations || EMPTY_ARR;
};

export const getPaymentRequestButtonType = ( state ) => {
	return getSettings( state ).payment_request_button_type || '';
};

export const getPaymentRequestButtonSize = ( state ) => {
	return getSettings( state ).payment_request_button_size || '';
};

export const getPaymentRequestButtonTheme = ( state ) => {
	return getSettings( state ).payment_request_button_theme || '';
};

export const getPaymentRequestButtonBorderRadius = ( state ) => {
	const radius = getSettings( state )?.payment_request_button_border_radius;

	// We can't use a || shorthand because 0 is a valid value.
	if ( radius === 0 || radius === '0' || radius ) {
		return radius;
	}
	return getDefaultBorderRadius();
};

export const getIsSavedCardsEnabled = ( state ) => {
	return getSettings( state ).is_saved_cards_enabled || false;
};

export const getSavingError = ( state ) => {
	return getSettingsState( state ).savingError;
};

export const getIsCardPresentEligible = ( state ) => {
	return getSettings( state ).is_card_present_eligible || false;
};

export const getIsWCPaySubscriptionsEnabled = ( state ) => {
	return getSettings( state ).is_wcpay_subscriptions_enabled || false;
};

export const getIsWCPaySubscriptionsEligible = ( state ) => {
	return getSettings( state ).is_wcpay_subscriptions_eligible || false;
};

export const getIsSubscriptionsPluginActive = ( state ) => {
	return getSettings( state ).is_subscriptions_plugin_active || false;
};

export const getIsWooPayEnabled = ( state ) => {
	return getSettings( state ).is_woopay_enabled || false;
};

export const getIsWooPayGlobalThemeSupportEnabled = ( state ) => {
	return getSettings( state ).is_woopay_global_theme_support_enabled || false;
};

export const getWooPayCustomMessage = ( state ) => {
	return getSettings( state ).woopay_custom_message || '';
};

export const getWooPayStoreLogo = ( state ) => {
	return getSettings( state ).woopay_store_logo || '';
};

export const getWooPayLocations = ( state ) => {
	return getSettings( state ).woopay_enabled_locations || EMPTY_ARR;
};

export const getCurrentProtectionLevel = ( state ) => {
	return (
		getSettings( state ).current_protection_level || ProtectionLevel.BASIC
	);
};

export const getAdvancedFraudProtectionSettings = ( state ) => {
	return getSettings( state ).advanced_fraud_protection_settings || EMPTY_ARR;
};

export const getShowWooPayIncompatibilityNotice = ( state ) => {
	return getSettings( state ).show_woopay_incompatibility_notice || false;
};

export const getIsStripeBillingEnabled = ( state ) => {
	return getSettings( state ).is_stripe_billing_enabled || false;
};

export const getIsStripeBillingMigrationInProgress = ( state ) => {
	return getSettings( state ).is_migrating_stripe_billing || false;
};

export const getStripeBillingSubscriptionCount = ( state ) => {
	return getSettings( state ).stripe_billing_subscription_count || 0;
};

export const getStripeBillingMigratedCount = ( state ) => {
	return getSettings( state ).stripe_billing_migrated_count || 0;
};
