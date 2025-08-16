/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { formatDateTimeFromTimestamp } from 'wcpay/utils/date-time';
import type { ExtendedDispute, AccountDetails, CoverLetterData } from './types';
import { DOCUMENT_FIELD_KEYS } from './recommended-document-fields';

// --- Utility Functions ---

export const getBusinessDetails = (): AccountDetails => {
	const wcStoreCountry =
		wcSettings?.admin?.preloadSettings?.general
			?.poocommerce_default_country || ':';
	const [ storeCountry, storeState ] = wcStoreCountry.split( ':' );
	return {
		name: wcSettings?.siteTitle || '<Your Business Name>',
		support_address_city:
			wcSettings?.admin?.preloadSettings?.general
				?.poocommerce_store_city || '',
		support_address_country: storeCountry,
		support_address_line1:
			wcSettings?.admin?.preloadSettings?.general
				?.poocommerce_store_address || '',
		support_address_line2:
			wcSettings?.admin?.preloadSettings?.general
				?.poocommerce_store_address_2 || '',
		support_address_postal_code:
			wcSettings?.admin?.preloadSettings?.general
				?.poocommerce_store_postcode || '',
		support_address_state: storeState,
	};
};

export const formatMerchantAddress = (
	accountDetails: AccountDetails
): string => {
	return `${ accountDetails.support_address_line1 }, ${ accountDetails.support_address_line2 }, ${ accountDetails.support_address_city }, ${ accountDetails.support_address_state } ${ accountDetails.support_address_postal_code } ${ accountDetails.support_address_country }`;
};

export const formatDeliveryDate = (
	dateString: string | undefined
): string => {
	if ( ! dateString )
		return __( '<Delivery/Service Date>', 'poocommerce-payments' );

	const unixTimestamp = Math.floor( new Date( dateString ).getTime() / 1000 );
	return formatDateTimeFromTimestamp( unixTimestamp, {
		separator: ', ',
		includeTime: false,
	} );
};

// --- Attachment Generation ---

const isEvidenceString = (
	evidence: string | Record< string, boolean > | Record< string, string >
): evidence is string => {
	return typeof evidence === 'string';
};

export const generateAttachments = ( dispute: ExtendedDispute ): string => {
	const attachments: string[] = [];
	let attachmentCount = 0;

	// Standard attachment logic for other dispute reasons
	const standardAttachments = [
		{
			key: DOCUMENT_FIELD_KEYS.RECEIPT,
			label: __( 'Order receipt', 'poocommerce-payments' ),
		},
		{
			key: DOCUMENT_FIELD_KEYS.CUSTOMER_COMMUNICATION,
			label: __( 'Customer communication', 'poocommerce-payments' ),
		},
		{
			key: DOCUMENT_FIELD_KEYS.CUSTOMER_SIGNATURE,
			label: __( "Customer's signature", 'poocommerce-payments' ),
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Store refund policy', 'poocommerce-payments' ),
		},
		{
			key: DOCUMENT_FIELD_KEYS.SHIPPING_DOCUMENTATION,
			label: __( 'Proof of shipping', 'poocommerce-payments' ),
		},
		{
			key: DOCUMENT_FIELD_KEYS.SERVICE_DOCUMENTATION,
			label: __( 'Item condition', 'poocommerce-payments' ),
		},
		{
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_POLICY,
			label: __( 'Cancellation policy', 'poocommerce-payments' ),
		},
		{
			key: DOCUMENT_FIELD_KEYS.ACCESS_ACTIVITY_LOG,
			label: __( 'Proof of active subscription', 'poocommerce-payments' ),
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
		},
	] as const;

	standardAttachments.forEach( ( { key, label } ) => {
		const evidence = dispute.evidence?.[ key ];
		if ( evidence && isEvidenceString( evidence ) ) {
			attachmentCount++;
			attachments.push(
				`• ${ label } (${ __(
					'Attachment',
					'poocommerce-payments'
				) } ${ String.fromCharCode( 64 + attachmentCount ) })`
			);
		}
	} );

	// If no attachments were provided, use default list
	if ( attachments.length === 0 ) {
		return `• ${ __(
			'<Attachment description>',
			'poocommerce-payments'
		) } (${ __( 'Attachment', 'poocommerce-payments' ) } A)
• ${ __( '<Attachment description>', 'poocommerce-payments' ) } (${ __(
			'Attachment',
			'poocommerce-payments'
		) } B)`;
	}

	return attachments.join( '\n' );
};

