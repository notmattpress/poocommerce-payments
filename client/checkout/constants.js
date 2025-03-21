export const PAYMENT_METHOD_NAME_CARD = 'poocommerce_payments';
export const PAYMENT_METHOD_NAME_ALIPAY = 'poocommerce_payments_alipay';
export const PAYMENT_METHOD_NAME_BANCONTACT = 'poocommerce_payments_bancontact';
export const PAYMENT_METHOD_NAME_BECS = 'poocommerce_payments_au_becs_debit';
export const PAYMENT_METHOD_NAME_EPS = 'poocommerce_payments_eps';
export const PAYMENT_METHOD_NAME_GIROPAY = 'poocommerce_payments_giropay';
export const PAYMENT_METHOD_NAME_IDEAL = 'poocommerce_payments_ideal';
export const PAYMENT_METHOD_NAME_P24 = 'poocommerce_payments_p24';
export const PAYMENT_METHOD_NAME_SEPA = 'poocommerce_payments_sepa_debit';
export const PAYMENT_METHOD_NAME_SOFORT = 'poocommerce_payments_sofort';
export const PAYMENT_METHOD_NAME_AFFIRM = 'poocommerce_payments_affirm';
export const PAYMENT_METHOD_NAME_AFTERPAY =
	'poocommerce_payments_afterpay_clearpay';
export const PAYMENT_METHOD_NAME_KLARNA = 'poocommerce_payments_klarna';
export const PAYMENT_METHOD_NAME_MULTIBANCO = 'poocommerce_payments_multibanco';
export const PAYMENT_METHOD_NAME_GRABPAY = 'poocommerce_payments_grabpay';
export const PAYMENT_METHOD_NAME_WECHAT_PAY = 'poocommerce_payments_wechat_pay';
export const PAYMENT_METHOD_NAME_EXPRESS_CHECKOUT_ELEMENT =
	'poocommerce_payments_express_checkout';
export const PAYMENT_METHOD_NAME_WOOPAY_EXPRESS_CHECKOUT =
	'poocommerce_payments_woopay_express_checkout';
export const PAYMENT_METHOD_ERROR = 'poocommerce_payments_payment_method_error';
export const WC_STORE_CART = 'wc/store/cart';

export function getPaymentMethodsConstants() {
	return [
		PAYMENT_METHOD_NAME_ALIPAY,
		PAYMENT_METHOD_NAME_BANCONTACT,
		PAYMENT_METHOD_NAME_BECS,
		PAYMENT_METHOD_NAME_EPS,
		PAYMENT_METHOD_NAME_GIROPAY,
		PAYMENT_METHOD_NAME_IDEAL,
		PAYMENT_METHOD_NAME_P24,
		PAYMENT_METHOD_NAME_SEPA,
		PAYMENT_METHOD_NAME_SOFORT,
		PAYMENT_METHOD_NAME_AFFIRM,
		PAYMENT_METHOD_NAME_AFTERPAY,
		PAYMENT_METHOD_NAME_CARD,
		PAYMENT_METHOD_NAME_KLARNA,
		PAYMENT_METHOD_NAME_MULTIBANCO,
		PAYMENT_METHOD_NAME_GRABPAY,
		PAYMENT_METHOD_NAME_WECHAT_PAY,
	];
}

export const SHORTCODE_SHIPPING_ADDRESS_FIELDS = {
	address_1: 'shipping_address_1',
	address_2: 'shipping_address_2',
	city: 'shipping_city',
	state: 'shipping_state',
	postcode: 'shipping_postcode',
	country: 'shipping_country',
	first_name: 'shipping_first_name',
	last_name: 'shipping_last_name',
};
export const SHORTCODE_BILLING_ADDRESS_FIELDS = {
	address_1: 'billing_address_1',
	address_2: 'billing_address_2',
	city: 'billing_city',
	state: 'billing_state',
	postcode: 'billing_postcode',
	country: 'billing_country',
	first_name: 'billing_first_name',
	last_name: 'billing_last_name',
};
