/**
 * External dependencies
 */
import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody, CheckboxControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

import { useStoreSettings } from 'multi-currency/data';
import {
	LoadableBlock,
	SettingsSection,
} from 'multi-currency/interface/components';
import PreviewModal from 'multi-currency/components/preview-modal';

const StoreSettingsDescription = () => {
	const LEARN_MORE_URL =
		'https://poocommerce.com/document/woopayments/currencies/multi-currency-setup/#store-settings';

	return (
		<>
			<h2>{ __( 'Store settings', 'poocommerce-payments' ) }</h2>
			<p>
				{ createInterpolateElement(
					sprintf(
						__(
							'Store settings allow your customers to choose which currency they ' +
								'would like to use when shopping at your store. <learnMoreLink>' +
								'Learn more</learnMoreLink>',
							'poocommerce-payments'
						),
						LEARN_MORE_URL
					),
					{
						learnMoreLink: (
							// eslint-disable-next-line jsx-a11y/anchor-has-content
							<a
								href={ LEARN_MORE_URL }
								target={ '_blank' }
								rel={ 'noreferrer' }
							/>
						),
					}
				) }
			</p>
		</>
	);
};

const StoreSettings = () => {
	const {
		storeSettings,
		isLoading,
		submitStoreSettingsUpdate,
	} = useStoreSettings();
	const [ isSavingSettings, setIsSavingSettings ] = useState( false );
	const [
		isAutomaticSwitchEnabledValue,
		setIsAutomaticSwitchEnabledValue,
	] = useState( false );

	const [
		isStorefrontSwitcherEnabledValue,
		setIsStorefrontSwitcherEnabledValue,
	] = useState( false );

	const [ isPreviewModalOpen, setPreviewModalOpen ] = useState( false );

	const [ isDirty, setIsDirty ] = useState( false );

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

	const handleIsAutomaticSwitchEnabledClick = ( value ) => {
		setIsAutomaticSwitchEnabledValue( value );
		setIsDirty( true );
	};

	const handleIsStorefrontSwitcherEnabledClick = ( value ) => {
		setIsStorefrontSwitcherEnabledValue( value );
		setIsDirty( true );
	};

	const saveSettings = () => {
		setIsSavingSettings( true );
		submitStoreSettingsUpdate(
			isAutomaticSwitchEnabledValue,
			isStorefrontSwitcherEnabledValue
		);
		setIsSavingSettings( false );
		setIsDirty( false );
	};

	return (
		<>
			<SettingsSection
				description={ StoreSettingsDescription }
				className={ 'multi-currency-settings-store-settings-section' }
			>
				<LoadableBlock isLoading={ isLoading } numLines={ 10 }>
					<Card className="multi-currency-settings__wrapper">
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
							<div className="multi-currency-settings__description">
								{ createInterpolateElement(
									__(
										'Customers will be notified via store alert banner. ' +
											'<previewLink>Preview</previewLink>',
										'poocommerce-payments'
									),
									{
										previewLink: (
											<Button
												isLink
												onClick={ () => {
													setPreviewModalOpen( true );
												} }
											/>
										),
									}
								) }
							</div>
							{ storeSettings.site_theme === 'Storefront' ? (
								<>
									<CheckboxControl
										checked={
											isStorefrontSwitcherEnabledValue
										}
										onChange={
											handleIsStorefrontSwitcherEnabledClick
										}
										data-testid={
											'enable_storefront_switcher'
										}
										label={ __(
											'Add a currency switcher to the Storefront theme on breadcrumb section.',
											'poocommerce-payments'
										) }
									/>
									<div className="multi-currency-settings__description">
										{ createInterpolateElement(
											sprintf(
												/* translators: %s: url to the widgets page */
												__(
													'A currency switcher is also available in your widgets. ' +
														'<linkToWidgets>Configure now</linkToWidgets>',
													'poocommerce-payments'
												),
												'widgets.php'
											),
											{
												linkToWidgets: (
													// eslint-disable-next-line jsx-a11y/anchor-has-content
													<a href="widgets.php" />
												),
											}
										) }
									</div>
								</>
							) : null }
						</CardBody>
						<PreviewModal
							isPreviewModalOpen={ isPreviewModalOpen }
							setPreviewModalOpen={ setPreviewModalOpen }
							isStorefrontSwitcherEnabledValue={ false }
							isAutomaticSwitchEnabledValue={ true }
						/>
					</Card>
				</LoadableBlock>
			</SettingsSection>
			<SettingsSection className="multi-currency-settings-save-settings-section">
				<Button
					isPrimary
					isBusy={ isSavingSettings }
					disabled={ isSavingSettings || ! isDirty }
					onClick={ saveSettings }
				>
					{ __( 'Save changes', 'poocommerce-payments' ) }
				</Button>
			</SettingsSection>
		</>
	);
};

export default StoreSettings;