// --- Cover Letter Sections ---

export const generateHeader = ( data: CoverLetterData ): string => {
	return `${ data.merchantName }
${ data.merchantAddress }
${ data.merchantEmail }
${ data.merchantPhone }
${ data.today }`;
};

export const generateRecipient = ( data: CoverLetterData ): string => {
	return `${ __( 'To:', 'poocommerce-payments' ) } ${ data.acquiringBank }
${ __( 'Subject:', 'poocommerce-payments' ) } ${ __(
		'Chargeback Dispute',
		'poocommerce-payments'
	) } – ${ __( 'Case', 'poocommerce-payments' ) } #${ data.caseNumber }`;
};

const generateBodyUnrecognized = (
	data: CoverLetterData,
	dispute: ExtendedDispute,
	attachmentsList: string
): string => {
	return `${ __(
		'We are submitting evidence in response to chargeback',
		'poocommerce-payments'
	) } #${ data.caseNumber } ${ __(
		'for transaction',
		'poocommerce-payments'
	) } #${ data.transactionId } ${ __( 'on', 'poocommerce-payments' ) } ${
		data.transactionDate
	}.

${ __(
	'Our records indicate that the customer and legitimate cardholder,',
	'poocommerce-payments'
) } ${ data.customerName }, ${ __( 'ordered', 'poocommerce-payments' ) } ${
		data.product
	} ${ __( 'on', 'poocommerce-payments' ) } ${ data.orderDate }.

${ __(
	'To support our case, we are providing the following documentation:',
	'poocommerce-payments'
) }
${ attachmentsList }

${ __(
	'Based on this information, we respectfully request that the chargeback be reversed. Please let me know if any further details are required.',
	'poocommerce-payments'
) }`;
};

const generateBodyCreditNotProcessed = (
	data: CoverLetterData,
	dispute: ExtendedDispute,
	attachmentsList: string
): string => {
	if ( data.refundStatus === 'refund_has_been_issued' ) {
		return `${ __(
			'We are submitting evidence in response to chargeback',
			'poocommerce-payments'
		) } #${ data.caseNumber } ${ __(
			'for transaction',
			'poocommerce-payments'
		) } #${ data.transactionId } ${ __( 'on', 'poocommerce-payments' ) } ${
			data.transactionDate
		}.

${ __( 'Our records indicate that the customer,', 'poocommerce-payments' ) } ${
			data.customerName
		}, ${ __( 'was refunded on', 'poocommerce-payments' ) } ${
			data.orderDate
		} ${ __( 'for the amount of', 'poocommerce-payments' ) } ${
			dispute.amount
				? `${ ( dispute.amount / 100 ).toFixed(
						2
				  ) } ${ dispute.currency?.toUpperCase() }`
				: __( '[Refund Amount]', 'poocommerce-payments' )
		}. ${ __(
			"The refund was processed through our payment provider and should be visible on the customer's statement within 7 - 10 business days.",
			'poocommerce-payments'
		) }

${ __(
	'To support our case, we are providing the following documentation:',
	'poocommerce-payments'
) }
${ attachmentsList }

${ __(
	'Based on this information, we respectfully request that the chargeback be reversed. Please let us know if any further details are required.',
	'poocommerce-payments'
) }`;
	}
	// refund_was_not_owed
	return `${ __(
		'We are submitting evidence in response to chargeback',
		'poocommerce-payments'
	) } #${ data.caseNumber } ${ __(
		'for transaction',
		'poocommerce-payments'
	) } #${ data.transactionId } ${ __( 'on', 'poocommerce-payments' ) } ${
		data.transactionDate
	}.
${ __(
	'The customer requested a refund outside of the eligible window outlined in our refund policy, which was clearly presented on the website and on the order confirmation.',
	'poocommerce-payments'
) }

${ __(
	'To support our case, we are providing the following documentation:',
	'poocommerce-payments'
) }
${ attachmentsList }

${ __(
	'Based on this information, we respectfully request that the chargeback be reversed. Please let us know if any further details are required.',
	'poocommerce-payments'
) }`;
};

