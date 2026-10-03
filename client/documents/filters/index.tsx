/**
 * External dependencies
 */
import React from 'react';
import { ReportFilters } from '@poocommerce/components';
import { getQuery } from '@poocommerce/navigation';

/**
 * Internal dependencies
 */
import { filters, advancedFilters } from './config';

export const DocumentsFilters = (): JSX.Element => {
	return (
		<div className="poocommerce-filters-documents">
			<ReportFilters
				filters={ filters }
				advancedFilters={ advancedFilters }
				showDatePicker={ false }
				path="/payments/documents"
				query={ getQuery() }
			/>
		</div>
	);
};

export default DocumentsFilters;
