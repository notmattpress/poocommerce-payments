/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CheckboxControl, ExternalLink } from '@wordpress/components';
import { useMultiCurrency } from 'wcpay/data';
import interpolateComponents from '@automattic/interpolate-components';

const MultiCurrencyToggle = () => {
	const [
		isMultiCurrencyEnabled,
		updateIsMultiCurrencyEnabled,
	] = useMultiCurrency();

	const handleMultiCurrencyStatusChange = ( value ) => {
		updateIsMultiCurrencyEnabled( value );
	};

	return (
		<CheckboxControl
			label={ __( 'Enable Multi-Currency', 'poocommerce-payments' ) }
			help={ interpolateComponents( {
				mixedString: __(
					'Allow customers to shop and pay in multiple currencies. {{learnMoreLink}}Learn more{{/learnMoreLink}}',
					'poocommerce-payments'
				),
				components: {
					learnMoreLink: (
						// eslint-disable-next-line max-len
						// @ts-expect-error: children is provided when interpolating the component
						<ExternalLink href="https://poocommerce.com/document/woopayments/currencies/multi-currency-setup/" />
					),
				},
			} ) }
			checked={ isMultiCurrencyEnabled }
			onChange={ handleMultiCurrencyStatusChange }
			data-testid="multi-currency-toggle"
			__nextHasNoMarginBottom
		/>
	);
};

export default MultiCurrencyToggle;
