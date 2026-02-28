/**
 * External dependencies
 */
import React, { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import {
	Icon,
	commentContent,
	people,
	reusableBlock,
	external,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Modal, Button, Flex, FlexItem } from '@wordpress/components';
import { recordEvent } from 'wcpay/tracks';
import './style.scss';

interface PositiveFeedbackModalProps {
	onRequestClose: () => void;
}

export const PositiveFeedbackModal: React.FC< PositiveFeedbackModalProps > = ( {
	onRequestClose,
} ) => {
	// Record tracks event when the modal is opened.
	useEffect( () => {
		recordEvent( 'wcpay_merchant_feedback_prompt_positive_modal_view' );
	}, [] );

	return (
		<Modal
			title={ __( 'Share your feedback', 'poocommerce-payments' ) }
			className="wcpay-merchant-feedback-positive-modal"
			isDismissible
			shouldCloseOnClickOutside
			shouldCloseOnEsc
			onRequestClose={ () => {
				recordEvent(
					'wcpay_merchant_feedback_prompt_positive_modal_close_click'
				);
				onRequestClose();
			} }
		>
			<p>
				{ __(
					'Thanks for sharing your feedback on WooPayments! Would you mind leaving us a 5-star rating and a quick review on WordPress.org?',
					'poocommerce-payments'
				) }
			</p>
			<p>
				<strong>
					{ __(
						`Here's why your review matters:`,
						'poocommerce-payments'
					) }
				</strong>
			</p>
			<Flex justify="flex-start" align="flex-start" gap={ 4 }>
				<FlexItem>
					<p>
						<Icon icon={ reusableBlock } />
					</p>
				</FlexItem>
				<FlexItem>
					<p>
						<strong>
							{ __(
								'Help other businesses succeed',
								'poocommerce-payments'
							) }
						</strong>
					</p>
					<p>
						{ __(
							'Your insights guide others in choosing the right payment solution.',
							'poocommerce-payments'
						) }
					</p>
				</FlexItem>
			</Flex>
			<Flex justify="flex-start" align="flex-start" gap={ 4 }>
				<FlexItem>
					<p>
						<Icon icon={ commentContent } />
					</p>
				</FlexItem>
				<FlexItem>
					<p>
						<strong>
							{ __(
								'Shape our roadmap',
								'poocommerce-payments'
							) }
						</strong>
					</p>
					<p>
						{ __(
							'Your feedback inspires us to create new features and refine existing ones to better serve you.',
							'poocommerce-payments'
						) }
					</p>
				</FlexItem>
			</Flex>
			<Flex justify="flex-start" align="flex-start" gap={ 4 }>
				<FlexItem>
					<p>
						<Icon icon={ people } />
					</p>
				</FlexItem>
				<FlexItem>
					<p>
						<strong>
							{ __(
								'Supporting the PooCommerce community',
								'poocommerce-payments'
							) }
						</strong>
					</p>
					<p>
						{ __(
							'Sharing your experience strengthens the tools that empower your fellow entrepreneurs.',
							'poocommerce-payments'
						) }
					</p>
				</FlexItem>
			</Flex>
			<Flex justify="flex-end" gap={ 2 }>
				<Button
					variant="tertiary"
					onClick={ () => {
						recordEvent(
							'wcpay_merchant_feedback_prompt_positive_modal_close_click'
						);
						onRequestClose();
					} }
				>
					{ __( 'Close', 'poocommerce-payments' ) }
				</Button>
				<Button
					variant="primary"
					href="https://wordpress.org/support/plugin/poocommerce-payments/reviews/#new-post"
					target="_blank"
					onClick={ () => {
						recordEvent(
							'wcpay_merchant_feedback_prompt_positive_modal_leave_review_click'
						);
					} }
				>
					{ __( 'Leave a review', 'poocommerce-payments' ) }&nbsp;
					<Icon icon={ external } size={ 16 } />
				</Button>
			</Flex>
		</Modal>
	);
};
