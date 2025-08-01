/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { RecommendedDocument } from './types';

/**
 * Document field keys used across different dispute types.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- This is a constant object.
export const DOCUMENT_FIELD_KEYS = {
	RECEIPT: 'receipt',
	CUSTOMER_COMMUNICATION: 'customer_communication',
	CUSTOMER_SIGNATURE: 'customer_signature',
	UNCATEGORIZED_FILE: 'uncategorized_file',
	REFUND_POLICY: 'refund_policy',
	DUPLICATE_CHARGE_DOCUMENTATION: 'duplicate_charge_documentation',
	CANCELLATION_POLICY: 'cancellation_policy',
	ACCESS_ACTIVITY_LOG: 'access_activity_log',
	SERVICE_DOCUMENTATION: 'service_documentation',
	SHIPPING_DOCUMENTATION: 'shipping_documentation',
} as const;

/**
 * Get recommended document fields based on dispute reason
 *
 * @param {string} reason - The dispute reason
 * @param {string} refundStatus - The refund status (for credit_not_processed disputes)
 * @param {string} duplicateStatus - The duplicate status (for duplicate disputes)
 * @return {Array<{key: string, label: string}>} Array of recommended document fields
 */
const getRecommendedDocumentFields = (
	reason: string,
	refundStatus?: string,
	duplicateStatus?: string
): Array< RecommendedDocument > => {
	// Define fields with their order
	const orderedFields = [
		// Default fields that apply to all dispute types
		{
			key: DOCUMENT_FIELD_KEYS.RECEIPT,
			label: __( 'Order receipt', 'poocommerce-payments' ),
			description: __(
				"A copy of the customer's receipt, which can be found in the receipt history for this transaction.",
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CUSTOMER_COMMUNICATION,
			label: __( 'Customer communication', 'poocommerce-payments' ),
			description: __(
				'Any correspondence with the customer regarding this purchase.',
				'poocommerce-payments'
			),
			order: 20,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100, // Always last
		},
	];

	// Reason-specific fields with their order
	const reasonSpecificFields: Record<
		string,
		Array< RecommendedDocument >
	> = {
		credit_not_processed:
			refundStatus === 'refund_was_not_owed'
				? [
						// For refund_was_not_owed: Order receipt, Customer communication, Store refund policy, Other documents
						{
							key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
							label: __(
								'Store refund policy',
								'poocommerce-payments'
							),
							description: __(
								"A screenshot of your store's refund policy.",
								'poocommerce-payments'
							),
							order: 40,
						},
				  ]
				: [
						// For refund_has_been_issued: Current selection (Order receipt, Customer communication, Customer signature, Store refund policy, Item condition, Other documents)
						{
							key: DOCUMENT_FIELD_KEYS.CUSTOMER_SIGNATURE,
							label: __(
								"Customer's signature",
								'poocommerce-payments'
							),
							description: __(
								"Any relevant documents showing the customer's signature, such as signed proof of delivery.",
								'poocommerce-payments'
							),
							order: 30,
						},
						{
							key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
							label: __(
								'Store refund policy',
								'poocommerce-payments'
							),
							description: __(
								"A screenshot of your store's refund policy.",
								'poocommerce-payments'
							),
							order: 40,
						},
						{
							key: DOCUMENT_FIELD_KEYS.SERVICE_DOCUMENTATION,
							label: __(
								'Item condition',
								'poocommerce-payments'
							),
							description: __(
								'A screenshot of the item condition.',
								'poocommerce-payments'
							),
							order: 50,
						},
				  ],
		duplicate:
			duplicateStatus === 'is_duplicate'
				? [
						// For is_duplicate: Order receipt, Customer communication, Proof of active subscription, Store refund policy, Terms of service, Other documents
						{
							key: DOCUMENT_FIELD_KEYS.ACCESS_ACTIVITY_LOG,
							label: __(
								'Proof of active subscription',
								'poocommerce-payments'
							),
							description: __(
								'Any documents showing the billing history, subscription status, or cancellation logs, for example.',
								'poocommerce-payments'
							),
							order: 30,
						},
						{
							key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
							label: __(
								'Store refund policy',
								'poocommerce-payments'
							),
							description: __(
								"A screenshot of your store's refund policy.",
								'poocommerce-payments'
							),
							order: 40,
						},
						{
							key: DOCUMENT_FIELD_KEYS.CANCELLATION_POLICY,
							label: __(
								'Terms of service',
								'poocommerce-payments'
							),
							description: __(
								"A screenshot of your store's terms of service.",
								'poocommerce-payments'
							),
							order: 50,
						},
				  ]
				: [
						// For is_not_duplicate: Order receipt, Customer communication, Store refund policy, Other documents
						{
							key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
							label: __(
								'Store refund policy',
								'poocommerce-payments'
							),
							description: __(
								"A screenshot of your store's refund policy.",
								'poocommerce-payments'
							),
							order: 30,
						},
				  ],
		subscription_canceled: [
			{
				key: DOCUMENT_FIELD_KEYS.ACCESS_ACTIVITY_LOG,
				label: __(
					'Proof of active subscription',
					'poocommerce-payments'
				),
				description: __(
					'Any documents showing the billing history, subscription status, or cancellation logs, for example.',
					'poocommerce-payments'
				),
				order: 30,
			},
			{
				key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
				label: __( 'Store refund policy', 'poocommerce-payments' ),
				description: __(
					"A screenshot of your store's refund policy.",
					'poocommerce-payments'
				),
				order: 40,
			},
			{
				key: DOCUMENT_FIELD_KEYS.CANCELLATION_POLICY,
				label: __( 'Terms of service', 'poocommerce-payments' ),
				description: __(
					"A screenshot of your store's terms of service.",
					'poocommerce-payments'
				),
				order: 50,
			},
		],
		fraudulent: [
			{
				key: DOCUMENT_FIELD_KEYS.CUSTOMER_SIGNATURE,
				label: __( "Customer's signature", 'poocommerce-payments' ),
				description: __(
					"Any relevant documents showing the customer's signature, such as signed proof of delivery.",
					'poocommerce-payments'
				),
				order: 30,
			},
			{
				key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
				label: __( 'Store refund policy', 'poocommerce-payments' ),
				description: __(
					"A screenshot of your store's refund policy.",
					'poocommerce-payments'
				),
				order: 40,
			},
		],
		product_not_received: [
			{
				key: DOCUMENT_FIELD_KEYS.CUSTOMER_SIGNATURE,
				label: __( "Customer's signature", 'poocommerce-payments' ),
				description: __(
					"Any relevant documents showing the customer's signature, such as signed proof of delivery.",
					'poocommerce-payments'
				),
				order: 30,
			},
			{
				key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
				label: __( 'Store refund policy', 'poocommerce-payments' ),
				description: __(
					"A screenshot of your store's refund policy.",
					'poocommerce-payments'
				),
				order: 40,
			},
		],
		product_unacceptable: [
			{
				key: DOCUMENT_FIELD_KEYS.CUSTOMER_SIGNATURE,
				label: __( "Customer's signature", 'poocommerce-payments' ),
				description: __(
					"Any relevant documents showing the customer's signature, such as signed proof of delivery.",
					'poocommerce-payments'
				),
				order: 30,
			},
			{
				key: DOCUMENT_FIELD_KEYS.SERVICE_DOCUMENTATION,
				label: __( 'Item condition', 'poocommerce-payments' ),
				description: __(
					'A screenshot of the item condition.',
					'poocommerce-payments'
				),
				order: 40,
			},
			{
				key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
				label: __( 'Store refund policy', 'poocommerce-payments' ),
				description: __(
					"A screenshot of your store's refund policy.",
					'poocommerce-payments'
				),
				order: 50,
			},
		],
		unrecognized: [
			{
				key: DOCUMENT_FIELD_KEYS.CUSTOMER_SIGNATURE,
				label: __( "Customer's signature", 'poocommerce-payments' ),
				description: __(
					"Any relevant documents showing the customer's signature, such as signed proof of delivery.",
					'poocommerce-payments'
				),
				order: 30,
			},
			{
				key: DOCUMENT_FIELD_KEYS.ACCESS_ACTIVITY_LOG,
				label: __(
					'Proof of active subscription',
					'poocommerce-payments'
				),
				description: __(
					'Such as billing history, subscription status, or cancellation logs.',
					'poocommerce-payments'
				),
				order: 40,
			},
		],
		general: [
			{
				key: DOCUMENT_FIELD_KEYS.ACCESS_ACTIVITY_LOG,
				label: __(
					'Proof of active subscription',
					'poocommerce-payments'
				),
				description: __(
					'Such as billing history, subscription status, or cancellation logs.',
					'poocommerce-payments'
				),
				order: 40,
			},
			{
				key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
				label: __( 'Store refund policy', 'poocommerce-payments' ),
				description: __(
					"A screenshot of your store's refund policy.",
					'poocommerce-payments'
				),
				order: 50,
			},
			{
				key: DOCUMENT_FIELD_KEYS.SERVICE_DOCUMENTATION,
				label: __( 'Terms of service', 'poocommerce-payments' ),
				description: __(
					"A screenshot of your store's terms of service.",
					'poocommerce-payments'
				),
				order: 60,
			},
		],
	};

	// For credit_not_processed with refund_was_not_owed, we need to filter out customer_signature from orderedFields
	const baseFields = orderedFields;

	// Combine default fields with reason-specific fields
	const allFields = [
		...baseFields,
		...( reasonSpecificFields[ reason ] || reasonSpecificFields.general ),
	];

	// Sort fields by order and remove the order property
	return allFields
		.sort( ( a, b ) => a.order - b.order )
		.map( ( { key, label, description } ) => ( {
			key,
			label,
			description,
			order: 0,
		} ) );
};

const getRecommendedShippingDocumentFields = (): Array<
	RecommendedDocument
> => {
	return [
		{
			key: DOCUMENT_FIELD_KEYS.SHIPPING_DOCUMENTATION,
			label: __( 'Proof of shipping', 'poocommerce-payments' ),
			description: __(
				'A receipt from the shipping carrier or a tracking number, for example.',
				'poocommerce-payments'
			),
			order: 0,
		},
	];
};

export { getRecommendedDocumentFields, getRecommendedShippingDocumentFields };