const generateBodyGeneral = (
	data: CoverLetterData,
	dispute: ExtendedDispute,
	attachmentsList: string
): string => {
	return `${ __(
		'We are submitting evidence in response to chargeback',
		'poocommerce-payments'
	) } #${ data.caseNumber } ${ __(
		'for transaction',
		'poocommerce-payments'
	) } #${ data.transactionId } ${ __( 'on', 'poocommerce-payments' ) } ${
		data.transactionDate
	}.

${ __( 'Our records indicate that the customer,', 'poocommerce-payments' ) } ${
		data.customerName
	}, ${ __( 'ordered', 'poocommerce-payments' ) } ${ data.product } ${ __(
		'on',
		'poocommerce-payments'
	) } ${ data.orderDate } ${ __(
		'and received it on',
		'poocommerce-payments'
	) } ${ data.deliveryDate }.

${ __(
	'To support our case, we are providing the following documentation:',
	'poocommerce-payments'
) }
${ attachmentsList }

${ __(
	'Based on this information, we respectfully request that the chargeback be reversed. Please let us know if any further details are required.',
	'poocommerce-payments'
) }`;
};

const generateBodyProductNotReceived = (
	data: CoverLetterData,
	dispute: ExtendedDispute,
	attachmentsList: string
): string => {
	return `${ __(
		'We are submitting evidence in response to chargeback',
		'poocommerce-payments'
	) } #${ data.caseNumber } ${ __(
		'for transaction',
		'poocommerce-payments'
	) } #${ data.transactionId } ${ __( 'on', 'poocommerce-payments' ) } ${
		data.transactionDate
	}.

${ __( 'Our records indicate that the customer,', 'poocommerce-payments' ) } ${
		data.customerName
	}, ${ __( 'ordered', 'poocommerce-payments' ) } ${ data.product } ${ __(
		'on',
		'poocommerce-payments'
	) } ${ data.orderDate } ${ __(
		'and received it on',
		'poocommerce-payments'
	) } ${ data.deliveryDate }.

${ __(
	'To support our case, we are providing the following documentation:',
	'poocommerce-payments'
) }
${ attachmentsList }

${ __(
	'Based on this information, we respectfully request that the chargeback be reversed. Please let us know if any further details are required.',
	'poocommerce-payments'
) }`;
};

const generateBodyProductUnacceptable = (
	data: CoverLetterData,
	dispute: ExtendedDispute,
	attachmentsList: string
): string => {
	return `${ __(
		'We are submitting evidence in response to chargeback',
		'poocommerce-payments'
	) } #${ data.caseNumber } ${ __(
		'for transaction',
		'poocommerce-payments'
	) } #${ data.transactionId } ${ __( 'on', 'poocommerce-payments' ) } ${
		data.transactionDate
	}.

${ __( 'Our records indicate that the customer,', 'poocommerce-payments' ) } ${
		data.customerName
	}, ${ __( 'ordered', 'poocommerce-payments' ) } ${ data.product } ${ __(
		'on',
		'poocommerce-payments'
	) } ${ data.orderDate }. ${ __(
		'The product matched the description provided at the time of sale, and we did not receive any indication from the customer that it was defective or not as described.',
		'poocommerce-payments'
	) }

${ __(
	'To support our case, we are providing the following documentation:',
	'poocommerce-payments'
) }
${ attachmentsList }

${ __(
	'Based on this information, we respectfully request that the chargeback be reversed. Please let us know if any further details are required.',
	'poocommerce-payments'
) }`;
};

