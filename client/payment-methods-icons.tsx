/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import BancontactAsset from 'assets/images/payment-methods/bancontact.svg?asset';
import EpsAsset from 'assets/images/payment-methods/eps.svg?asset';
import GiropayAsset from 'assets/images/payment-methods/giropay.svg?asset';
import SofortAsset from 'assets/images/payment-methods/sofort.svg?asset';
import SepaAsset from 'assets/images/payment-methods/sepa-debit.svg?asset';
import P24Asset from 'assets/images/payment-methods/p24.svg?asset';
import IdealAsset from 'assets/images/payment-methods/ideal.svg?asset';
import BankDebitAsset from 'assets/images/payment-methods/bank-debit.svg?asset';
import AffirmAsset from 'assets/images/payment-methods/affirm-badge.svg?asset';
import AfterpayAsset from 'assets/images/payment-methods/afterpay-logo.svg?asset';
import ClearpayAsset from 'assets/images/payment-methods/clearpay.svg?asset';
import JCBAsset from 'assets/images/payment-methods/jcb.svg?asset';
import KlarnaAsset from 'assets/images/payment-methods/klarna.svg?asset';
import GrabPayAsset from 'assets/images/payment-methods/grabpay.svg?asset';
import VisaAsset from 'assets/images/cards/visa.svg?asset';
import MasterCardAsset from 'assets/images/cards/mastercard.svg?asset';
import MultibancoAsset from 'assets/images/payment-methods/multibanco.svg?asset';
import AmexAsset from 'assets/images/cards/amex.svg?asset';
import WooAsset from 'assets/images/payment-methods/woo.svg?asset';
import WooAssetShort from 'assets/images/payment-methods/woo-short.svg?asset';
import ApplePayAsset from 'assets/images/cards/apple-pay.svg?asset';
import GooglePayAsset from 'assets/images/cards/google-pay.svg?asset';
import DinersClubAsset from 'assets/images/cards/diners.svg?asset';
import DiscoverAsset from 'assets/images/cards/discover.svg?asset';
import CBAsset from 'assets/images/cards/cb.svg?asset';
import UnionPayAsset from 'assets/images/cards/unionpay.svg?asset';
import LinkAsset from 'assets/images/payment-methods/link.svg?asset';
import CreditCardAsset from 'assets/images/payment-methods/cc.svg?asset';
import WeChatPayAsset from 'assets/images/payment-methods/wechat-pay.svg?asset';
import './style.scss';

const iconComponent = (
	src: string,
	alt: string,
	border = true
): ReactImgFuncComponent => ( { className, ...props } ) => (
	<img
		className={ classNames(
			'payment-method__icon',
			border ? '' : 'no-border',
			className
		) }
		src={ src }
		alt={ alt }
		{ ...props }
	/>
);

export const AffirmIcon = iconComponent(
	AffirmAsset,
	__( 'Affirm', 'poocommerce-payments' )
);
export const AfterpayIcon = iconComponent(
	AfterpayAsset,
	__( 'Afterpay', 'poocommerce-payments' )
);
export const ClearpayIcon = iconComponent(
	ClearpayAsset,
	__( 'Clearpay', 'poocommerce-payments' )
);
export const AmericanExpressIcon = iconComponent(
	AmexAsset,
	__( 'American Express', 'poocommerce-payments' )
);
export const ApplePayIcon = iconComponent(
	ApplePayAsset,
	__( 'Apple Pay', 'poocommerce-payments' )
);
export const BancontactIcon = iconComponent(
	BancontactAsset,
	__( 'Bancontact', 'poocommerce-payments' )
);
export const BankDebitIcon = iconComponent(
	BankDebitAsset,
	__( 'BECS Direct Debit', 'poocommerce-payments' )
);
export const CreditCardIcon = iconComponent(
	CreditCardAsset,
	__( 'Credit card / Debit card', 'poocommerce-payments' ),
	false
);
export const CBIcon = iconComponent(
	CBAsset,
	__( 'Cartes Bancaires', 'poocommerce-payments' )
);
export const DinersClubIcon = iconComponent(
	DinersClubAsset,
	__( 'Diners Club', 'poocommerce-payments' )
);
export const DiscoverIcon = iconComponent(
	DiscoverAsset,
	__( 'Discover', 'poocommerce-payments' )
);
export const EpsIcon = iconComponent(
	EpsAsset,
	__( 'BECS Direct Debit', 'poocommerce-payments' )
);
export const GiropayIcon = iconComponent(
	GiropayAsset,
	__( 'Giropay', 'poocommerce-payments' )
);
export const GooglePayIcon = iconComponent(
	GooglePayAsset,
	__( 'Google Pay', 'poocommerce-payments' )
);
export const IdealIcon = iconComponent(
	IdealAsset,
	__( 'iDEAL', 'poocommerce-payments' )
);
export const JCBIcon = iconComponent(
	JCBAsset,
	__( 'JCB', 'poocommerce-payments' )
);
export const KlarnaIcon = iconComponent(
	KlarnaAsset,
	__( 'Klarna', 'poocommerce-payments' )
);
export const LinkIcon = iconComponent(
	LinkAsset,
	__( 'Link', 'poocommerce-payments' )
);
export const MastercardIcon = iconComponent(
	MasterCardAsset,
	__( 'Mastercard', 'poocommerce-payments' )
);
export const MultibancoIcon = iconComponent(
	MultibancoAsset,
	__( 'Multibanco', 'poocommerce-payments' )
);
export const P24Icon = iconComponent(
	P24Asset,
	__( 'Przelewy24 (P24)', 'poocommerce-payments' )
);
export const SepaIcon = iconComponent(
	SepaAsset,
	__( 'SEPA Direct Debit', 'poocommerce-payments' )
);
export const SofortIcon = iconComponent(
	SofortAsset,
	__( 'Sofort', 'poocommerce-payments' )
);
export const UnionPayIcon = iconComponent(
	UnionPayAsset,
	__( 'UnionPay', 'poocommerce-payments' )
);
export const VisaIcon = iconComponent(
	VisaAsset,
	__( 'Visa', 'poocommerce-payments' )
);
export const GrabPayIcon = iconComponent(
	GrabPayAsset,
	__( 'GrabPay', 'poocommerce-payments' )
);
export const WeChatPayIcon = iconComponent(
	WeChatPayAsset,
	__( 'WeChat Pay', 'poocommerce-payments' )
);
export const WooIcon = iconComponent(
	WooAsset,
	__( 'WooPay', 'poocommerce-payments' ),
	false
);
export const WooIconShort = iconComponent(
	WooAssetShort,
	__( 'WooPay', 'poocommerce-payments' ),
	false
);
