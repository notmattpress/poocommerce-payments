/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { Card } from '@wordpress/components';

/**
 * Internal dependencies
 */
import CardBody from '../card-body';
import { ProtectionLevels } from './components';
import './style.scss';
import FraudProtectionTour from './tour';

const FraudProtection: React.FC = () => {
	return (
		<>
			<Card className="fraud-protection">
				<CardBody>
					<h4>
						{ __(
							'Set your payment risk level',
							'poocommerce-payments'
						) }
					</h4>
					<ProtectionLevels />
				</CardBody>
			</Card>

			<FraudProtectionTour />
		</>
	);
};

export default FraudProtection;
