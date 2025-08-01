/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-syntax
import { Notice } from '@wordpress/components';

interface ActionButton extends Notice.ButtonAction {
	isBusy?: boolean;
	disabled?: boolean;
}
interface URLAction extends Notice.BaseAction {
	url: string;
}

export type Action = ActionButton | URLAction;
