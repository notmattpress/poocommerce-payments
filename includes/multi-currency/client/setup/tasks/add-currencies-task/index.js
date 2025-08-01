/**
 * External dependencies
 */
import React, { useContext, useEffect, useState } from 'react';
import { sprintf, __, _n } from '@wordpress/i18n';
import interpolateComponents from '@automattic/interpolate-components';
import _ from 'lodash';

/**
 * Internal dependencies
 */
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { Card } from 'wcpay/components/wp-components-wrapped/components/card';
import { CardBody } from 'wcpay/components/wp-components-wrapped/components/card-body';
import { SearchControl } from 'wcpay/components/wp-components-wrapped/components/search-control';
import { WizardTaskContext } from 'multi-currency/interface/functions';
import {
	CollapsibleBody,
	LoadableBlock,
	WizardTaskItem,
} from 'multi-currency/interface/components';

import {
	useCurrencies,
	useAvailableCurrencies,
	useEnabledCurrencies,
	useDefaultCurrency,
} from 'multi-currency/data';

// eslint-disable-next-line max-len
import EnabledCurrenciesModalCheckboxList from 'multi-currency/settings/multi-currency/enabled-currencies-list/modal-checkbox-list';
import EnabledCurrenciesModalCheckbox from 'multi-currency/settings/multi-currency/enabled-currencies-list/modal-checkbox';

import { recommendedCurrencyCodes, numberWords } from './constants';
import {
	ConcatenateCurrencyStrings,
	StringRepresentationOfCurrency,
} from './utils';

import './index.scss';

const ContinueButton = ( {
	enabledCurrencyCodes,
	selectedCurrencyCodes,
	selectedCurrencyCodesLength,
	isSaving,
	submitEnabledCurrenciesUpdate,
	setCompleted,
	setSaving,
} ) => {
	const isDisabled =
		enabledCurrencyCodes.length <= 1 && selectedCurrencyCodesLength < 1;

	const handleContinueClick = () => {
		if ( selectedCurrencyCodesLength > 0 ) {
			setSaving( true );
			submitEnabledCurrenciesUpdate(
				[ ...enabledCurrencyCodes, ...selectedCurrencyCodes ].sort()
			);
			setSaving( false );
		}

		setCompleted(
			{
				initialCurrencies: enabledCurrencyCodes,
			},
			'multi-currency-settings'
		);
	};

	const renderText = () => {
		if ( selectedCurrencyCodesLength === 0 ) {
			if ( enabledCurrencyCodes.length > 1 ) {
				return __( 'Continue', 'poocommerce-payments' );
			}

			return __( 'Add currencies', 'poocommerce-payments' );
		}

		return sprintf(
			_n(
				'Add %s currency',
				'Add %s currencies',
				selectedCurrencyCodesLength,
				'poocommerce-payments'
			),
			selectedCurrencyCodesLength
		);
	};

	return (
		<Button
			isBusy={ isSaving }
			disabled={ isSaving || isDisabled }
			onClick={ handleContinueClick }
			variant="primary"
			__next40pxDefaultSize
		>
			{ renderText() }
		</Button>
	);
};

