/** @format **/

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import epsBankList from '../eps/bank-list';
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
		bank,
		verified_name: verifiedName,
	} = charge.payment_method_details.eps;

	const {
		name: customerName,
		email,
		formatted_address: formattedAddress,
	} = billingDetails;

	return {
		id,
		bank,
		verifiedName,
		customerName,
		email,
		formattedAddress,
	};
};

/**
 * Placeholders to display while loading.
 */
const paymentMethodPlaceholders = {
	id: __( 'id placeholder', 'poocommerce-payments' ),
	bank: __( 'bank name placeholder', 'poocommerce-payments' ),
	verifiedName: __( 'verified_name placeholder', 'poocommerce-payments' ),
	customerName: __( 'customer_name placeholder', 'poocommerce-payments' ),
	email: __( 'email placeholder', 'poocommerce-payments' ),
	formattedAddress: __( 'address placeholder', 'poocommerce-payments' ),
};

const EpsDetails = ( { charge = {}, isLoading } ) => {
	const details = charge.payment_method_details
		? formatPaymentMethodDetails( charge )
		: paymentMethodPlaceholders;

	const {
		id,
		bank,
		verifiedName,
		customerName,
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
					label={ __( 'Bank name', 'poocommerce-payments' ) }
				>
					{ epsBankList[ bank ] }
				</Detail>

				<Detail
					isLoading={ isLoading }
					label={ __( 'ID', 'poocommerce-payments' ) }
				>
					{ id }
				</Detail>

				<Detail
					isLoading={ isLoading }
					label={ __( 'Verified name', 'poocommerce-payments' ) }
				>
					{ verifiedName }
				</Detail>
			</div>

			<div className="payment-method-details__column">
				<Detail
					isLoading={ isLoading }
					label={ __( 'Owner', 'poocommerce-payments' ) }
				>
					{ customerName }
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

export default EpsDetails;
