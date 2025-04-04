/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';

/**
 * Internal dependencies
 */

import {
	AffirmIcon,
	AfterpayIcon,
	ClearpayIcon,
	BancontactIcon,
	BankDebitIcon,
	CreditCardIcon,
	EpsIcon,
	GiropayIcon,
	IdealIcon,
	JCBIcon,
	KlarnaIcon,
	P24Icon,
	SepaIcon,
	SofortIcon,
	MultibancoIcon,
	GrabPayIcon,
	WeChatPayIcon,
} from 'wcpay/payment-methods-icons';

const accountCountry = window.wcpaySettings?.accountStatus?.country || 'US';

import type { PaymentMethodMapEntry } from './types/payment-methods';

// Get any payment method definitions from the client.
const PaymentMethodDefinitions =
	typeof wooPaymentsPaymentMethodDefinitions !== 'undefined'
		? wooPaymentsPaymentMethodDefinitions
		: {};

const convertedPaymentMethodDefinitions = Object.fromEntries<
	PaymentMethodMapEntry
>(
	Object.entries( PaymentMethodDefinitions ).map( ( [ key, value ] ) => [
		key,
		{
			id: value.id,
			label: value.title,
			description: value.description,
			icon: ( { className } ) => (
				<img
					src={ value.settings_icon_url }
					alt={ value.title }
					className={ classNames(
						'payment-method__icon',
						className
					) }
				/>
			),
			currencies: value.currencies,
			stripe_key: value.stripe_key,
			allows_manual_capture: value.allows_manual_capture,
			allows_pay_later: value.allows_pay_later,
			accepts_only_domestic_payment: value.accepts_only_domestic_payment,
		},
	] )
);

const PaymentMethodInformationObject: Record<
	string,
	PaymentMethodMapEntry
