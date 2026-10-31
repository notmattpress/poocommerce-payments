/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

const RequirementsInfoObject: Record< string, string > = {
	'individual.id_number': __(
		'Personal Identification Number',
		'poocommerce-payments'
	),
	'business_profile.url': __( 'Business Website', 'poocommerce-payments' ),
	'company.tax_id': __( 'Business Number', 'poocommerce-payments' ),
};

export default RequirementsInfoObject;
