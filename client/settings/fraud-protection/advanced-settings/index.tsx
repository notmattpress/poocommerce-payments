/**
 * External dependencies
 */
import React, { useEffect, useState, useRef, EffectCallback } from 'react';
import { isMatchWith } from 'lodash';
import { sprintf, __ } from '@wordpress/i18n';
import { Link } from '@poocommerce/components';
import { LoadableBlock } from 'wcpay/components/loadable';
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { Notice } from 'wcpay/components/wp-components-wrapped/components/notice';
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	useCurrentProtectionLevel,
	useAdvancedFraudProtectionSettings,
	useSettings,
} from 'wcpay/data';
import ErrorBoundary from '../../../components/error-boundary';
import { getAdminUrl, isVersionGreaterOrEqual } from 'wcpay/utils';
import SettingsLayout from 'wcpay/settings/settings-layout';
import AVSMismatchRuleCard from './cards/avs-mismatch';
import CVCVerificationRuleCard from './cards/cvc-verification';
import InternationalIPAddressRuleCard from './cards/international-ip-address';
import IPAddressMismatchRuleCard from './cards/ip-address-mismatch';
import AddressMismatchRuleCard from './cards/address-mismatch';
import PurchasePriceThresholdRuleCard, {
	PurchasePriceThresholdValidation,
} from './cards/purchase-price-threshold';
import OrderItemsThresholdRuleCard, {
	OrderItemsThresholdValidation,
} from './cards/order-items-threshold';
import FraudPreventionSettingsContext from './context';
import './../style.scss';

import { ProtectionLevel } from './constants';
import { readRuleset, writeRuleset } from './utils';
import { recordEvent } from 'tracks';
import { ProtectionSettingsUI } from '../interfaces';
import useConfirmNavigation from 'wcpay/utils/use-confirm-navigation';
import SettingsSection from 'wcpay/settings/settings-section';

const observerEventMapping: Record< string, string > = {
	'avs-mismatch-card':
		'wcpay_fraud_protection_advanced_settings_card_avs_mismatch_viewed',
	'cvc-verification-card':
		'wcpay_fraud_protection_advanced_settings_card_cvc_verification_viewed',
	'international-ip-address-card':
		'wcpay_fraud_protection_advanced_settings_card_international_ip_address_card_viewed',
	'ip-address-mismatch':
		'wcpay_fraud_protection_advanced_settings_card_ip_address_mismatch_card_viewed',
	'address-mismatch-card':
		'wcpay_fraud_protection_advanced_settings_card_address_mismatch_viewed',
	'purchase-price-threshold-card':
		'wcpay_fraud_protection_advanced_settings_card_price_threshold_viewed',
	'order-items-threshold-card':
		'wcpay_fraud_protection_advanced_settings_card_items_threshold_viewed',
};

const AdvancedFraudSettingsDescription = () => (
	<>
		<h2>{ __( 'Filter configuration', 'poocommerce-payments' ) }</h2>
		<p>
			{ __(
				'Set up advanced fraud filters. Enable at least one filter to activate advanced protection.',
				'poocommerce-payments'
			) }
		</p>
	</>
);

interface BreadcrumbProps {
	showNewBackLink: boolean;
}

// Temporary solution until we have wider header redesign.
const Breadcrumb = ( props: BreadcrumbProps ): JSX.Element => {
	return (
		<>
			{ props.showNewBackLink && (
				<h2 className="fraud-protection-header-breadcrumb">
					<small>
						<Link
							type="wp-admin"
							href={ getAdminUrl( {
								page: 'wc-settings',
								tab: 'checkout',
								section: 'poocommerce_payments',
							} ) }
						>
							<span className="dashicons dashicons-arrow-left-alt2"></span>
						</Link>
					</small>
					{ __(
						'Advanced fraud protection',
						'poocommerce-payments'
					) }
				</h2>
			) }
			{ ! props.showNewBackLink && (
				<h2 className="fraud-protection-header-breadcrumb-old">
					{ __(
						'Advanced fraud protection',
						'poocommerce-payments'
					) }
					<small>
						<Link
							type="wp-admin"
							href={ getAdminUrl( {
								page: 'wc-settings',
								tab: 'checkout',
								section: 'poocommerce_payments',
							} ) }
						>
							&#x2934;&#xfe0e;
						</Link>
					</small>
				</h2>
			) }
		</>
	);
};

