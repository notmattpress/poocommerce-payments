/** @format */
/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { Icon } from 'wcpay/components/wp-components-wrapped/components/icon';
import interpolateComponents from '@automattic/interpolate-components';
import { useCallback, useState } from '@wordpress/element';
import {
	ConfirmationModal,
	PaymentMethodIcon,
} from 'multi-currency/interface/components';
import CurrencyDeleteIllustration from 'multi-currency/components/currency-delete-illustration';
import { paymentMethodsMap } from 'multi-currency/interface/assets';

const DeleteButton = ( { code, label, symbol, onClick, className } ) => {
	const [ isConfirmationModalOpen, setIsConfirmationModalOpen ] = useState(
		false
	);

	const currencyDependentPaymentMethods =
		window.multiCurrencyPaymentMethodsMap;

	const isModalNeededToConfirm =
		currencyDependentPaymentMethods &&
		currencyDependentPaymentMethods[ code ] &&
		Object.keys( currencyDependentPaymentMethods[ code ] ).length > 0;

	const dependentPaymentMethods = isModalNeededToConfirm
		? Object.keys( currencyDependentPaymentMethods[ code ] )
		: [];

	const handleDeleteIconClick = useCallback( () => {
		if ( isModalNeededToConfirm ) {
			setIsConfirmationModalOpen( true );
		} else {
			onClick( code );
		}
	}, [ setIsConfirmationModalOpen, isModalNeededToConfirm, onClick, code ] );

	const handleDeleteConfirmationClick = useCallback( () => {
		setIsConfirmationModalOpen( false );
		onClick( code );
	}, [ onClick, setIsConfirmationModalOpen, code ] );

	const handleDeleteCancelClick = useCallback( () => {
		setIsConfirmationModalOpen( false );
	}, [ setIsConfirmationModalOpen ] );

	return (
		<>
			{ isConfirmationModalOpen && (
				<ConfirmationModal
					title={ sprintf(
						__(
							/* translators: %1: Name of the currency being removed */
							'Remove %1$s',
							'poocommerce-payments'
						),
						label
					) }
					onRequestClose={ handleDeleteCancelClick }
					className="enabled-currency-delete-modal"
					actions={
						<>
							<Button
								onClick={ handleDeleteConfirmationClick }
								isPrimary
								isDestructive
							>
								{ __( 'Remove', 'poocommerce-payments' ) }
							</Button>
							<Button
								onClick={ handleDeleteCancelClick }
								isSecondary
							>
								{ __( 'Cancel', 'poocommerce-payments' ) }
							</Button>
						</>
					}
				>
					<CurrencyDeleteIllustration symbol={ symbol } />
					<p>
						{ interpolateComponents( {
							mixedString: sprintf(
								__(
									'Are you sure you want to remove {{strong}}%s (%s){{/strong}}? ' +
										'Your customers will no longer be able to pay in this currency and ' +
										'use payment methods listed below.',
									'poocommerce-payments'
								),
								label,
								code === symbol
									? code
									: [ code, symbol ].join( ' ' )
							),
							components: {
								strong: <strong />,
							},
						} ) }
					</p>
					<ul>
						{ dependentPaymentMethods.map( ( paymentMethod ) => (
							<li key={ paymentMethod }>
								<PaymentMethodIcon
									Icon={
										paymentMethodsMap[ paymentMethod ].icon
									}
									label={
										paymentMethodsMap[ paymentMethod ].label
									}
								/>
							</li>
						) ) }
					</ul>
					<p>
						{ sprintf(
							__(
								'You can add %s (%s) again at any time in Multi-Currency settings.',
								'poocommerce-payments'
							),
							label,
							code === symbol
								? code
								: [ code, symbol ].join( ' ' )
						) }
					</p>
				</ConfirmationModal>
			) }
			<Button
				isLink
				aria-label={ sprintf(
					__(
						/* translators: %1: Name of the currency being removed */
						'Remove %1$s as an enabled currency',
						'poocommerce-payments'
					),
					label
				) }
				className={ className }
				onClick={ handleDeleteIconClick }
				__next40pxDefaultSize
			>
				<Icon icon="trash" />
			</Button>
		</>
	);
};

export default DeleteButton;
