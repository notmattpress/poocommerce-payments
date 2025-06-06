/**
 * External dependencies
 */
import { CheckboxControl, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
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
						<ExternalLink href="https://poocommerce.com/document/woopayments/currencies/multi-currency-setup/" />
					),
				},
			} ) }
			checked={ isMultiCurrencyEnabled }
			onChange={ handleMultiCurrencyStatusChange }
			data-testid="multi-currency-toggle"
		/>
	);
};

export default MultiCurrencyToggle;