const FraudProtectionAdvancedSettingsPage: React.FC = () => {
	const [ isDirty, setIsDirty ] = useState( false );

	const { saveSettings, isLoading, isSaving } = useSettings();

	const cardObserver = useRef< IntersectionObserver >();

	const [
		currentProtectionLevel,
		updateProtectionLevel,
	] = useCurrentProtectionLevel();
	const [
		advancedFraudProtectionSettings,
		updateAdvancedFraudProtectionSettings,
	] = useAdvancedFraudProtectionSettings();
	const [ validationError, setValidationError ] = useState< string | null >(
		null
	);
	const [ protectionSettingsUI, setProtectionSettingsUI ] = useState<
		ProtectionSettingsUI
	>( {} );

	useEffect( () => {
		setProtectionSettingsUI(
			readRuleset( advancedFraudProtectionSettings )
		);
	}, [ advancedFraudProtectionSettings ] );

	const validateSettings = (
		fraudProtectionSettings: ProtectionSettingsUI
	) => {
		setValidationError( null );

		const validators = {
			order_items_threshold: OrderItemsThresholdValidation,
			purchase_price_threshold: PurchasePriceThresholdValidation,
		};

		return Object.keys( validators )
			.map( ( key ) =>
				validators[ key as keyof typeof validators ](
					fraudProtectionSettings[ key ],
					setValidationError
				)
			)
			.every( Boolean );
	};

	const checkAnyRuleFilterEnabled = (
		settings: ProtectionSettingsUI
	): boolean => {
		return Object.values( settings ).some( ( setting ) => setting.enabled );
	};

	const handleSaveSettings = () => {
		if ( ! validateSettings( protectionSettingsUI ) ) {
			window.scrollTo( {
				top: 0,
			} );
			return;
		}

		if ( ! checkAnyRuleFilterEnabled( protectionSettingsUI ) ) {
			if ( ProtectionLevel.BASIC === currentProtectionLevel ) {
				dispatch( 'core/notices' ).createErrorNotice(
					__(
						'At least one risk filter needs to be enabled for advanced protection.',
						'poocommerce-payments'
					)
				);
				return;
			}

			updateProtectionLevel( ProtectionLevel.BASIC );
		} else if ( ProtectionLevel.ADVANCED !== currentProtectionLevel ) {
			updateProtectionLevel( ProtectionLevel.ADVANCED );
		}

		const settings = writeRuleset( protectionSettingsUI );

		// Persist the AVS verification setting until the account cache is updated locally.
		if (
			wcpaySettings?.accountStatus?.fraudProtection?.declineOnAVSFailure
		) {
			wcpaySettings.accountStatus.fraudProtection.declineOnAVSFailure = settings.some(
				( setting ) => setting.key === 'avs_verification'
			);
		}

		updateAdvancedFraudProtectionSettings( settings );

		saveSettings();

		setIsDirty( false );

		recordEvent( 'wcpay_fraud_protection_advanced_settings_saved', {
			settings: JSON.stringify( settings ),
		} );
	};

	// Intersection observer callback for tracking card viewed events.
	const observerCallback = ( entries: IntersectionObserverEntry[] ) => {
		entries.forEach( ( entry: IntersectionObserverEntry ) => {
			const { target, intersectionRatio } = entry;

			if ( 0 < intersectionRatio ) {
				// Element is at least partially visible.
				const { id } = target;
				const event = observerEventMapping[ id ] || null;

				if ( event ) {
					recordEvent( event );
				}

				const element = document.getElementById( id );

				if ( element ) {
					cardObserver.current?.unobserve( element );
				}
			}
		} );
	};

	useEffect( () => {
		if ( isLoading ) return;

		cardObserver.current = new IntersectionObserver( observerCallback );

		Object.keys( observerEventMapping ).forEach( ( selector ) => {
			const element = document.getElementById( selector );

			if ( element ) {
				cardObserver.current?.observe( element );
			}
		} );

		return () => {
			cardObserver.current?.disconnect();
		};
	}, [ isLoading ] );

	const { isFRTReviewFeatureActive } = wcpaySettings;

	const confirmLeaveCallback = useConfirmNavigation( () => {
		const settingsChanged =
			! isLoading &&
			! isMatchWith(
				readRuleset( advancedFraudProtectionSettings ),
				protectionSettingsUI,
				( source, target ) => {
					for ( const rule in source ) {
						// We need to skip checking the "block" property, as they are not the same with defaults.
						if ( ! isFRTReviewFeatureActive && rule === 'block' ) {
							continue;
						}
						if ( source[ rule ] !== target[ rule ] ) {
							return false;
						}
					}

					return true;
				}
			);

		if ( ! settingsChanged ) {
			return;
		}

		// This message won't be applied because all major browsers disabled showing custom messages on onbeforeunload event.
		// Each browser now displays a hardcoded message for this cause.
		// Source: https://stackoverflow.com/a/68637899
		return __(
			'There are unsaved changes on this page. Are you sure you want to leave and discard the unsaved changes?',
			'poocommerce-payments'
		);
	} ) as EffectCallback;

	useEffect( confirmLeaveCallback, [
		confirmLeaveCallback,
		protectionSettingsUI,
		advancedFraudProtectionSettings,
	] );

	const renderSaveButton = () => (
		<Button
			variant="primary"
			isBusy={ isSaving }
			onClick={ handleSaveSettings }
			disabled={
				isSaving ||
				isLoading ||
				'error' === advancedFraudProtectionSettings ||
				! isDirty
			}
		>
			{ __( 'Save changes', 'poocommerce-payments' ) }
		</Button>
	);

	const showNewBackLink = isVersionGreaterOrEqual(
		window.wcSettings.wcVersion,
		'9.8.3'
	);

	return (
		<FraudPreventionSettingsContext.Provider
			value={ {
				protectionSettingsUI,
				setProtectionSettingsUI,
				setIsDirty,
			} }
		>
			<Breadcrumb showNewBackLink={ showNewBackLink } />
			<SettingsLayout>
				<SettingsSection
					description={ AdvancedFraudSettingsDescription }
					id="advanced-fraud"
				>
					<ErrorBoundary>
						{ validationError && (
							<div className="fraud-protection-advanced-settings-error-notice">
								<Notice
									status="error"
									isDismissible={ true }
									onRemove={ () => {
										setValidationError( null );
									} }
								>
									{ sprintf(
										'%s %s',
										__(
											'Settings were not saved.',
											'poocommerce-payments'
										),
										validationError
									) }
								</Notice>
							</div>
						) }
						{ 'error' === advancedFraudProtectionSettings && (
							<div className="fraud-protection-advanced-settings-error-notice">
								<Notice status="error" isDismissible={ false }>
									{ __(
										'There was an error retrieving your fraud protection settings.' +
											' Please refresh the page to try again.',
										'poocommerce-payments'
									) }
								</Notice>
							</div>
						) }
						<LoadableBlock isLoading={ isLoading } numLines={ 20 }>
							<AVSMismatchRuleCard />
						</LoadableBlock>
						<LoadableBlock isLoading={ isLoading } numLines={ 20 }>
							<InternationalIPAddressRuleCard />
						</LoadableBlock>
						<LoadableBlock isLoading={ isLoading } numLines={ 20 }>
							<IPAddressMismatchRuleCard />
						</LoadableBlock>
						<LoadableBlock isLoading={ isLoading } numLines={ 20 }>
							<AddressMismatchRuleCard />
						</LoadableBlock>
						<LoadableBlock isLoading={ isLoading } numLines={ 20 }>
							<PurchasePriceThresholdRuleCard />
						</LoadableBlock>
						<LoadableBlock isLoading={ isLoading } numLines={ 20 }>
							<OrderItemsThresholdRuleCard />
						</LoadableBlock>
						<LoadableBlock isLoading={ isLoading } numLines={ 20 }>
							<CVCVerificationRuleCard />
						</LoadableBlock>

						<footer className="fraud-protection-advanced-settings__footer">
							{ renderSaveButton() }
						</footer>
					</ErrorBoundary>
				</SettingsSection>
			</SettingsLayout>
		</FraudPreventionSettingsContext.Provider>
	);
};

export default FraudProtectionAdvancedSettingsPage;
