/**
 * External dependencies
 */
import React, { useMemo } from 'react';
import { ReportFilters } from '@poocommerce/components';
import { getQuery } from '@poocommerce/navigation';

/**
 * Internal dependencies
 */
import { getFilters, getAdvancedFilters } from './config';
import { formatCurrencyName } from 'multi-currency/interface/functions';
import { recordEvent } from 'tracks';
import { PAYMENT_METHOD_TITLES } from 'wcpay/constants/payment-method';
import { Transaction } from 'wcpay/data';

interface TransactionsFiltersProps {
	storeCurrencies: string[];
	customerCurrencies: string[];
	transactionSources: Transaction[ 'source' ][];
}

export const TransactionsFilters = ( {
	storeCurrencies,
	customerCurrencies,
	transactionSources,
}: TransactionsFiltersProps ): JSX.Element => {
	const advancedFilters = useMemo(
		() =>
			getAdvancedFilters(
				customerCurrencies.map( ( currencyCode: string ) => ( {
					label: formatCurrencyName( currencyCode ),
					value: currencyCode,
				} ) ),
				typeof transactionSources === 'undefined'
					? []
					: transactionSources.map( ( source ) => ( {
							label: PAYMENT_METHOD_TITLES[ source ] || source,
							value: source,
					  } ) )
			),
		[ customerCurrencies, transactionSources ]
	);

	const filters = useMemo(
		() =>
			getFilters(
				storeCurrencies.map( ( currencyCode: string ) => ( {
					label: formatCurrencyName( currencyCode ),
					value: currencyCode,
				} ) ),
				storeCurrencies.length > 1
			),
		[ storeCurrencies ]
	);

	return (
		<div className="poocommerce-filters-transactions">
			<ReportFilters
				key={ customerCurrencies?.length }
				filters={ filters }
				advancedFilters={ advancedFilters }
				showDatePicker={ false }
				path="/payments/transactions"
				query={ getQuery() }
				onAdvancedFilterAction={ ( event ) => {
					if ( event === 'filter' ) {
						recordEvent( 'page_view', {
							path: 'payments_transactions',
							filter: 'advanced',
						} );
					}
				} }
			/>
		</div>
	);
};

export default TransactionsFilters;