const AddCurrenciesTask = () => {
	const { isLoading } = useCurrencies();
	const [ isSaving, setSaving ] = useState( false );
	const { isActive, setCompleted } = useContext( WizardTaskContext );

	const {
		enabledCurrencies,
		submitEnabledCurrenciesUpdate,
	} = useEnabledCurrencies();

	const availableCurrencies = useAvailableCurrencies();
	const defaultCurrency = useDefaultCurrency();
	const availableCurrencyCodes = Object.keys( availableCurrencies );
	const enabledCurrencyCodes = Object.keys( enabledCurrencies );
	const defaultCurrencyCode = defaultCurrency.code;

	const visibleCurrencyCodes = availableCurrencyCodes.filter(
		( code ) => ! enabledCurrencyCodes.includes( code )
	);

	const visibleRecommendedCurrencyCodes = recommendedCurrencyCodes.filter(
		( code ) => visibleCurrencyCodes.includes( code )
	);

	const [ selectedCurrencyCodes, setSelectedCurrencyCodes ] = useState(
		visibleRecommendedCurrencyCodes
	);

	useEffect(
		() => {
			// This is important because when the task moves on to the next task,
			// selectedCurrencyCodes seems to be refilled with the remaining
			// recommended currencies. To prevent that, only set the selected currencies
			// if the task is active.
			if ( isActive ) {
				setSelectedCurrencyCodes( visibleRecommendedCurrencyCodes );
			}
		},
		/* eslint-disable-next-line react-hooks/exhaustive-deps */
		[ visibleRecommendedCurrencyCodes.length ]
	);

	const selectedCurrencyCodesLength = selectedCurrencyCodes.length;

	// Currency checkbox state change event
	const handleChange = ( currencyCode, enabled ) => {
		if ( enabled ) {
			setSelectedCurrencyCodes( [
				...selectedCurrencyCodes,
				currencyCode,
			] );
		} else {
			setSelectedCurrencyCodes(
				_.without( selectedCurrencyCodes, currencyCode )
			);
		}
	};

	// Search component
	const [ searchText, setSearchText ] = useState( '' );

	const filteredCurrencyCodes = ! searchText
		? visibleCurrencyCodes.filter(
				( code ) => ! recommendedCurrencyCodes.includes( code )
		  )
		: visibleCurrencyCodes.filter( ( code ) => {
				const { symbol, name } = availableCurrencies[ code ];
				return (
					`${ symbol } ${ code } ${ name }`
						.toLocaleLowerCase()
						.indexOf( searchText.toLocaleLowerCase() ) > -1
				);
		  } );

	const displayCurrencyCheckbox = ( code, testId = '' ) =>
		availableCurrencyCodes.length && (
			<EnabledCurrenciesModalCheckbox
				key={ 'currency-checkbox-' + availableCurrencies[ code ].id }
				checked={ selectedCurrencyCodes.includes( code ) }
				onChange={ handleChange }
				currency={ availableCurrencies[ code ] }
				testId={ _.isString( testId ) ? testId : null }
			/>
		);

	return (
		<WizardTaskItem
			className="add-currencies-task"
			title={ __( 'Add currencies', 'poocommerce-payments' ) }
			visibleDescription={ sprintf(
				_n(
					'%s currency added',
					'%s currencies added',
					selectedCurrencyCodesLength,
					'poocommerce-payments'
				),
				selectedCurrencyCodesLength < 10
					? _.capitalize( numberWords[ selectedCurrencyCodesLength ] )
					: selectedCurrencyCodesLength
			) }
			index={ 1 }
		>
			<CollapsibleBody>
				<p className="wcpay-wizard-task__description-element is-muted-color">
					{ ! isLoading &&
						interpolateComponents( {
							mixedString: __(
								"Add currencies so international customers can shop and pay in their local currency. Your store's " +
									'default currency is {{storeCurrencyText /}}.',
								'poocommerce-payments'
							),
							components: {
								storeCurrencyText: (
									<strong>
										{ StringRepresentationOfCurrency(
											defaultCurrency
										) }
									</strong>
								),
							},
						} ) }
				</p>
				{ enabledCurrencyCodes.length > 1 && (
					<p className="wcpay-wizard-task__description-element is-muted-color">
						{ interpolateComponents( {
							mixedString: __(
								"You've already added {{enabledCurrenciesText /}} to your store.",
								'poocommerce-payments'
							),
							components: {
								enabledCurrenciesText: (
									<strong>
										{ ConcatenateCurrencyStrings(
											enabledCurrencyCodes,
											defaultCurrencyCode,
											availableCurrencies
										) }
									</strong>
								),
							},
						} ) }
					</p>
				) }
				<Card className="add-currencies-task__currency-selector-wrapper">
					<CardBody>
						<div className="add-currencies-task__search">
							<SearchControl
								__nextHasNoMarginBottom
								value={ searchText }
								onChange={ setSearchText }
								placeholder={ __(
									'Search currencies',
									'poocommerce-payments'
								) }
							/>
						</div>
						<div className={ 'add-currencies-task__separator' } />
						{ searchText && (
							/* translators: %1: filtered currencies count */
							<h4>
								{ sprintf(
									__(
										'Search results (%1$d currencies)',
										'poocommerce-payments'
									),
									filteredCurrencyCodes.length
								) }
							</h4>
						) }
						<LoadableBlock
							numLines={ 30 }
							isLoading={ isLoading && availableCurrencies }
						>
							<div className="add-currencies-task__content">
								<EnabledCurrenciesModalCheckboxList>
									{ ! searchText &&
									visibleRecommendedCurrencyCodes.length ? (
										<>
											<li>
												<h4>
													{ __(
														'Recommended currencies',
														'poocommerce-payments'
													) }
												</h4>
											</li>
											{ visibleRecommendedCurrencyCodes.map(
												( code ) =>
													displayCurrencyCheckbox(
														code,
														'recommended-currency'
													)
											) }
											<li
												className={
													'add-currencies-task__separator'
												}
											/>
										</>
									) : (
										''
									) }
									{ ! searchText && (
										<li className="add-currencies-task__available-currencies">
											<h4>
												{ __(
													'All currencies',
													'poocommerce-payments'
												) }
											</h4>
										</li>
									) }
									{ filteredCurrencyCodes.map(
										displayCurrencyCheckbox
									) }
								</EnabledCurrenciesModalCheckboxList>
							</div>
						</LoadableBlock>
					</CardBody>
				</Card>
				<LoadableBlock
					numLines={ 5 }
					isLoading={ isLoading && availableCurrencies }
				>
					<ContinueButton
						enabledCurrencyCodes={ enabledCurrencyCodes }
						selectedCurrencyCodes={ selectedCurrencyCodes }
						selectedCurrencyCodesLength={
							selectedCurrencyCodesLength
						}
						isSaving={ isSaving }
						submitEnabledCurrenciesUpdate={
							submitEnabledCurrenciesUpdate
						}
						setCompleted={ setCompleted }
						setSaving={ setSaving }
					/>
				</LoadableBlock>
			</CollapsibleBody>
		</WizardTaskItem>
	);
};

export default AddCurrenciesTask;
