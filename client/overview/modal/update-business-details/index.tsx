/**
 * External dependencies
 */
import React, { useState } from 'react';
import { Button, Modal, Notice } from '@wordpress/components';
import { sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import strings from './strings';
import './index.scss';
import { recordEvent } from 'wcpay/tracks';
import { formatDateTimeFromTimestamp } from 'wcpay/utils/date-time';

interface Props {
	errorMessages: Array< string >;
	accountStatus: string;
	accountLink: string;
	currentDeadline?: number | null;
}

const UpdateBusinessDetailsModal = ( {
	errorMessages,
	accountStatus,
	accountLink,
	currentDeadline,
}: Props ): any => {
	const [ isModalOpen, setModalOpen ] = useState( true );

	const closeModal = () => {
		setModalOpen( false );
	};

	const openAccountLink = () => {
		recordEvent( 'wcpay_account_details_link_clicked', {
			source: 'wcpay-update-business-details-task',
		} );
		window.open( accountLink, '_blank' );
	};

	return (
		<>
			{ isModalOpen && (
				<Modal
					title={ strings.updateBusinessDetails }
					isDismissible={ true }
					className="wcpay-update-business-details-modal"
					shouldCloseOnClickOutside={ false }
					onRequestClose={ closeModal }
				>
					<div className="wcpay-update-business-details-modal__wrapper">
						<div className="wcpay-update-business-details-modal__body">
							<p>
								{ accountStatus === 'restricted_soon' &&
								currentDeadline
									? sprintf(
											strings.restrictedSoonDescription,
											formatDateTimeFromTimestamp(
												currentDeadline,
												{
													customFormat: 'ga M j, Y',
												}
											)
									  )
									: strings.restrictedDescription }
							</p>

							{ errorMessages.map( ( errorMessage, index ) => (
								<Notice
									key={ index }
									status="warning"
									isDismissible={ false }
								>
									{ errorMessage }
								</Notice>
							) ) }
						</div>
					</div>
					<hr />
					<div className="wcpay-update-business-details-modal__footer">
						<Button variant={ 'secondary' } onClick={ closeModal }>
							{ strings.cancel }
						</Button>

						<Button
							variant={ 'primary' }
							onClick={ openAccountLink }
						>
							{ strings.updateBusinessDetails }
						</Button>
					</div>
				</Modal>
			) }
		</>
	);
};

export default UpdateBusinessDetailsModal;
