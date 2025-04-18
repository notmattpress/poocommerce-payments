/**
 * External dependencies
 */
import React, {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { __ } from '@wordpress/i18n';
import {
	Button,
	Card,
	CardBody,
	ExternalLink,
	CardDivider,
	Notice,
} from '@wordpress/components';
import interpolateComponents from '@automattic/interpolate-components';

/**
 * Internal dependencies
 */
import WizardTaskContext from '../wizard/task/context';
import CollapsibleBody from '../wizard/collapsible-body';
import WizardTaskItem from '../wizard/task-item';
import {
	useEnabledPaymentMethodIds,
	useGetAvailablePaymentMethodIds,
	useGetPaymentMethodStatuses,
	useSettings,
} from '../../data';
import PaymentMethodCheckboxes from '../../components/payment-methods-checkboxes';
import PaymentMethodCheckbox from '../../components/payment-methods-checkboxes/payment-method-checkbox';
import { LoadableBlock } from '../../components/loadable';
import LoadableSettingsSection from '../../settings/loadable-settings-section';
import CurrencyInformationForMethods from './currency-information-for-methods';
import { getMissingCurrenciesTooltipMessage } from 'multi-currency/interface/functions';
import { upeCapabilityStatuses } from '../constants';
import paymentMethodsMap from '../../payment-methods-map';
import ConfirmPaymentMethodActivationModal from 'wcpay/settings/payment-methods-list/activation-modal';
import './add-payment-methods-task.scss';
import PAYMENT_METHOD_IDS from 'wcpay/constants/payment-method';

const usePaymentMethodsCheckboxState = () => {
	// For UPE, the card payment method is required and always active.
	const [ paymentMethodsState, setPaymentMethodsState ] = useState( {
		card: true,
	} );

	const handleChange = useCallback(
		( paymentMethodName, enabled ) => {
			setPaymentMethodsState( ( oldValues ) => ( {
				...oldValues,
				[ paymentMethodName ]: enabled,
			} ) );
		},
		[ setPaymentMethodsState ]
	);

	return [ paymentMethodsState, handleChange ];
};

const ContinueButton = ( { paymentMethodsState } ) => {
	const { setCompleted } = useContext( WizardTaskContext );
	const [
		initialEnabledPaymentMethodIds,
		updateEnabledPaymentMethodIds,
	] = useEnabledPaymentMethodIds();

	const { saveSettings, isSaving } = useSettings();

	const checkedPaymentMethods = useMemo(
		() =>
			Object.entries( paymentMethodsState )
				.map( ( [ method, enabled ] ) => enabled && method )
				.filter( Boolean ),
		[ paymentMethodsState ]
	);

	const unCheckedPaymentMethods = Object.entries( paymentMethodsState )
		.map( ( [ method, enabled ] ) => ! enabled && method )
		.filter( Boolean );

	const handleContinueClick = useCallback( () => {
		// creating a separate callback, so that the main thread isn't blocked on click of the button
		const callback = async () => {
			updateEnabledPaymentMethodIds( [
				// adding the newly selected payment methods and removing them from the `initialEnabledPaymentMethodIds` if unchecked
				...new Set(
					[
						...initialEnabledPaymentMethodIds,
						...checkedPaymentMethods,
					].filter(
						( method ) =>
							! unCheckedPaymentMethods.includes( method )
					)
				),
			] );

			const isSuccess = await saveSettings();
			if ( ! isSuccess ) {
				// restoring the state, in case of soft route
				updateEnabledPaymentMethodIds( initialEnabledPaymentMethodIds );
				return;
			}

			setCompleted(
				{
					initialMethods: initialEnabledPaymentMethodIds,
				},
				'setup-complete'
			);
		};

		callback();
	}, [
		unCheckedPaymentMethods,
		checkedPaymentMethods,
		updateEnabledPaymentMethodIds,
		saveSettings,
		setCompleted,
		initialEnabledPaymentMethodIds,
	] );

	return (
		<Button
			isBusy={ isSaving }
			disabled={ isSaving || checkedPaymentMethods.length < 1 }
			onClick={ handleContinueClick }
			isPrimary
		>
			{ __( 'Continue', 'poocommerce-payments' ) }
		</Button>
	);
};

const AddPaymentMethodsTask = () => {
	const availablePaymentMethods = useGetAvailablePaymentMethodIds();
	const paymentMethodStatuses = useGetPaymentMethodStatuses();
	const { isActive } = useContext( WizardTaskContext );
	const isPoEnabled = wcpaySettings?.progressiveOnboarding?.isEnabled;
	const isPoComplete = wcpaySettings?.progressiveOnboarding?.isComplete;
	const isPoInProgress = isPoEnabled && ! isPoComplete;

	// I am using internal state in this component
	// and committing the changes on `initialEnabledPaymentMethodIds` only when the "continue" button is clicked.
	// Otherwise a user could navigate to another page via soft-routing and the settings would be in un-saved state,
	// possibly causing errors.
	const [
		paymentMethodsState,
		handlePaymentMethodChange,
	] = usePaymentMethodsCheckboxState( availablePaymentMethods );

	useEffect( () => {
		availablePaymentMethods
			.filter(
				( method ) => paymentMethodsMap[ method ] && method !== 'card'
			)
			.forEach( ( method ) => {
				handlePaymentMethodChange( method, false );
			} );
	}, [ availablePaymentMethods, handlePaymentMethodChange ] );

	const selectedMethods = useMemo(
		() =>
			Object.entries( paymentMethodsState )
				.map( ( [ method, enabled ] ) => enabled && method )
				.filter( Boolean ),
		[ paymentMethodsState ]
	);

	const [ activationModalParams, handleActivationModalOpen ] = useState(
		null
	);

	const completeActivation = ( method ) => {
		handlePaymentMethodChange( method, true );
		handleActivationModalOpen( null );
	};

	const getStatusAndRequirements = ( method ) => {
		const stripeKey = paymentMethodsMap[ method ].stripe_key;
		const stripeStatusContainer = paymentMethodStatuses[ stripeKey ] ?? [];
		if ( ! stripeStatusContainer ) {
			return {
				status: upeCapabilityStatuses.UNREQUESTED,
				requirements: [],
			};
		}
		return {
			status: stripeStatusContainer.status,
			requirements: stripeStatusContainer.requirements,
		};
	};

	const handleCheckClick = ( method, status ) => {
		if ( status ) {
			const statusAndRequirements = getStatusAndRequirements( method );
			if (
				statusAndRequirements.status === 'unrequested' &&
				statusAndRequirements.requirements.length > 0
			) {
				handleActivationModalOpen( {
					id: method,
					requirements: statusAndRequirements.requirements,
				} );
			} else {
				completeActivation( method );
			}
		} else {
			handlePaymentMethodChange( method, false );
		}
	};

	const prepareUpePaymentMethods = ( upeMethodIds ) => {
		return upeMethodIds.map( ( key ) => {
			const { label, currencies } = paymentMethodsMap[ key ];

			if ( availablePaymentMethods.includes( key ) ) {
				let isSetupRequired = false;
				let setupTooltip = '';

				if (
					! wcpaySettings.isMultiCurrencyEnabled &&
					key !== PAYMENT_METHOD_IDS.CARD
				) {
					const currency = wcpaySettings.storeCurrency;
					if ( currencies.indexOf( currency ) < 0 ) {
						isSetupRequired = true;
						setupTooltip = getMissingCurrenciesTooltipMessage(
							label,
							currencies
						);
					}
				}
				return (
					<PaymentMethodCheckbox
						key={ key }
						checked={
							paymentMethodsState[ key ] &&
							upeCapabilityStatuses.INACTIVE !==
								getStatusAndRequirements( key ).status
						}
						setupTooltip={ setupTooltip }
						isSetupRequired={ isSetupRequired }
						status={ getStatusAndRequirements( key ).status }
						locked={ isPoInProgress }
						onChange={ ( name, status ) => {
							handleCheckClick( name, status );
						} }
						name={ key }
					/>
				);
			}
			return '';
		} );
	};

	const availableUpeMethods = availablePaymentMethods.filter(
		( method ) =>
			paymentMethodsMap[ method ] &&
			! paymentMethodsMap[ method ].allows_pay_later &&
			method !== 'card' // Exclude the card payment method since it's rendered separately
	);

	const availableBuyNowPayLaterUpeMethods = availablePaymentMethods.filter(
		( method ) => paymentMethodsMap[ method ]?.allows_pay_later
	);

	return (
		<WizardTaskItem
			className="add-payment-methods-task"
			title={ __(
				'Enable additional payment methods',
				'poocommerce-payments'
			) }
			index={ 1 }
		>
			<CollapsibleBody>
				<p className="wcpay-wizard-task__description-element is-muted-color">
					{ interpolateComponents( {
						mixedString: __(
							'Increase your store’s conversion by offering your customers' +
								' preferred and convenient payment methods on checkout.',
							'poocommerce-payments'
						),
						components: {
							learnMoreLink: (
								// eslint-disable-next-line max-len
								<ExternalLink href="https://poocommerce.com/document/woopayments/payment-methods/additional-payment-methods/" />
							),
						},
					} ) }
				</p>

				{ isPoInProgress && (
					<Notice
						status="warning"
						isDismissible={ false }
						className="po__notice"
					>
						<span>
							{ __(
								'Some payment methods cannot be enabled because more information is needed about your account. ',
								'poocommerce-payments'
							) }
						</span>
						<a
							// eslint-disable-next-line max-len
							href="https://poocommerce.com/document/woopayments/payment-methods/additional-payment-methods/#method-cant-be-enabled"
							target="_blank"
							rel="external noreferrer noopener"
						>
							{ __(
								'Learn more about enabling additional payment methods.',
								'poocommerce-payments'
							) }
						</a>
					</Notice>
				) }

				<Card
					className="add-payment-methods-task__payment-selector-wrapper"
					size="small"
				>
					<CardBody>
						{ /* eslint-disable-next-line max-len */ }
						<p className="add-payment-methods-task__payment-selector-title wcpay-wizard-task__description-element">
							{ __(
								'Popular in your country',
								'poocommerce-payments'
							) }
						</p>
						<LoadableBlock numLines={ 10 } isLoading={ ! isActive }>
							<LoadableSettingsSection numLines={ 10 }>
								<PaymentMethodCheckboxes>
									<PaymentMethodCheckbox
										key="card"
										checked={ paymentMethodsState.card }
										// The card payment method is required when UPE is active and it can't be deactivated.
										required={ true }
										locked={ true }
										status={
											getStatusAndRequirements( 'card' )
												.status
										}
										name="card"
									/>
									{ prepareUpePaymentMethods(
										availableUpeMethods
									) }
								</PaymentMethodCheckboxes>
							</LoadableSettingsSection>
						</LoadableBlock>
					</CardBody>
					{ availableBuyNowPayLaterUpeMethods.length > 0 && (
						<>
							<CardDivider />
							<CardBody>
								<p className="add-payment-methods-task__payment-selector-title wcpay-wizard-task__description-element">
									{ __(
										'Buy Now, Pay Later',
										'poocommerce-payments'
									) }
								</p>
								<LoadableBlock
									numLines={ 10 }
									isLoading={ ! isActive }
								>
									<LoadableSettingsSection numLines={ 10 }>
										<PaymentMethodCheckboxes>
											{ prepareUpePaymentMethods(
												availableBuyNowPayLaterUpeMethods
											) }
										</PaymentMethodCheckboxes>
									</LoadableSettingsSection>
								</LoadableBlock>
							</CardBody>
						</>
					) }
					{ activationModalParams && (
						<ConfirmPaymentMethodActivationModal
							onClose={ () => {
								handleActivationModalOpen( null );
							} }
							onConfirmClose={ () => {
								completeActivation( activationModalParams.id );
							} }
							requirements={ activationModalParams.requirements }
							paymentMethod={ activationModalParams.id }
						/>
					) }
				</Card>
				<CurrencyInformationForMethods
					selectedMethods={ selectedMethods }
				/>
				<LoadableBlock numLines={ 10 } isLoading={ ! isActive }>
					<ContinueButton
						paymentMethodsState={ paymentMethodsState }
					/>
				</LoadableBlock>
			</CollapsibleBody>
		</WizardTaskItem>
	);
};

export default AddPaymentMethodsTask;
