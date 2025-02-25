/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

enum PAYMENT_METHOD_IDS {
	AFFIRM = 'affirm',
	AFTERPAY_CLEARPAY = 'afterpay_clearpay',
	AU_BECS_DEBIT = 'au_becs_debit',
	BANCONTACT = 'bancontact',
	CARD = 'card',
	CARD_PRESENT = 'card_present',
	EPS = 'eps',
	KLARNA = 'klarna',
	GIROPAY = 'giropay',
	IDEAL = 'ideal',
	LINK = 'link',
	P24 = 'p24',
	SEPA_DEBIT = 'sepa_debit',
	SOFORT = 'sofort',
}

const accountCountry = window.wcpaySettings?.accountStatus?.country || 'US';
// This constant is used for rendering tooltip titles for payment methods in transaction list and details pages.
// eslint-disable-next-line @typescript-eslint/naming-convention
export const PAYMENT_METHOD_TITLES = {
	ach_credit_transfer: __( 'ACH Credit Transfer', 'poocommerce-payments' ),
	ach_debit: __( 'ACH Debit', 'poocommerce-payments' ),
	acss_debit: __( 'ACSS Debit', 'poocommerce-payments' ),
	affirm: __( 'Affirm', 'poocommerce-payments' ),
	afterpay_clearpay:
		'GB' === accountCountry
			? __( 'Clearpay', 'poocommerce-payments' )
			: __( 'Afterpay', 'poocommerce-payments' ),
	alipay: __( 'Alipay', 'poocommerce-payments' ),
	amex: __( 'American Express', 'poocommerce-payments' ),
	au_becs_debit: __( 'AU BECS Debit', 'poocommerce-payments' ),
	bancontact: __( 'Bancontact', 'poocommerce-payments' ),
	card: __( 'Card Payment', 'poocommerce-payments' ),
	card_present: __( 'In-Person Card Payment', 'poocommerce-payments' ),
	cartes_bancaires: __( 'Cartes Bancaires', 'poocommerce-payments' ),
	diners: __( 'Diners Club', 'poocommerce-payments' ),
	discover: __( 'Discover', 'poocommerce-payments' ),
	eps: __( 'EPS', 'poocommerce-payments' ),
	giropay: __( 'giropay', 'poocommerce-payments' ),
	ideal: __( 'iDEAL', 'poocommerce-payments' ),
	jcb: __( 'JCB', 'poocommerce-payments' ),
	klarna: __( 'Klarna', 'poocommerce-payments' ),
	link: __( 'Link', 'poocommerce-payments' ),
	mastercard: __( 'Mastercard', 'poocommerce-payments' ),
	multibanco: __( 'Multibanco', 'poocommerce-payments' ),
	p24: __( 'P24', 'poocommerce-payments' ),
	sepa_debit: __( 'SEPA Debit', 'poocommerce-payments' ),
	sofort: __( 'SOFORT', 'poocommerce-payments' ),
	stripe_account: __( 'Stripe Account', 'poocommerce-payments' ),
	unionpay: __( 'Union Pay', 'poocommerce-payments' ),
	visa: __( 'Visa', 'poocommerce-payments' ),
	wechat: __( 'WeChat', 'poocommerce-payments' ),
};

export default PAYMENT_METHOD_IDS;
