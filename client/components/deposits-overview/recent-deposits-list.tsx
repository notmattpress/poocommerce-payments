/**
 * External dependencies
 */
import React from 'react';
import { calendar } from '@wordpress/icons';
import { Link } from '@poocommerce/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { CardBody } from 'wcpay/components/wp-components-wrapped/components/card-body';
import { CardDivider } from 'wcpay/components/wp-components-wrapped/components/card-divider';
import { Flex } from 'wcpay/components/wp-components-wrapped/components/flex';
import { FlexItem } from 'wcpay/components/wp-components-wrapped/components/flex-item';
import { Icon } from 'wcpay/components/wp-components-wrapped/components/icon';
import './style.scss';
import DepositStatusChip from 'components/deposit-status-chip';
import { getDepositDate } from 'deposits/utils';
import { CachedDeposit } from 'wcpay/types/deposits';
import { formatCurrency } from 'multi-currency/interface/functions';
import { getDetailsURL } from 'wcpay/components/details-link';

interface RecentDepositsProps {
	deposits: CachedDeposit[];
}

/**
 * Renders the Recent Deposit list component.
 *
 * This component includes the recent deposit heading, table and notice.
 */
const RecentDepositsList: React.FC< RecentDepositsProps > = ( {
	deposits,
} ) => {
	if ( deposits.length === 0 ) {
		return null;
	}

	const tableClass = 'wcpay-deposits-overview__table';

	const depositRows = deposits.map( ( deposit ) => (
		<Flex className={ `${ tableClass }__row` } key={ deposit.id }>
			<FlexItem className={ `${ tableClass }__cell` }>
				<Icon icon={ calendar } size={ 17 } />
				<Link href={ getDetailsURL( deposit.id, 'payouts' ) }>
					{ getDepositDate( deposit ) }
				</Link>
			</FlexItem>
			<FlexItem className={ `${ tableClass }__cell` }>
				<DepositStatusChip deposit={ deposit } />
			</FlexItem>
			<FlexItem className={ `${ tableClass }__cell` }>
				{ formatCurrency( deposit.amount, deposit.currency ) }
			</FlexItem>
		</Flex>
	) );

	return (
		<>
			<CardBody className={ `${ tableClass }__container` }>
				<Flex className={ `${ tableClass }__row__header` }>
					<FlexItem className={ `${ tableClass }__cell` }>
						{ __( 'Dispatch date', 'poocommerce-payments' ) }
					</FlexItem>
					<FlexItem className={ `${ tableClass }__cell` }>
						{ __( 'Status', 'poocommerce-payments' ) }
					</FlexItem>
					<FlexItem className={ `${ tableClass }__cell` }>
						{ __( 'Amount', 'poocommerce-payments' ) }
					</FlexItem>
				</Flex>
			</CardBody>
			<CardDivider />
			<CardBody className={ `${ tableClass }__container` }>
				{ depositRows }
			</CardBody>
		</>
	);
};

export default RecentDepositsList;
