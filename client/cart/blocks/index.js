/**
 * Internal dependencies
 */
import { renderBNPLCartMessaging } from './product-details';

const { registerPlugin } = window.wp.plugins;

registerPlugin( 'bnpl-site-messaging', {
	render: renderBNPLCartMessaging,
	scope: 'poocommerce-checkout',
} );
