/**
 * External dependencies
 */
import { CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDebugLog, useDevMode } from 'wcpay/data';

const DebugMode = () => {
	const isDevModeEnabled = useDevMode();
	const [ isLoggingChecked, setIsLoggingChecked ] = useDebugLog();

	return (
		<>
			<h4>{ __( 'Debug mode', 'poocommerce-payments' ) }</h4>
			<CheckboxControl
				label={
					isDevModeEnabled
						? __(
								'Log error messages (defaulted on for test accounts)',
								'poocommerce-payments'
						  )
						: __( 'Log error messages', 'poocommerce-payments' )
				}
				help={ __(
					'When enabled, payment error logs will be saved to PooCommerce > Status > Logs.',
					'poocommerce-payments'
				) }
				disabled={ isDevModeEnabled }
				checked={ isDevModeEnabled || isLoggingChecked }
				onChange={ setIsLoggingChecked }
				__nextHasNoMarginBottom
			/>
		</>
	);
};

export default DebugMode;
