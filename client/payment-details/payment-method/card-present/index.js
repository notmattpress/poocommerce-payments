/** @format **/

/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import PaymentDetailsPaymentMethodDetail from '../detail';

/**
 * Extracts and formats payment method details from a card-present charge.
 *
 * @param {Object} charge The charge object.
 * @return {Object}       A flat hash of all necessary values.
 */
const formatPaymentMethodDetails = ( charge ) => {
	const { billing_details: billingDetails, payment_method: id } = charge;

	const {
		last4,
		fingerprint,
		exp_month: month,
		exp_year: year,
		funding,
		network,
		country: countryCode,
	} = charge.payment_method_details.card_present;

	const { name, email, formatted_address: formattedAddress } = billingDetails;

	// Format the date, MM/YYYY. No translations needed.
	const date = month + ' / ' + year;

	// Generate the full funding type.
	const fundingTypes = {
		credit: __( 'credit', 'poocommerce-payments' ),
		debit: __( 'debit', 'poocommerce-payments' ),
		prepaid: __( 'prepaid', 'poocommerce-payments' ),
		unknown: __( 'unknown', 'poocommerce-payments' ),
	};
	const cardType = sprintf(
		// Translators: %1$s card brand, %2$s card funding (prepaid, credit, etc.).
		__( '%1$s %2$s card', 'poocommerce-payments' ),
		network.charAt( 0 ).toUpperCase() + network.slice( 1 ), // Brand
		fundingTypes[ funding ]
	);

	// Use the full country name.
	const country = wcSettings.countries[ countryCode ];

	return {
		last4,
		fingerprint,
		date,
		cardType,
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
	last4: '0000',
	fingerprint: __( 'fingerprint placeholder', 'poocommerce-payments' ),
	date: __( 'date placeholder', 'poocommerce-payments' ),
	cardType: __( 'card type placeholder', 'poocommerce-payments' ),
	id: __( 'id placeholder', 'poocommerce-payments' ),
	name: __( 'name placeholder', 'poocommerce-payments' ),
	email: __( 'email placeholder', 'poocommerce-payments' ),
	formattedAddress: __( 'address placeholder', 'poocommerce-payments' ),
	country: __( 'country placeholder', 'poocommerce-payments' ),
};

const CardPresentDetails = ( { charge = {}, isLoading } ) => {
	const details =
		charge && charge.payment_method_details
			? formatPaymentMethodDetails( charge )
			: paymentMethodPlaceholders;

	const {
		last4,
		date,
		cardType,
		id,
		name,
		email,
		country,
		formattedAddress,
	} = details;

	// Shorthand for more readable code.
	const Detail = PaymentDetailsPaymentMethodDetail;

	return (
		<div className="payment-method-details">
			<div className="payment-method-details__column">
				<Detail
					isLoading={ isLoading }
					label={ __( 'Number', 'poocommerce-payments' ) }
				>
					&bull;&bull;&bull;&bull;&nbsp;{ last4 }
				</Detail>

				<Detail
					isLoading={ isLoading }
					label={ __( 'Expires', 'poocommerce-payments' ) }
				>
					{ date }
				</Detail>

				<Detail
					isLoading={ isLoading }
					label={ __( 'Type', 'poocommerce-payments' ) }
				>
					{ cardType }
				</Detail>

				<Detail
					isLoading={ isLoading }
					label={ __( 'ID', 'poocommerce-payments' ) }
				>
					{ id }
				</Detail>
			</div>

			<div className="payment-method-details__column">
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

				<Detail
					isLoading={ isLoading }
					label={ __( 'Origin', 'poocommerce-payments' ) }
				>
					{ country }
				</Detail>
			</div>
		</div>
	);
};

export default CardPresentDetails;
