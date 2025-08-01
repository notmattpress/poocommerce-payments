/** @format **/

/**
 * External dependencies
 */
import { Card } from 'wcpay/components/wp-components-wrapped/components/card';

/**
 * Internal dependencies
 */
import CardBody from '../card-body';
import './style.scss';
import WooPayExpressCheckoutItem from './woopay-item';
import AppleGooglePayExpressCheckoutItem from './apple-google-pay-item';
import LinkExpressCheckoutItem from './link-item';

const ExpressCheckout = () => {
	return (
		<Card className="express-checkouts">
			<CardBody size={ 0 }>
				<ul className="express-checkouts-list">
					<WooPayExpressCheckoutItem />
					<AppleGooglePayExpressCheckoutItem />
					<LinkExpressCheckoutItem />
				</ul>
			</CardBody>
		</Card>
	);
};

export default ExpressCheckout;
