/** @format **/

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { Button } from 'wcpay/components/wp-components-wrapped/components/button';
import { Card } from 'wcpay/components/wp-components-wrapped/components/card';
import { CardBody } from 'wcpay/components/wp-components-wrapped/components/card-body';
import { CardHeader } from 'wcpay/components/wp-components-wrapped/components/card-header';
import { FlexBlock } from 'wcpay/components/wp-components-wrapped/components/flex-block';
import { FlexItem } from 'wcpay/components/wp-components-wrapped/components/flex-item';
import AccountFees from './account-fees';
import AccountStatusItem from './account-status-item';
import DepositsStatus from 'components/deposits-status';
import PaymentsStatus from 'components/payments-status';
import StatusChip from './status-chip';
import './style.scss';
import './shared.scss';
import { AccountTools } from './account-tools';
import { recordEvent } from 'wcpay/tracks';

const AccountStatusCard = ( props ) => {
	const { title, children, value } = props;
	return (
		<Card isMedium>
			<CardHeader
				className={ 'poocommerce-account-status__header' }
				direction={ 'row' }
				align={ 'center' }
				justify={ 'left' }
				gap={ 3 }
				expanded
			>
				{ title }
			</CardHeader>
			<CardBody>{ children || value || null }</CardBody>
		</Card>
	);
};

const AccountStatusError = () => {
	const cardTitle = __( 'Account details', 'poocommerce-payments' );
	return (
		<AccountStatusCard title={ cardTitle }>
			{ __(
				'Error determining the connection status.',
				'poocommerce-payments'
			) }
		</AccountStatusCard>
	);
};

const AccountStatusDetails = ( props ) => {
	const { accountStatus, accountFees } = props;
	const accountLink = accountStatus.accountLink
		? addQueryArgs( accountStatus.accountLink, {
				from: 'WCPAY_ACCOUNT_DETAILS',
				source: 'wcpay-account-details',
		  } )
		: false;
	const cardTitle = (
		<>
			<FlexItem className={ 'account-details' }>
				{ __( 'Account details', 'poocommerce-payments' ) }
			</FlexItem>
			<FlexBlock className={ 'account-status' }>
				<StatusChip
					accountStatus={ accountStatus.status }
					poEnabled={ accountStatus.progressiveOnboarding.isEnabled }
					poComplete={
						accountStatus.progressiveOnboarding.isComplete
					}
				/>
			</FlexBlock>
			{ accountLink && (
				<FlexItem className={ 'edit-details' }>
					<Button
						variant={ 'link' }
						onClick={ () =>
							recordEvent( 'wcpay_account_details_link_clicked', {
								from: 'WCPAY_ACCOUNT_DETAILS',
								source: 'wcpay-account-details',
							} )
						}
						href={ accountLink }
						target={ '_blank' }
						__next40pxDefaultSize
					>
						{ __( 'Edit details', 'poocommerce-payments' ) }
					</Button>
				</FlexItem>
			) }
		</>
	);

	return (
		<AccountStatusCard title={ cardTitle }>
			<AccountStatusItem
				label={ __( 'Payments:', 'poocommerce-payments' ) }
			>
				<PaymentsStatus
					paymentsEnabled={ accountStatus.paymentsEnabled }
					accountStatus={ accountStatus.status }
					iconSize={ 24 }
				/>
			</AccountStatusItem>
			<AccountStatusItem
				label={ __( 'Payouts:', 'poocommerce-payments' ) }
			>
				<DepositsStatus
					status={ accountStatus.deposits?.status }
					interval={ accountStatus.deposits?.interval }
					accountStatus={ accountStatus.status }
					iconSize={ 24 }
				/>
			</AccountStatusItem>
			<AccountTools />
			{ accountFees.length > 0 && (
				<AccountFees accountFees={ accountFees } />
			) }
		</AccountStatusCard>
	);
};

const AccountStatus = ( props ) => {
	const { accountStatus } = props;
	return accountStatus.error ? (
		<AccountStatusError />
	) : (
		<AccountStatusDetails { ...props } />
	);
};

export default AccountStatus;
