/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * FLAG: PAYMENT_METHODS_LIST
 * New payment methods should be added here, the value should match the definition ID.
 */
enum PAYMENT_METHOD_IDS {
	AFFIRM = 'affirm',
	AFTERPAY_CLEARPAY = 'afterpay_clearpay',
	ALIPAY = 'alipay',
	AMAZON_PAY = 'amazon_pay',
	APPLE_PAY = 'apple_pay',
	AU_BECS_DEBIT = 'au_becs_debit',
	BANCONTACT = 'bancontact',
	CARD = 'card',
	CARD_PRESENT = 'card_present',
	EPS = 'eps',
	GIROPAY = 'giropay',
	GOOGLE_PAY = 'google_pay',
	GRABPAY = 'grabpay',
	IDEAL = 'ideal',
	KLARNA = 'klarna',
	LINK = 'link',
	MULTIBANCO = 'multibanco',
	P24 = 'p24',
	SEPA_DEBIT = 'sepa_debit',
	SOFORT = 'sofort',
	WECHAT_PAY = 'wechat_pay',
}

export enum PAYMENT_METHOD_BRANDS {
	AMEX = 'amex',
	CARTES_BANCAIRES = 'cartes_bancaires',
	DINERS = 'diners',
	DISCOVER = 'discover',
	JCB = 'jcb',
	MASTERCARD = 'mastercard',
	UNIONPAY = 'unionpay',
	VISA = 'visa',
}

// This constant is used for rendering tooltip titles for "payment methods" in transaction list and details pages.
// eslint-disable-next-line @typescript-eslint/naming-convention
export const TRANSACTION_PAYMENT_METHOD_TITLES = {
	ach_credit_transfer: __( 'ACH Credit Transfer', 'poocommerce-payments' ),
	ach_debit: __( 'ACH Debit', 'poocommerce-payments' ),
	acss_debit: __( 'ACSS Debit', 'poocommerce-payments' ),
	amazon_pay: __( 'Amazon Pay', 'poocommerce-payments' ),
	amex: __( 'American Express', 'poocommerce-payments' ),
	card: __( 'Card Payment', 'poocommerce-payments' ),
	card_present: __( 'In-Person Card Payment', 'poocommerce-payments' ),
	cartes_bancaires: __( 'Cartes Bancaires', 'poocommerce-payments' ),
	diners: __( 'Diners Club', 'poocommerce-payments' ),
	discover: __( 'Discover', 'poocommerce-payments' ),
	jcb: __( 'JCB', 'poocommerce-payments' ),
	mastercard: __( 'Mastercard', 'poocommerce-payments' ),
	stripe_account: __( 'Stripe Account', 'poocommerce-payments' ),
	unionpay: __( 'Union Pay', 'poocommerce-payments' ),
	visa: __( 'Visa', 'poocommerce-payments' ),
};

export default PAYMENT_METHOD_IDS;
