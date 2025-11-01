/** @format **/

/**
 * External dependencies
 */
import React from 'react';
import { List } from '@poocommerce/components';

/**
 * Internal dependencies.
 */
import './style.scss';

export interface HorizontalListItem {
	/**
	 * The title for the item, displayed above the content.
	 */
	title: string;
	/**
	 * The content that will be displayed in the list for this item.
	 */
	content: string | React.ReactNode;
}

interface Props {
	/**
	 * The items to display in the list.
	 */
	items: HorizontalListItem[];
}

export const HorizontalList: React.FunctionComponent< Props > = ( {
	items,
} ) => {
	return <List className="poocommerce-list--horizontal" items={ items } />;
};