> = {
	card: {
		id: 'card',
		label: __( 'Credit / Debit Cards', 'poocommerce-payments' ),
		description: __(
			'Let your customers pay with major credit and debit cards without leaving your store.',
			'poocommerce-payments'
		),
		icon: CreditCardIcon,
		currencies: [],
		stripe_key: 'card_payments',
		allows_manual_capture: true,
		allows_pay_later: false,
		accepts_only_domestic_payment: false,
	},
	au_becs_debit: {
		id: 'au_becs_debit',
		label: __( 'BECS Direct Debit', 'poocommerce-payments' ),
		description: __(
			'Bulk Electronic Clearing System — Accept secure bank transfer from Australia.',
			'poocommerce-payments'
		),
		icon: BankDebitIcon,
		currencies: [ 'AUD' ],
		stripe_key: 'au_becs_debit_payments',
		allows_manual_capture: false,
		allows_pay_later: false,
		accepts_only_domestic_payment: false,
	},
	bancontact: {
		id: 'bancontact',
		label: __( 'Bancontact', 'poocommerce-payments' ),
		description: __(
			'Bancontact is a bank redirect payment method offered by more than 80% of online businesses in Belgium.',
			'poocommerce-payments'
		),
		icon: BancontactIcon,
		currencies: [ 'EUR' ],
		stripe_key: 'bancontact_payments',
		allows_manual_capture: false,
		allows_pay_later: false,
		accepts_only_domestic_payment: false,
	},
	eps: {
		id: 'eps',
		label: __( 'EPS', 'poocommerce-payments' ),
		description: __(
			'Accept your payment with EPS — a common payment method in Austria.',
			'poocommerce-payments'
		),
		icon: EpsIcon,
		currencies: [ 'EUR' ],
		stripe_key: 'eps_payments',
		allows_manual_capture: false,
		allows_pay_later: false,
		accepts_only_domestic_payment: false,
	},
	giropay: {
		id: 'giropay',
		label: __( 'giropay', 'poocommerce-payments' ),
		description: __(
			'Expand your business with giropay — Germany’s second most popular payment system.',
			'poocommerce-payments'
		),
		icon: GiropayIcon,
		currencies: [ 'EUR' ],
		stripe_key: 'giropay_payments',
		allows_manual_capture: false,
		allows_pay_later: false,
		accepts_only_domestic_payment: false,
	},
	ideal: {
		id: 'ideal',
		label: __( 'iDEAL', 'poocommerce-payments' ),
		description: __(
			'Expand your business with iDEAL — Netherlands’s most popular payment method.',
			'poocommerce-payments'
		),
		icon: IdealIcon,
		currencies: [ 'EUR' ],
		stripe_key: 'ideal_payments',
		allows_manual_capture: false,
		allows_pay_later: false,
		accepts_only_domestic_payment: false,
	},
	p24: {
		id: 'p24',
		label: __( 'Przelewy24 (P24)', 'poocommerce-payments' ),
		description: __(
			'Accept payments with Przelewy24 (P24), the most popular payment method in Poland.',
			'poocommerce-payments'
		),
		icon: P24Icon,
		currencies: [ 'EUR', 'PLN' ],
		stripe_key: 'p24_payments',
		allows_manual_capture: false,
		allows_pay_later: false,
		accepts_only_domestic_payment: false,
	},
	sepa_debit: {
		id: 'sepa_debit',
		label: __( 'SEPA Direct Debit', 'poocommerce-payments' ),
		description: __(
			'Reach 500 million customers and over 20 million businesses across the European Union.',
			'poocommerce-payments'
		),
		icon: SepaIcon,
		currencies: [ 'EUR' ],
		stripe_key: 'sepa_debit_payments',
		allows_manual_capture: false,
		allows_pay_later: false,
		accepts_only_domestic_payment: false,
	},
	sofort: {
		id: 'sofort',
		label: __( 'Sofort', 'poocommerce-payments' ),
		description: __(
			'Accept secure bank transfers from Austria, Belgium, Germany, Italy, Netherlands, and Spain.',
			'poocommerce-payments'
		),
		icon: SofortIcon,
		currencies: [ 'EUR' ],
		stripe_key: 'sofort_payments',
		allows_manual_capture: false,
		allows_pay_later: false,
		accepts_only_domestic_payment: false,
	},
	multibanco: {
		id: 'multibanco',
		label: __( 'Multibanco', 'poocommerce-payments' ),
		description: __(
			'A voucher based payment method for your customers in Portugal.',
			'poocommerce-payments'
		),
		icon: MultibancoIcon,
		currencies: [ 'EUR' ],
		stripe_key: 'multibanco_payments',
		allows_manual_capture: false,
		allows_pay_later: false,
		accepts_only_domestic_payment: false,
	},
	affirm: {
		id: 'affirm',
		label: __( 'Affirm', 'poocommerce-payments' ),
		description: __(
			'Allow customers to pay over time with Affirm.',
			'poocommerce-payments'
		),
		icon: AffirmIcon,
		currencies: [ 'USD', 'CAD' ],
		stripe_key: 'affirm_payments',
		allows_manual_capture: false,
		allows_pay_later: true,
		accepts_only_domestic_payment: true,
	},
	afterpay_clearpay: {
		id: 'afterpay_clearpay',
		label:
			'GB' === accountCountry
				? __( 'Clearpay', 'poocommerce-payments' )
				: __( 'Afterpay', 'poocommerce-payments' ),
		description:
			'GB' === accountCountry
				? __(
						'Allow customers to pay over time with Clearpay.',
						'poocommerce-payments'
				  )
				: __(
						'Allow customers to pay over time with Afterpay.',
						'poocommerce-payments'
				  ),
		icon: 'GB' === accountCountry ? ClearpayIcon : AfterpayIcon,
		currencies: [ 'USD', 'AUD', 'CAD', 'NZD', 'GBP' ],
		stripe_key: 'afterpay_clearpay_payments',
		allows_manual_capture: false,
		allows_pay_later: true,
		accepts_only_domestic_payment: true,
	},
	jcb: {
		id: 'jcb',
		label: __( 'JCB', 'poocommerce-payments' ),
		description: __(
			'Let your customers pay with JCB, the only international payment brand based in Japan.',
			'poocommerce-payments'
		),
		icon: JCBIcon,
		currencies: [ 'JPY' ],
		stripe_key: 'jcb_payments',
		allows_manual_capture: false,
		allows_pay_later: false,
		accepts_only_domestic_payment: false,
	},
	klarna: {
		id: 'klarna',
		label: __( 'Klarna', 'poocommerce-payments' ),
		description: __(
			'Allow customers to pay over time or pay now with Klarna.',
			'poocommerce-payments'
		),
		icon: KlarnaIcon,
		currencies: [ 'EUR', 'GBP', 'USD', 'DKK', 'NOK', 'SEK' ],
		stripe_key: 'klarna_payments',
		allows_manual_capture: false,
		allows_pay_later: true,
		accepts_only_domestic_payment: true,
	},
	grabpay: {
		id: 'grabpay',
		label: __( 'GrabPay', 'poocommerce-payments' ),
		description: __(
			'A popular digital wallet for cashless payments in Singapore.',
			'poocommerce-payments'
		),
		icon: GrabPayIcon,
		currencies: [ 'SGD' ],
		stripe_key: 'grabpay_payments',
		allows_manual_capture: false,
		allows_pay_later: false,
		accepts_only_domestic_payment: false,
	},
	wechat_pay: {
		id: 'wechat_pay',
		label: __( 'WeChat Pay', 'poocommerce-payments' ),
		description: __(
			'A digital wallet popular with customers from China.',
			'poocommerce-payments'
		),
		icon: WeChatPayIcon,
		currencies: [
			'USD',
			'CNY',
			'AUD',
			'CAD',
			'EUR',
			'GBP',
			'HKD',
			'JPY',
			'SGD',
			'DKK',
			'NOK',
			'SEK',
			'CHF',
		],
		stripe_key: 'wechat_pay_payments',
		allows_manual_capture: false,
		allows_pay_later: false,
		accepts_only_domestic_payment: false,
	},
	...convertedPaymentMethodDefinitions,
};

export default PaymentMethodInformationObject;
