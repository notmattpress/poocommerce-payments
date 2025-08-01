/** @format */
/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState, useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { SearchControl } from 'wcpay/components/wp-components-wrapped/components/search-control';
import {
	useAvailableCurrencies,
	useEnabledCurrencies,
	useDefaultCurrency,
} from 'multi-currency/data';
import EnabledCurrenciesModalCheckboxList from './modal-checkbox-list';
import EnabledCurrenciesModalCheckbox from './modal-checkbox';
import { ConfirmationModal } from 'multi-currency/interface/components';
import './style.scss';

const EnabledCurrenciesModal = ( { className } ) => {
	const availableCurrencies = useAvailableCurrencies();
	const availableCurrencyCodes = Object.keys( availableCurrencies );
	const enabledCurrenciesList = useRef( null );

	const {
		enabledCurrencies,
		submitEnabledCurrenciesUpdate,
	} = useEnabledCurrencies();
	const enabledCurrencyCodes = Object.keys( enabledCurrencies );

	const defaultCurrency = useDefaultCurrency();
	const defaultCurrencyCode = defaultCurrency.code;

	// Need to remove default from available codes array.
	availableCurrencyCodes.splice(
		availableCurrencyCodes.indexOf( defaultCurrencyCode ),
		1
	);

	const [ searchText, setSearchText ] = useState( '' );
	const [ selectedCurrencies, setSelectedCurrencies ] = useState( {} );

	const filteredCurrencyCodes = ! searchText
		? availableCurrencyCodes
		: availableCurrencyCodes.filter( ( code ) => {
				const { symbol, name } = availableCurrencies[ code ];
				return (
					`${ symbol } ${ code } ${ name }`
						.toLocaleLowerCase()
						.indexOf( searchText.toLocaleLowerCase() ) > -1
				);
		  } );

	const setInitialSelectedCurrencies = useCallback( () => {
		setSelectedCurrencies(
			availableCurrencyCodes.reduce( ( acc, value ) => {
				acc[ value ] = enabledCurrencyCodes.includes( value );
				return acc;
			}, {} )
		);
	}, [ enabledCurrencyCodes, availableCurrencyCodes ] );

	useEffect( () => {
		setInitialSelectedCurrencies();
		/* eslint-disable react-hooks/exhaustive-deps */
	}, [
		JSON.stringify( availableCurrencyCodes ),
		JSON.stringify( enabledCurrencyCodes ),
	] );
	/* eslint-enable react-hooks/exhaustive-deps */

	const handleChange = ( currencyCode, enabled ) => {
		setSelectedCurrencies( ( previouslyEnabled ) => ( {
			...previouslyEnabled,
			[ currencyCode ]: enabled,
		} ) );
	};

	const [
		isEnabledCurrenciesModalOpen,
		setIsEnabledCurrenciesModalOpen,
	] = useState( false );

	const [ enabledCurrenciesListWidth, setCurrenciesListWidth ] = useState(
		false
	);

	const handleEnabledCurrenciesAddButtonClick = useCallback( () => {
		setIsEnabledCurrenciesModalOpen( true );
	}, [ setIsEnabledCurrenciesModalOpen ] );

	const handleAddSelectedCancelClick = useCallback( () => {
		setIsEnabledCurrenciesModalOpen( false );
		setCurrenciesListWidth( false );
		setSearchText( '' );
		setInitialSelectedCurrencies();
	}, [ setIsEnabledCurrenciesModalOpen, setInitialSelectedCurrencies ] );

	const handleAddSelectedClick = () => {
		setIsEnabledCurrenciesModalOpen( false );
		setCurrenciesListWidth( false );
		setSearchText( '' );
		const newCurrencies = Object.entries( selectedCurrencies )
			.filter( ( [ , enabled ] ) => enabled )
			.map( ( [ method ] ) => method );
		newCurrencies.push( defaultCurrencyCode );
		newCurrencies.sort();
		submitEnabledCurrenciesUpdate( newCurrencies );
	};

	const handleCurrenciesListWidth = () => {
		if (
			isEnabledCurrenciesModalOpen &&
			enabledCurrenciesList &&
			enabledCurrenciesListWidth === false
		) {
			setCurrenciesListWidth( enabledCurrenciesList.current.offsetWidth );
		}
	};

	useEffect( () => {
		handleCurrenciesListWidth();
		/* eslint-disable react-hooks/exhaustive-deps */
	}, [
		JSON.stringify( filteredCurrencyCodes ),
		isEnabledCurrenciesModalOpen,
	] );
	/* eslint-enable react-hooks/exhaustive-deps */

	return (
		<>
			{ isEnabledCurrenciesModalOpen && (
				<ConfirmationModal
					title={ __(
						'Add enabled currencies',
						'poocommerce-payments'
					) }
					onRequestClose={ handleAddSelectedCancelClick }
					className="add-enabled-currencies-modal"
					actions={
						<>
							<Button
								isSecondary
								onClick={ handleAddSelectedCancelClick }
								__next40pxDefaultSize
							>
								{ __( 'Cancel', 'poocommerce-payments' ) }
							</Button>
							<Button
								isPrimary
								onClick={ handleAddSelectedClick }
								__next40pxDefaultSize
							>
								{ __(
									'Update selected',
									'poocommerce-payments'
								) }
							</Button>
						</>
					}
				>
					<div className="add-enabled-currencies-modal__search">
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
					<h3>
						{ searchText
							? /* translators: %1: filtered currencies count */
							  sprintf(
									__(
										'Search results (%1$d currencies)',
										'poocommerce-payments'
									),
									filteredCurrencyCodes.length
							  )
							: __( 'All currencies', 'poocommerce-payments' ) }
					</h3>
					<div
						className="add-enabled-currencies-modal__content"
						ref={ enabledCurrenciesList }
						style={ {
							width: enabledCurrenciesListWidth || 'auto',
						} }
					>
						<EnabledCurrenciesModalCheckboxList>
							{ filteredCurrencyCodes.map( ( code ) => (
								<EnabledCurrenciesModalCheckbox
									key={ availableCurrencies[ code ].id }
									checked={ selectedCurrencies[ code ] }
									onChange={ handleChange }
									currency={ availableCurrencies[ code ] }
								/>
							) ) }
						</EnabledCurrenciesModalCheckboxList>
					</div>
				</ConfirmationModal>
			) }
			<Button
				variant="secondary"
				className={ className }
				onClick={ handleEnabledCurrenciesAddButtonClick }
				data-testid="enabled-currencies-add-button"
				__next40pxDefaultSize
			>
				{ __( 'Add/remove currencies', 'poocommerce-payments' ) }
			</Button>
		</>
	);
};

export default EnabledCurrenciesModal;
