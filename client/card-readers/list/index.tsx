/** @format */
/**
 * External dependencies
 */
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Card } from 'wcpay/components/wp-components-wrapped/components/card';
import { CardBody } from 'wcpay/components/wp-components-wrapped/components/card-body';
import { CardDivider } from 'wcpay/components/wp-components-wrapped/components/card-divider';
import SettingsSection from 'wcpay/settings/settings-section';
import SettingsLayout from 'wcpay/settings/settings-layout';
import LoadableSettingsSection from 'wcpay/settings/loadable-settings-section';
import CardReaderListItem from './list-item';
import { useReaders } from 'wcpay/data';

const ReadersListDescription = () => (
	<>
		<h2>{ __( 'Connected card readers', 'poocommerce-payments' ) }</h2>
		<p>
			{ sprintf(
				/* translators: %s: WooPayments */
				__(
					'Card readers are marked as active if they’ve processed one or more transactions during the current billing cycle. ' +
						'To connect or disconnect card readers, use the %s mobile application.',
					'poocommerce-payments'
				),
				'WooPayments'
			) }
		</p>
	</>
);

const ReadersList = (): JSX.Element => {
	const { readers, isLoading } = useReaders( 10 );

	return (
		<SettingsLayout>
			<SettingsSection description={ ReadersListDescription }>
				<LoadableSettingsSection numLines={ 20 }>
					<Card className="card-readers-list__wrapper">
						<CardBody className="card-readers-list__header">
							<div className="card-readers-list__header-id">
								{ __( 'Reader ID', 'poocommerce-payments' ) }
							</div>
							<div className="card-readers-list__header-model">
								{ __( 'Model', 'poocommerce-payments' ) }
							</div>
							<div className="card-readers-list__header-status">
								{ __( 'Status', 'poocommerce-payments' ) }
							</div>
						</CardBody>
						<CardDivider />
						<CardBody className="card-readers-list__body">
							<ul>
								{ ! isLoading &&
									Object.entries(
										readers
									).map( ( [ index, reader ] ) => (
										<CardReaderListItem
											key={ index }
											reader={ reader }
										/>
									) ) }
							</ul>
						</CardBody>
					</Card>
				</LoadableSettingsSection>
			</SettingsSection>
		</SettingsLayout>
	);
};

export default ReadersList;