const generateBodySubscriptionCanceled = (
	data: CoverLetterData,
	dispute: ExtendedDispute,
	attachmentsList: string
): string => {
	return `${ __(
		'We are submitting evidence in response to chargeback',
		'poocommerce-payments'
	) } #${ data.caseNumber } ${ __(
		'for transaction',
		'poocommerce-payments'
	) } #${ data.transactionId } ${ __( 'on', 'poocommerce-payments' ) } ${
		data.transactionDate
	}.

${ __( 'Our records indicate that the customer,', 'poocommerce-payments' ) } ${
		data.customerName
	}, ${ __( 'subscribed to', 'poocommerce-payments' ) } ${
		data.product
	} ${ __(
		"and was billed according to the terms accepted at the time of signup. The customer's account remained active and no cancellation was recorded prior to the billing date.",
		'poocommerce-payments'
	) }

${ __(
	'To support our case, we are providing the following documentation:',
	'poocommerce-payments'
) }
${ attachmentsList }

${ __(
	'Based on this information, we respectfully request that the chargeback be reversed. Please let us know if any further details are required.',
	'poocommerce-payments'
) }`;
};

export const generateBodyDuplicate = (
	data: CoverLetterData,
	dispute: ExtendedDispute,
	attachmentsList: string
): string => {
	if ( data.duplicateStatus === 'is_duplicate' ) {
		return `${ __(
			'We are submitting evidence in response to chargeback',
			'poocommerce-payments'
		) } #${ data.caseNumber } ${ __(
			'for transaction',
			'poocommerce-payments'
		) } #${ data.transactionId } ${ __( 'on', 'poocommerce-payments' ) } ${
			data.transactionDate
		}.
${ __(
	'Our records indicate that this charge was a duplicate of a previous transaction. A refund has already been issued to the customer on',
	'poocommerce-payments'
) } ${ data.orderDate } ${ __(
			'for the amount of',
			'poocommerce-payments'
		) } ${
			dispute.amount
				? `${ ( dispute.amount / 100 ).toFixed(
						2
				  ) } ${ dispute.currency?.toUpperCase() }`
				: __( '[Refund Amount]', 'poocommerce-payments' )
		}. ${ __(
			"This refund should be visible on the customer's statement within 7 - 10 business days.",
			'poocommerce-payments'
		) }

${ __(
	'To support our case, we are providing the following documentation:',
	'poocommerce-payments'
) }
${ attachmentsList }

${ __(
	'Based on this information, we respectfully request that the chargeback be reversed. Please let us know if any further details are required.',
	'poocommerce-payments'
) }`;
	}

	// is_not_duplicate
	return `${ __(
		'We are submitting evidence in response to chargeback',
		'poocommerce-payments'
	) } #${ data.caseNumber } ${ __(
		'for transaction',
		'poocommerce-payments'
	) } #${ data.transactionId } ${ __( 'on', 'poocommerce-payments' ) } ${
		data.transactionDate
	}.
${ __(
	'Our records show that the customer placed two distinct orders:',
	'poocommerce-payments'
) } ${ data.caseNumber } ${ __( 'and', 'poocommerce-payments' ) } ${
		data.transactionId
	}. ${ __(
		'Both transactions were legitimate, fulfilled independently, and are not duplicates.',
		'poocommerce-payments'
	) }

${ __(
	'To support our case, we are providing the following documentation:',
	'poocommerce-payments'
) }
${ attachmentsList }

${ __(
	'Based on this information, we respectfully request that the chargeback be reversed. Please let us know if any further details are required.',
	'poocommerce-payments'
) }`;
};

