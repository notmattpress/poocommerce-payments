/**
 * External dependencies
 */
import React from 'react';
import { Modal } from '@wordpress/components';
import clsx from 'clsx';
import { HorizontalRule } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import './styles.scss';

interface ConfirmationModalProps extends Modal.Props {
	actions: JSX.Element;
}

const ConfirmationModal: React.FunctionComponent< ConfirmationModalProps > = ( {
	children,
	actions,
	className,
	...props
} ) => (
	<Modal
		className={ clsx( 'wcpay-confirmation-modal', className ) }
		{ ...props }
	>
		{ children }
		<HorizontalRule className="wcpay-confirmation-modal__separator" />
		<div className="wcpay-confirmation-modal__footer">{ actions }</div>
	</Modal>
);

export default ConfirmationModal;
