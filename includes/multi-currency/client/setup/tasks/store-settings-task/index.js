/**
 * External dependencies
 */
import React, { useContext, useState, useEffect } from 'react';
import { Button, Card, CardBody, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import interpolateComponents from '@automattic/interpolate-components';

/**
 * Internal dependencies
 */
import {
	CollapsibleBody,
	WizardTaskItem,
} from 'multi-currency/interface/components';
import { WizardTaskContext } from 'multi-currency/interface/functions';
import { useSettings, useMultiCurrency } from 'multi-currency/interface/data';
import PreviewModal from 'multi-currency/components/preview-modal';
import './index.scss';

import { useStoreSettings } from 'multi-currency/data';

const StoreSettingsTask = () => {
	const { storeSettings, submitStoreSettingsUpdate } = useStoreSettings();
	const { saveSettings, isSaving } = useSettings();
	const [
		isMultiCurrencyEnabled,
		updateIsMultiCurrencyEnabled,
	] = useMultiCurrency();

	const [ isPending, setPending ] = useState( false );

	const [
		isAutomaticSwitchEnabledValue,
		setIsAutomaticSwitchEnabledValue,
	] = useState( false );

	const [
		isStorefrontSwitcherEnabledValue,
		setIsStorefrontSwitcherEnabledValue,
	] = useState( false );

	const [ isPreviewModalOpen, setPreviewModalOpen ] = useState( false );

	useEffect( () => {
		if ( Object.keys( storeSettings ).length ) {
			setIsStorefrontSwitcherEnabledValue(
				storeSettings.enable_storefront_switcher
			);
			setIsAutomaticSwitchEnabledValue(
				storeSettings.enable_auto_currency
			);
		}
	}, [
		setIsAutomaticSwitchEnabledValue,
		setIsStorefrontSwitcherEnabledValue,
		storeSettings,
	] );

	const { setCompleted } = useContext( WizardTaskContext );

	const handlePreviewModalOpenClick = () => {
		setPreviewModalOpen( true );
	};

	const handleIsAutomaticSwitchEnabledClick = ( value ) => {
		setIsAutomaticSwitchEnabledValue( value );
	};

	const handleIsStorefrontSwitcherEnabledClick = ( value ) => {
		setIsStorefrontSwitcherEnabledValue( value );
	};

	const handleContinueClick = () => {
		setPending( true );

		if ( ! isMultiCurrencyEnabled ) {
			updateIsMultiCurrencyEnabled( true );
			saveSettings();
		}

		submitStoreSettingsUpdate(
			isAutomaticSwitchEnabledValue,
			isStorefrontSwitcherEnabledValue,
			! isMultiCurrencyEnabled
		);

		setPending( false );
		setCompleted( true, 'setup-complete' );
	};

	return (
		<WizardTaskItem
			title={ interpolateComponents( {
				mixedString: __(
					'{{wrapper}}Review store settings{{/wrapper}}',
					'poocommerce-payments'
				),
				components: {
					wrapper: <span />,
				},
			} ) }
			visibleDescription={ __(
				'These settings can be changed any time by visiting the Multi-Currency settings',
				'poocommerce-payments'
			) }
			index={ 2 }
		>
			<CollapsibleBody className="multi-currency-settings-task__body">
				<p className="wcpay-wizard-task__description-element is-muted-color">
					{ __(
						'These settings can be changed any time by visiting the Multi-Currency settings',
						'poocommerce-payments'
					) }
				</p>
				<Card className="multi-currency-settings-task__wrapper">
					<CardBody>
						<CheckboxControl
							checked={ isAutomaticSwitchEnabledValue }
							onChange={ handleIsAutomaticSwitchEnabledClick }
							data-testid={ 'enable_auto_currency' }
							label={ __(
								'Automatically switch customers to their local currency if it has been enabled',
								'poocommerce-payments'
							) }
						/>
						<div className="multi-currency-settings-task__description">
							{ __(
								'Customers will be notified via store alert banner.',
								'poocommerce-payments'
							) }
						</div>
						{ storeSettings.site_theme === 'Storefront' ? (
							<>
								<CheckboxControl
									checked={ isStorefrontSwitcherEnabledValue }
									onChange={
										handleIsStorefrontSwitcherEnabledClick
									}
									data-testid={ 'enable_storefront_switcher' }
									label={ __(
										'Add a currency switcher to the Storefront theme on breadcrumb section.',
										'poocommerce-payments'
									) }
								/>
								<div className="multi-currency-settings-task__description">
									{ __(
										'A currency switcher is also available in your widgets.',
										'poocommerce-payments'
									) }
								</div>
							</>
						) : null }
					</CardBody>
				</Card>
				<Button
					isBusy={ isPending || isSaving }
					disabled={ isPending || isSaving }
					onClick={ handleContinueClick }
					variant="primary"
				>
					{ __( 'Continue', 'poocommerce-payments' ) }
				</Button>
				<Button
					isBusy={ isPending || isSaving }
					disabled={ isPending || isSaving }
					onClick={ handlePreviewModalOpenClick }
					className={ 'multi-currency-setup-preview-button' }
					variant="tertiary"
				>
					{ __( 'Preview', 'poocommerce-payments' ) }
				</Button>
				<PreviewModal
					isPreviewModalOpen={ isPreviewModalOpen }
					setPreviewModalOpen={ setPreviewModalOpen }
					isStorefrontSwitcherEnabledValue={
						isStorefrontSwitcherEnabledValue
					}
					isAutomaticSwitchEnabledValue={
						isAutomaticSwitchEnabledValue
					}
				/>
			</CollapsibleBody>
		</WizardTaskItem>
	);
};

export default StoreSettingsTask;
