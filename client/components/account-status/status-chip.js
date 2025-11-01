/** @format */

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Chip from 'components/chip';
import './style.scss';

const StatusChip = ( props ) => {
	const { accountStatus } = props;

	let description = __( 'Unknown', 'poocommerce-payments' );
	let type = 'light';
	let tooltip = '';

	if ( accountStatus === 'complete' ) {
		description = __( 'Complete', 'poocommerce-payments' );
		type = 'success';
	} else if ( accountStatus === 'enabled' ) {
		description = __( 'Enabled', 'poocommerce-payments' );
		type = 'primary';
	} else if ( accountStatus === 'restricted_soon' ) {
		description = __( 'Restricted soon', 'poocommerce-payments' );
		type = 'warning';
	} else if ( accountStatus === 'pending_verification' ) {
		description = __( 'Pending', 'poocommerce-payments' );
		type = 'light';
		tooltip = __(
			'Payouts are pending while Stripe verifies details on your account.',
			'poocommerce-payments'
		);
	} else if ( accountStatus === 'restricted_partially' ) {
		description = __( 'Restricted partially', 'poocommerce-payments' );
		type = 'warning';
	} else if ( accountStatus === 'restricted' ) {
		description = __( 'Restricted', 'poocommerce-payments' );
		type = 'alert';
	} else if ( accountStatus.startsWith( 'rejected' ) ) {
		description = __( 'Rejected', 'poocommerce-payments' );
		type = 'light';
	} else if ( accountStatus === 'under_review' ) {
		description = __( 'Under review', 'poocommerce-payments' );
		type = 'light';
	}

	return <Chip message={ description } type={ type } tooltip={ tooltip } />;
};

export default StatusChip;
