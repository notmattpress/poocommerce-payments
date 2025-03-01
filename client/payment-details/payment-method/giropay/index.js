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

	const { bank_name: bankName, bic } = charge.payment_method_details.giropay;

	const { name, email, formatted_address: formattedAddress } = billingDetails;

	return {
		id,
		bankName,
		bic,
		name,
		email,
		formattedAddress,
	};
};

/**
 * Placeholders to display while loading.
 */
const paymentMethodPlaceholders = {
	bankName: __( 'bank name placeholder', 'poocommerce-payments' ),
	bic: __( 'bic placeholder', 'poocommerce-payments' ),
	id: __( 'id placeholder', 'poocommerce-payments' ),
	name: __( 'name placeholder', 'poocommerce-payments' ),
	email: __( 'email placeholder', 'poocommerce-payments' ),
	formattedAddress: __( 'address placeholder', 'poocommerce-payments' ),
	country: __( 'country placeholder', 'poocommerce-payments' ),
};

const GiropayDetails = ( { charge = {}, isLoading } ) => {
	const details = charge.payment_method_details
		? formatPaymentMethodDetails( charge )
		: paymentMethodPlaceholders;

	const { id, bankName, bic, name, email, formattedAddress } = details;

	// Shorthand for more readable code.
	const Detail = PaymentDetailsPaymentMethodDetail;

	return (
		<div className="payment-method-details">
			<div className="payment-method-details__column">
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
			</div>
		</div>
	);
};

export default GiropayDetails;
