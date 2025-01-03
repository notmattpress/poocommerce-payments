/** @format **/

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import PaymentDetailsPaymentMethodDetail from '../detail';

/**
 * Extracts and formats payment method details from a charge.
 *
 * @param {Object} charge The charge object.
 * @return {Object}       A flat hash of all necessary values.
 */
const formatPaymentMethodDetails = ( charge ) => {
	const { billing_details: billingDetails, payment_method: id } = charge;

	const {
		bank: bankName,
		bic,
		country: countryCode,
		iban_last4: last4,
		verified_name: verifiedName,
	} = charge.payment_method_details.ideal;

	const { name, email, formatted_address: formattedAddress } = billingDetails;
	// Use the full country name.
	const country = wcSettings.countries[ countryCode ];

	return {
		bankName,
		bic,
		last4,
		verifiedName,
		id,
		name,
		email,
		country,
		formattedAddress,
	};
};

/**
 * Placeholders to display while loading.
 */
const paymentMethodPlaceholders = {
	id: __( 'id placeholder', 'poocommerce-payments' ),
	bankName: __( 'bank name placeholder', 'poocommerce-payments' ),
	bic: __( 'bic placeholder', 'poocommerce-payments' ),
	last4: '0000',
	verifiedName: __( 'verified name placeholder', 'poocommerce-payments' ),
	name: __( 'name placeholder', 'poocommerce-payments' ),
	email: __( 'email placeholder', 'poocommerce-payments' ),
	formattedAddress: __( 'address placeholder', 'poocommerce-payments' ),
	country: __( 'country placeholder', 'poocommerce-payments' ),
};

const IdealDetails = ( { charge = {}, isLoading } ) => {
	const details = charge.payment_method_details
		? formatPaymentMethodDetails( charge )
		: paymentMethodPlaceholders;

	const {
		bankName,
		bic,
		last4,
		verifiedName,
		id,
		name,
		email,
		formattedAddress,
	} = details;

	// Shorthand for more readable code.
	const Detail = PaymentDetailsPaymentMethodDetail;

	return (
		<div className="payment-method-details">
			<div className="payment-method-details__column">
				<Detail
					isLoading={ isLoading }
					label={ __( 'ID', 'poocommerce-payments' ) }
				>
					{ id }
				</Detail>

				<Detail
					isLoading={ isLoading }
					label={ __( 'Bank name', 'poocommerce-payments' ) }
				>
					{ bankName }
				</Detail>

				<Detail
					isLoading={ isLoading }
					label={ __( 'BIC', 'poocommerce-payments' ) }
				>
					{ bic }
				</Detail>

				<Detail
					isLoading={ isLoading }
					label={ __( 'IBAN', 'poocommerce-payments' ) }
				>
					&bull;&bull;&bull;&bull;&nbsp;{ last4 }
				</Detail>
			</div>

			<div className="payment-method-details__column">
				<Detail
					isLoading={ isLoading }
					label={ __( 'Verified name', 'poocommerce-payments' ) }
				>
					{ verifiedName }
				</Detail>

				<Detail
					isLoading={ isLoading }
					label={ __( 'Owner', 'poocommerce-payments' ) }
				>
					{ name }
				</Detail>

				<Detail
					isLoading={ isLoading }
					label={ __( 'Owner email', 'poocommerce-payments' ) }
				>
					{ email }
				</Detail>

				<Detail
					isLoading={ isLoading }
					label={ __( 'Address', 'poocommerce-payments' ) }
				>
					<span
						dangerouslySetInnerHTML={ {
							__html: formattedAddress,
						} }
					/>
				</Detail>
			</div>
		</div>
	);
};

export default IdealDetails;
