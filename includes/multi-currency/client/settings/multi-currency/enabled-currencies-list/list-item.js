/** @format */
/**
 * External dependencies
 */
import clsx from 'clsx';
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import DeleteButton from './delete-button';
import MultiCurrencySettingsContext from 'multi-currency/context';
import { useContext } from 'react';

const EnabledCurrenciesListItem = ( {
	currency: { code, flag, id, is_default: isDefault, name, symbol, rate },
	defaultCurrency: {
		code: defaultCode,
		is_zero_decimal: isDefaultZeroDecimal,
	},
	onDeleteClick,
} ) => {
	const { openSingleCurrencySettings } = useContext(
		MultiCurrencySettingsContext
	);

	const formatCurrencyRate = () => {
		const formattedRate = isDefaultZeroDecimal
			? Number.parseFloat( rate * 1000 ).toFixed( 2 )
			: Number.parseFloat( rate ).toFixed( 2 );

		if ( isDefault ) {
			return __( 'Default currency', 'poocommerce-payments' );
		}

		return isDefaultZeroDecimal
			? `1,000 ${ defaultCode } → ${ formattedRate } ${ code }`
			: `1 ${ defaultCode } → ${ formattedRate } ${ code }`;
	};

	return (
		<li className={ clsx( 'enabled-currency', id ) }>
			<div className="enabled-currency__container">
				<div className="enabled-currency__flag">
					{ flag !== '' ? (
						flag
					) : (
						<div className="enabled-currency__flag-text">
							<span>{ code }</span>
						</div>
					) }
				</div>
				<div className="enabled-currency__label">{ name }</div>
				<div className="enabled-currency__code">
					({ symbol + ( symbol === code ? '' : ` ${ code }` ) })
				</div>
			</div>
			<div className="enabled-currency__rate">
				{ formatCurrencyRate() }
			</div>
			<div className="enabled-currency__actions">
				{ ! isDefault && (
					<Button
						isLink
						onClick={ () => {
							openSingleCurrencySettings( code );
						} }
						aria-label={ sprintf(
							__(
								/* translators: %1: Currency to be edited. */
								'Edit %1$s',
								'poocommerce-payments'
							),
							name
						) }
						className="enabled-currency__action edit"
					>
						{ __( 'manage', 'poocommerce-payments' ) }
					</Button>
				) }
				{ onDeleteClick && (
					<DeleteButton
						className="enabled-currency__action delete"
						onClick={ onDeleteClick }
						label={ name }
						code={ code }
						symbol={ symbol }
					/>
				) }
			</div>
		</li>
	);
};

export default EnabledCurrenciesListItem;