const bodyGenerators: { [ reason: string ]: CallableFunction } = {
	product_not_received: generateBodyProductNotReceived,
	credit_not_processed: generateBodyCreditNotProcessed,
	product_unacceptable: generateBodyProductUnacceptable,
	subscription_canceled: generateBodySubscriptionCanceled,
	duplicate: generateBodyDuplicate,
	fraudulent: generateBodyUnrecognized,
	unrecognized: generateBodyUnrecognized,
};

export const generateBody = (
	data: CoverLetterData,
	dispute: ExtendedDispute,
	attachmentsList: string
) => {
	const handler = bodyGenerators[ dispute.reason ] || generateBodyGeneral;
	return handler( data, dispute, attachmentsList );
};

export const generateClosing = ( data: CoverLetterData ): string => {
	return `${ __( 'Thank you,', 'poocommerce-payments' ) }
${ data.merchantName }`;
};

// --- Main Cover Letter Generation ---

export const generateCoverLetter = (
	dispute: ExtendedDispute,
	accountDetails: AccountDetails,
	settings: any,
	bankName: string | null,
	refundStatus?: string,
	duplicateStatus?: string
): string => {
	const todayUnixTimestamp = Math.floor( Date.now() / 1000 );
	const todayFormatted = formatDateTimeFromTimestamp( todayUnixTimestamp, {
		separator: ', ',
		includeTime: false,
	} );
	const data: CoverLetterData = {
		merchantAddress: formatMerchantAddress( accountDetails ),
		merchantName: accountDetails.name,
		merchantEmail:
			settings?.account_business_support_email ||
			__( '<business@email.com>', 'poocommerce-payments' ),
		merchantPhone:
			settings?.account_business_support_phone ||
			__( '<Business Phone Number>', 'poocommerce-payments' ),
		today: todayFormatted,
		acquiringBank: bankName || __( '<Bank Name>', 'poocommerce-payments' ),
		caseNumber:
			dispute?.id || __( '<Case Number>', 'poocommerce-payments' ),
		transactionId:
			dispute?.charge?.id ||
			__( '<Transaction ID>', 'poocommerce-payments' ),
		transactionDate: dispute?.created
			? formatDateTimeFromTimestamp( dispute.created, {
					separator: ', ',
					includeTime: true,
			  } )
			: __( '<Transaction Date>', 'poocommerce-payments' ),
		customerName:
			dispute?.charge?.billing_details?.name ||
			__( '<Customer Name>', 'poocommerce-payments' ),
		product:
			dispute?.evidence?.product_description &&
			isEvidenceString( dispute.evidence.product_description )
				? dispute.evidence.product_description
				: dispute?.charge?.level3?.line_items
						?.map( ( item: any ) => item.product_description )
						.filter( Boolean )
						.join( ', ' ) ||
				  __( '<Product>', 'poocommerce-payments' ),
		orderDate: dispute?.charge?.created
			? formatDateTimeFromTimestamp( dispute.charge.created, {
					separator: ', ',
					includeTime: true,
			  } )
			: __( '<Order Date>', 'poocommerce-payments' ),
		deliveryDate: formatDeliveryDate(
			dispute?.evidence?.shipping_date &&
				isEvidenceString( dispute.evidence.shipping_date )
				? dispute.evidence.shipping_date
				: undefined
		),
		refundStatus: refundStatus,
		duplicateStatus: duplicateStatus,
	};

	const attachmentsList = generateAttachments( dispute );
	const header = generateHeader( data );
	const recipient = generateRecipient( data );
	const greeting = __(
		'Dear Dispute Resolution Team,',
		'poocommerce-payments'
	);
	const body = generateBody( data, dispute, attachmentsList );
	const closing = generateClosing( data );

	return `${ header }

${ recipient }

${ greeting }

${ body }

${ closing }`;
};
