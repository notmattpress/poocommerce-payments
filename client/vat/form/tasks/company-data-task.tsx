/** @format **/

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import React, { useContext, useEffect, useState } from 'react';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { Notice } from 'wcpay/components/wp-components-wrapped/components/notice';
import { TextareaControl } from 'wcpay/components/wp-components-wrapped/components/textarea-control';
import { TextControl } from 'wcpay/components/wp-components-wrapped/components/text-control';
import CollapsibleBody from 'wcpay/components/wizard/collapsible-body';
import WizardTaskItem from 'wcpay/components/wizard/task-item';
import WizardTaskContext from 'wcpay/components/wizard/task/context';
import {
	VatError,
	VatFormOnCompleted,
	VatSaveDetails,
	VatSaveDetailsResult,
} from '../../types';

export const CompanyDataTask = ( {
	onCompleted,
	vatNumber,
	placeholderCompanyName,
	placeholderCompanyAddress,
}: {
	onCompleted: VatFormOnCompleted;
	vatNumber: string | null;
	placeholderCompanyName: string;
	placeholderCompanyAddress: string;
} ): JSX.Element => {
	const { setCompleted } = useContext( WizardTaskContext );

	const [ saveDetailsError, setSaveDetailsError ] = useState< string | null >(
		null
	);
	const [ isLoading, setLoading ] = useState< boolean >( false );

	const [ companyName, setCompanyName ] = useState< string >( '' );
	const [ companyAddress, setCompanyAddress ] = useState< string >( '' );

	// Update placeholder values when props change.
	useEffect( () => {
		setCompanyName( placeholderCompanyName );
		setCompanyAddress( placeholderCompanyAddress );
	}, [ placeholderCompanyName, placeholderCompanyAddress ] );

	const isConfirmButtonDisabled =
		companyName.trim() === '' || companyAddress.trim() === '';

	const submit = async () => {
		try {
			setLoading( true );

			const details: VatSaveDetails = {
				name: companyName,
				address: companyAddress,
			};

			if ( vatNumber !== null ) {
				details.vat_number = vatNumber;
			}

			const savedDetails = await apiFetch< VatSaveDetailsResult >( {
				path: '/wc/v3/payments/vat',
				method: 'POST',
				data: details,
			} );

			setLoading( false );

			setCompleted( true, 'vat-submitted' );
			onCompleted(
				savedDetails.vat_number,
				savedDetails.name,
				savedDetails.address
			);
		} catch ( error ) {
			setLoading( false );
			setSaveDetailsError( ( error as VatError ).message );
		}
	};

	return (
		<WizardTaskItem
			index={ 2 }
			title={ __(
				'Confirm your business details',
				'poocommerce-payments'
			) }
		>
			<CollapsibleBody>
				<TextControl
					label={ __( 'Business name', 'poocommerce-payments' ) }
					value={ companyName }
					onChange={ setCompanyName }
				/>

				<TextareaControl
					label={ __( 'Address', 'poocommerce-payments' ) }
					value={ companyAddress }
					onChange={ setCompanyAddress }
				/>

				<Button
					isPrimary
					disabled={ isConfirmButtonDisabled || isLoading }
					isBusy={ isLoading }
					onClick={ submit }
				>
					{ __( 'Confirm', 'poocommerce-payments' ) }
				</Button>

				{ saveDetailsError && (
					<Notice
						status="error"
						isDismissible={ false }
						className="vat-number-error"
					>
						{ saveDetailsError }
					</Notice>
				) }
			</CollapsibleBody>
		</WizardTaskItem>
	);
};
