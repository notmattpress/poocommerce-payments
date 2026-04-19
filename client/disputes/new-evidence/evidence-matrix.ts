/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { RecommendedDocument } from './types';
import { DOCUMENT_FIELD_KEYS } from './document-field-keys';

/**
 * Evidence matrix that maps [reason][productType] to recommended document fields.
 *
 * This provides a scalable way to define evidence suggestions for different
 * combinations of dispute reasons and product types.
 *
 * Each entry contains only the fields specific to that combination.
 * Base fields (Customer communication) are automatically merged in by
 * getRecommendedDocumentFields() when retrieving matrix entries.
 */
type EvidenceMatrix = {
	[ reason: string ]: {
		[ productType: string ]: Array< RecommendedDocument >;
	};
};

/**
 * Get evidence matrix entries for duplicate disputes.
 *
 * Duplicate disputes depend on both product type AND duplicate status.
 * Keys are formatted as: `${productType}__${duplicateStatus}`
 */
const getDuplicateMatrix = (): {
	[ key: string ]: Array< RecommendedDocument >;
} => ( {
	// Physical Product - It was a duplicate (Scenario A)
	physical_product__is_duplicate: [
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
			key: DOCUMENT_FIELD_KEYS.REFUND_RECEIPT_DOCUMENTATION,
			label: __( 'Refund receipt', 'poocommerce-payments' ),
			description: __(
				'A confirmation that a refund was issued.',
				'poocommerce-payments'
			),
			order: 15,
		},
		{
			key: DOCUMENT_FIELD_KEYS.ACCESS_ACTIVITY_LOG,
			label: __( 'Proof of active subscription', 'poocommerce-payments' ),
			description: __(
				'Any documents showing the billing history, subscription status, or cancellation logs, for example.',
				'poocommerce-payments'
			),
			order: 22,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_POLICY,
			label: __( 'Terms of service', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's terms of service.",
				'poocommerce-payments'
			),
			order: 30,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Physical Product - It was not a duplicate (Scenario B)
	physical_product__is_not_duplicate: [
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
			key: DOCUMENT_FIELD_KEYS.DUPLICATE_CHARGE_DOCUMENTATION,
			label: __( 'Any additional receipts', 'poocommerce-payments' ),
			description: __(
				'Receipt(s) for any other order(s) from this customer.',
				'poocommerce-payments'
			),
			order: 12,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Booking/Reservation - It was a duplicate (Scenario A)
	booking_reservation__is_duplicate: [
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
			key: DOCUMENT_FIELD_KEYS.REFUND_RECEIPT_DOCUMENTATION,
			label: __( 'Refund receipt', 'poocommerce-payments' ),
			description: __(
				'A confirmation that a refund was issued.',
				'poocommerce-payments'
			),
			order: 15,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Booking/Reservation - It was not a duplicate (Scenario B)
	booking_reservation__is_not_duplicate: [
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
			key: DOCUMENT_FIELD_KEYS.DUPLICATE_CHARGE_DOCUMENTATION,
			label: __( 'Any additional receipts', 'poocommerce-payments' ),
			description: __(
				'Receipt(s) for any other order(s) from this customer.',
				'poocommerce-payments'
			),
			order: 12,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Digital Product/Service - It was a duplicate (Scenario A)
	digital_product_or_service__is_duplicate: [
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
			key: DOCUMENT_FIELD_KEYS.REFUND_RECEIPT_DOCUMENTATION,
			label: __( 'Refund receipt', 'poocommerce-payments' ),
			description: __(
				'A confirmation that a refund was issued.',
				'poocommerce-payments'
			),
			order: 15,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Digital Product/Service - It was not a duplicate (Scenario B)
	digital_product_or_service__is_not_duplicate: [
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
			key: DOCUMENT_FIELD_KEYS.DUPLICATE_CHARGE_DOCUMENTATION,
			label: __( 'Any additional receipts', 'poocommerce-payments' ),
			description: __(
				'Receipt(s) for any other order(s) from this customer.',
				'poocommerce-payments'
			),
			order: 12,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Offline Service - It was a duplicate (Scenario A)
	offline_service__is_duplicate: [
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
			key: DOCUMENT_FIELD_KEYS.REFUND_RECEIPT_DOCUMENTATION,
			label: __( 'Refund receipt', 'poocommerce-payments' ),
			description: __(
				'A confirmation that a refund was issued.',
				'poocommerce-payments'
			),
			order: 15,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Offline Service - It was not a duplicate (Scenario B)
	offline_service__is_not_duplicate: [
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
			key: DOCUMENT_FIELD_KEYS.DUPLICATE_CHARGE_DOCUMENTATION,
			label: __( 'Any additional receipts', 'poocommerce-payments' ),
			description: __(
				'Receipt(s) for any other order(s) from this customer.',
				'poocommerce-payments'
			),
			order: 12,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Event - It was a duplicate (Scenario A)
	event__is_duplicate: [
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
			key: DOCUMENT_FIELD_KEYS.REFUND_RECEIPT_DOCUMENTATION,
			label: __( 'Refund receipt', 'poocommerce-payments' ),
			description: __(
				'A confirmation that a refund was issued.',
				'poocommerce-payments'
			),
			order: 15,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Event - It was not a duplicate (Scenario B)
	event__is_not_duplicate: [
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
			key: DOCUMENT_FIELD_KEYS.DUPLICATE_CHARGE_DOCUMENTATION,
			label: __( 'Any additional receipts', 'poocommerce-payments' ),
			description: __(
				'Receipt(s) for any other order(s) from this customer.',
				'poocommerce-payments'
			),
			order: 12,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Other - It was a duplicate (Scenario A)
	other__is_duplicate: [
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
			key: DOCUMENT_FIELD_KEYS.REFUND_RECEIPT_DOCUMENTATION,
			label: __( 'Refund receipt', 'poocommerce-payments' ),
			description: __(
				'A confirmation that a refund was issued.',
				'poocommerce-payments'
			),
			order: 15,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Other - It was not a duplicate (Scenario B)
	other__is_not_duplicate: [
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
			key: DOCUMENT_FIELD_KEYS.DUPLICATE_CHARGE_DOCUMENTATION,
			label: __( 'Any additional receipts', 'poocommerce-payments' ),
			description: __(
				'Receipt(s) for any other order(s) from this customer.',
				'poocommerce-payments'
			),
			order: 12,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
} );

/**
 * Get evidence matrix entries for subscription_canceled disputes.
 *
 * For 'multiple' product type, subscription logs are not included
 * since multiple products may have different subscription states.
 *
 * For 'other' product type, simplified fields are shown per specs.
 */
const getSubscriptionCanceledMatrix = (): {
	[ productType: string ]: Array< RecommendedDocument >;
} => ( {
	// Physical Product product type
	physical_product: [
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
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_REBUTTAL,
			label: __( 'Cancellation logs', 'poocommerce-payments' ),
			description: __(
				'Records showing no cancellation attempt or request was made before the charge, such as account activity, subscription status, or communication history.',
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 30,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_POLICY,
			label: __( 'Terms of service', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's terms of service.",
				'poocommerce-payments'
			),
			order: 35,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Booking/Reservation product type
	booking_reservation: [
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
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_REBUTTAL,
			label: __( 'Cancellation logs', 'poocommerce-payments' ),
			description: __(
				'Records showing no cancellation attempt or request was made before the charge, such as account activity, subscription status, or communication history.',
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_POLICY,
			label: __( 'Terms of service', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's terms of service.",
				'poocommerce-payments'
			),
			order: 30,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Offline Service product type
	offline_service: [
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
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_REBUTTAL,
			label: __( 'Cancellation logs', 'poocommerce-payments' ),
			description: __(
				'Records showing no cancellation attempt or request was made before the charge, such as account activity, subscription status, or communication history.',
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_POLICY,
			label: __( 'Terms of service', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's terms of service.",
				'poocommerce-payments'
			),
			order: 30,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Event product type
	event: [
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
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_REBUTTAL,
			label: __( 'Cancellation logs', 'poocommerce-payments' ),
			description: __(
				'Records showing no cancellation attempt or request was made before the charge, such as account activity, subscription status, or communication history.',
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_POLICY,
			label: __( 'Terms of service', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's terms of service.",
				'poocommerce-payments'
			),
			order: 30,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Digital Product/Service product type
	digital_product_or_service: [
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
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_REBUTTAL,
			label: __( 'Cancellation logs', 'poocommerce-payments' ),
			description: __(
				'Records showing no cancellation attempt or request was made before the charge, such as account activity, subscription status, or communication history.',
				'poocommerce-payments'
			),
			order: 15,
		},
		{
			key: DOCUMENT_FIELD_KEYS.ACCESS_ACTIVITY_LOG,
			label: __( 'Login or usage records', 'poocommerce-payments' ),
			description: __(
				'Any documents showing the login history, usage activity, or access logs for the digital product or service.',
				'poocommerce-payments'
			),
			order: 22,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_POLICY,
			label: __( 'Terms of service', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's terms of service.",
				'poocommerce-payments'
			),
			order: 30,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Other product type - per specs
	other: [
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
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_POLICY,
			label: __( 'Terms of service', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's terms of service.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Multiple product type - no subscription logs
	multiple: [
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
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
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
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
} );

/**
 * Get evidence matrix entries for product_not_received disputes.
 */
const getProductNotReceivedMatrix = (): {
	[ productType: string ]: Array< RecommendedDocument >;
} => ( {
	// Physical Product product type
	physical_product: [
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
			key: DOCUMENT_FIELD_KEYS.CUSTOMER_SIGNATURE,
			label: __( "Customer's signature", 'poocommerce-payments' ),
			description: __(
				"Any relevant documents showing the customer's signature, such as signed proof of delivery.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 30,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Digital Product/Service product type
	digital_product_or_service: [
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
			key: DOCUMENT_FIELD_KEYS.ACCESS_ACTIVITY_LOG,
			label: __( 'Login or usage records', 'poocommerce-payments' ),
			description: __(
				'Any documents showing the login history, usage activity, or access logs for the digital product or service.',
				'poocommerce-payments'
			),
			order: 15,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Booking/Reservation product type
	booking_reservation: [
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
			key: DOCUMENT_FIELD_KEYS.SERVICE_DOCUMENTATION,
			label: __(
				'Reservation or booking confirmation',
				'poocommerce-payments'
			),
			description: __(
				'Any documents showing the service completion, attendance or reservation confirmation.',
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_REBUTTAL,
			label: __( 'Cancellation confirmation', 'poocommerce-payments' ),
			description: __(
				'Documents showing the product or service was canceled, such as cancellation logs, confirmation emails, or account records.',
				'poocommerce-payments'
			),
			order: 30,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Offline Service product type
	offline_service: [
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
			key: DOCUMENT_FIELD_KEYS.SERVICE_DOCUMENTATION,
			label: __( 'Proof of service completion', 'poocommerce-payments' ),
			description: __(
				'Screenshots or documents showing the service was completed and delivered to the customer.',
				'poocommerce-payments'
			),
			order: 15,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Event product type
	event: [
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
			key: DOCUMENT_FIELD_KEYS.SERVICE_DOCUMENTATION,
			label: __( 'Attendance confirmation', 'poocommerce-payments' ),
			description: __(
				'Any documents showing the service completion, attendance or reservation confirmation.',
				'poocommerce-payments'
			),
			order: 15,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Other product type
	other: [
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
			key: DOCUMENT_FIELD_KEYS.SERVICE_DOCUMENTATION,
			label: __( 'Service completion records', 'poocommerce-payments' ),
			description: __(
				'Screenshots or documents showing the service was completed and delivered to the customer.',
				'poocommerce-payments'
			),
			order: 15,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
} );

/**
 * Get evidence matrix entries for product_unacceptable disputes.
 */
const getProductUnacceptableMatrix = (): {
	[ productType: string ]: Array< RecommendedDocument >;
} => ( {
	// Physical Product product type
	physical_product: [
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
			key: DOCUMENT_FIELD_KEYS.CUSTOMER_SIGNATURE,
			label: __( "Customer's signature", 'poocommerce-payments' ),
			description: __(
				"Any relevant documents showing the customer's signature, such as signed proof of delivery.",
				'poocommerce-payments'
			),
			order: 15,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.SERVICE_DOCUMENTATION,
			label: __( "Item's condition", 'poocommerce-payments' ),
			description: __(
				"Photos showing the item's condition prior to shipping.",
				'poocommerce-payments'
			),
			order: 30,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Digital Product/Service product type
	digital_product_or_service: [
		{
			key: DOCUMENT_FIELD_KEYS.SERVICE_DOCUMENTATION,
			label: __( 'Proof of delivered service', 'poocommerce-payments' ),
			description: __(
				'Screenshots or documents showing the digital product or service was delivered and accessible to the customer.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.RECEIPT,
			label: __( 'Order receipt', 'poocommerce-payments' ),
			description: __(
				"A copy of the customer's receipt, which can be found in the receipt history for this transaction.",
				'poocommerce-payments'
			),
			order: 12,
		},
		{
			key: DOCUMENT_FIELD_KEYS.ACCESS_ACTIVITY_LOG,
			label: __( 'Login or usage records', 'poocommerce-payments' ),
			description: __(
				'Any documents showing the login history, usage activity, or access logs for the digital product or service.',
				'poocommerce-payments'
			),
			order: 15,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Booking/Reservation product type
	booking_reservation: [
		{
			key: DOCUMENT_FIELD_KEYS.SERVICE_DOCUMENTATION,
			label: __(
				'Event or booking documentation',
				'poocommerce-payments'
			),
			description: __(
				'Screenshots or documents showing the event or reservation details (date, location, description, and terms) and confirmation it occurred or remained valid as described.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.RECEIPT,
			label: __( 'Order receipt', 'poocommerce-payments' ),
			description: __(
				"A copy of the customer's receipt, which can be found in the receipt history for this transaction.",
				'poocommerce-payments'
			),
			order: 15,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Offline Service product type
	offline_service: [
		{
			key: DOCUMENT_FIELD_KEYS.SERVICE_DOCUMENTATION,
			label: __( 'Proof of delivered service', 'poocommerce-payments' ),
			description: __(
				'Screenshots or documents showing the service was completed and delivered to the customer.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.RECEIPT,
			label: __( 'Order receipt', 'poocommerce-payments' ),
			description: __(
				"A copy of the customer's receipt, which can be found in the receipt history for this transaction.",
				'poocommerce-payments'
			),
			order: 12,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Event product type
	event: [
		{
			key: DOCUMENT_FIELD_KEYS.SERVICE_DOCUMENTATION,
			label: __(
				'Event or booking documentation',
				'poocommerce-payments'
			),
			description: __(
				'Screenshots or documents showing the event or reservation details (date, location, description, and terms) and confirmation it occurred or remained valid as described.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.RECEIPT,
			label: __( 'Order receipt', 'poocommerce-payments' ),
			description: __(
				"A copy of the customer's receipt, which can be found in the receipt history for this transaction.",
				'poocommerce-payments'
			),
			order: 12,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Other product type
	other: [
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
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_POLICY,
			label: __( 'Terms of service', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's terms of service.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
} );

/**
 * Get evidence matrix entries for credit_not_processed disputes.
 *
 * Credit not processed disputes depend on both product type AND refund status.
 * Keys are formatted as: `${productType}__${refundStatus}`
 */
const getCreditNotProcessedMatrix = (): {
	[ key: string ]: Array< RecommendedDocument >;
} => ( {
	// Physical Product - Refund has been issued (Scenario A)
	// Note: CUSTOMER_COMMUNICATION is included explicitly with its proper label.
	// This prevents the auto-merge from adding a duplicate "Customer communication" field.
	physical_product__refund_has_been_issued: [
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
			key: DOCUMENT_FIELD_KEYS.REFUND_RECEIPT_DOCUMENTATION,
			label: __( 'Refund receipt', 'poocommerce-payments' ),
			description: __(
				'A confirmation that a merchant is waiting for a return prior to refund.',
				'poocommerce-payments'
			),
			order: 12,
		},
		{
			key: DOCUMENT_FIELD_KEYS.SHIPPING_DOCUMENTATION,
			label: __( 'Return tracking', 'poocommerce-payments' ),
			description: __(
				'A confirmation that a merchant is waiting for a return prior to refund (if applicable).',
				'poocommerce-payments'
			),
			order: 15,
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
			key: DOCUMENT_FIELD_KEYS.CUSTOMER_SIGNATURE,
			label: __( "Customer's signature", 'poocommerce-payments' ),
			description: __(
				"Any relevant documents showing the customer's signature, such as signed proof of delivery.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 30,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Physical Product - Refund was not owed (Scenario B)
	// Note: CUSTOMER_COMMUNICATION is included with its proper label.
	// SERVICE_DOCUMENTATION is used for "Other documents" since UNCATEGORIZED_FILE
	// is already used for "Proof of acceptance".
	physical_product__refund_was_not_owed: [
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Proof of acceptance', 'poocommerce-payments' ),
			description: __(
				'Screenshot or document showing where the customer agreed to or acknowledged the refund policy during checkout or on the receipt.',
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
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.SERVICE_DOCUMENTATION,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Digital Product/Service - Refund has been issued (Scenario A)
	// Note: CUSTOMER_COMMUNICATION is repurposed as "Other documents" to prevent
	// the base "Customer communication" field from being auto-merged.
	digital_product_or_service__refund_has_been_issued: [
		{
			key: DOCUMENT_FIELD_KEYS.RECEIPT,
			label: __( 'Refund receipt', 'poocommerce-payments' ),
			description: __(
				'A copy of the refund receipt, which can be found in the receipt history for this transaction.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_REBUTTAL,
			label: __( 'Cancellation logs', 'poocommerce-payments' ),
			description: __(
				'Records showing no cancellation attempt or request was made before the charge, such as account activity, subscription status, or communication history.',
				'poocommerce-payments'
			),
			order: 20,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CUSTOMER_COMMUNICATION,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Digital Product/Service - Refund was not owed (Scenario B)
	// Note: CUSTOMER_COMMUNICATION is used here as "Other documents" because
	// UNCATEGORIZED_FILE is already used for "Proof of acceptance".
	// Including CUSTOMER_COMMUNICATION in the matrix also prevents the base
	// "Customer communication" field from being auto-merged.
	digital_product_or_service__refund_was_not_owed: [
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Proof of acceptance', 'poocommerce-payments' ),
			description: __(
				'Screenshot or document showing where the customer agreed to or acknowledged the refund policy during checkout or on the receipt.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CUSTOMER_COMMUNICATION,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Booking/Reservation - Refund has been issued (Scenario A)
	// Note: CUSTOMER_COMMUNICATION is repurposed as "Other documents" to prevent
	// the base "Customer communication" field from being auto-merged.
	booking_reservation__refund_has_been_issued: [
		{
			key: DOCUMENT_FIELD_KEYS.RECEIPT,
			label: __( 'Refund receipt', 'poocommerce-payments' ),
			description: __(
				'A copy of the refund receipt, which can be found in the receipt history for this transaction.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_REBUTTAL,
			label: __( 'Cancellation logs', 'poocommerce-payments' ),
			description: __(
				'Records showing no cancellation attempt or request was made before the charge, such as account activity, subscription status, or communication history.',
				'poocommerce-payments'
			),
			order: 20,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CUSTOMER_COMMUNICATION,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Booking/Reservation - Refund was not owed (Scenario B)
	// Note: CUSTOMER_COMMUNICATION is used here as "Other documents" because
	// UNCATEGORIZED_FILE is already used for "Proof of acceptance".
	// Including CUSTOMER_COMMUNICATION in the matrix also prevents the base
	// "Customer communication" field from being auto-merged.
	booking_reservation__refund_was_not_owed: [
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Proof of acceptance', 'poocommerce-payments' ),
			description: __(
				'Screenshot or document showing where the customer agreed to or acknowledged the refund policy during checkout or on the receipt.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CUSTOMER_COMMUNICATION,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Offline Service - Refund has been issued (Scenario A)
	// Note: CUSTOMER_COMMUNICATION is repurposed as "Other documents" to prevent
	// the base "Customer communication" field from being auto-merged.
	offline_service__refund_has_been_issued: [
		{
			key: DOCUMENT_FIELD_KEYS.RECEIPT,
			label: __( 'Refund receipt', 'poocommerce-payments' ),
			description: __(
				'A copy of the refund receipt, which can be found in the receipt history for this transaction.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_REBUTTAL,
			label: __( 'Cancellation logs', 'poocommerce-payments' ),
			description: __(
				'Records showing no cancellation attempt or request was made before the charge, such as account activity, subscription status, or communication history.',
				'poocommerce-payments'
			),
			order: 20,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CUSTOMER_COMMUNICATION,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Offline Service - Refund was not owed (Scenario B)
	// Note: CUSTOMER_COMMUNICATION is used here as "Other documents" because
	// UNCATEGORIZED_FILE is already used for "Proof of acceptance".
	// Including CUSTOMER_COMMUNICATION in the matrix also prevents the base
	// "Customer communication" field from being auto-merged.
	offline_service__refund_was_not_owed: [
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Proof of acceptance', 'poocommerce-payments' ),
			description: __(
				'Screenshot or document showing where the customer agreed to or acknowledged the refund policy during checkout or on the receipt.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CUSTOMER_COMMUNICATION,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Event - Refund has been issued (Scenario A)
	// Note: CUSTOMER_COMMUNICATION is repurposed as "Other documents" to prevent
	// the base "Customer communication" field from being auto-merged.
	event__refund_has_been_issued: [
		{
			key: DOCUMENT_FIELD_KEYS.RECEIPT,
			label: __( 'Refund receipt', 'poocommerce-payments' ),
			description: __(
				'A copy of the refund receipt, which can be found in the receipt history for this transaction.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CANCELLATION_REBUTTAL,
			label: __( 'Cancellation logs', 'poocommerce-payments' ),
			description: __(
				'Records showing no cancellation attempt or request was made before the charge, such as account activity, subscription status, or communication history.',
				'poocommerce-payments'
			),
			order: 20,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CUSTOMER_COMMUNICATION,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Event - Refund was not owed (Scenario B)
	// Note: CUSTOMER_COMMUNICATION is used here as "Other documents" because
	// UNCATEGORIZED_FILE is already used for "Proof of acceptance".
	// Including CUSTOMER_COMMUNICATION in the matrix also prevents the base
	// "Customer communication" field from being auto-merged.
	event__refund_was_not_owed: [
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Proof of acceptance', 'poocommerce-payments' ),
			description: __(
				'Screenshot or document showing where the customer agreed to or acknowledged the refund policy during checkout or on the receipt.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CUSTOMER_COMMUNICATION,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Other - Refund has been issued (Scenario A)
	// Note: CUSTOMER_COMMUNICATION is repurposed as "Other documents" to prevent
	// the base "Customer communication" field from being auto-merged.
	// Uses SHIPPING_DOCUMENTATION for "Return tracking" per spec.
	other__refund_has_been_issued: [
		{
			key: DOCUMENT_FIELD_KEYS.RECEIPT,
			label: __( 'Refund receipt', 'poocommerce-payments' ),
			description: __(
				'A copy of the refund receipt, which can be found in the receipt history for this transaction.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.SHIPPING_DOCUMENTATION,
			label: __( 'Return tracking', 'poocommerce-payments' ),
			description: __(
				'A confirmation that a merchant is waiting for a return prior to refund (if applicable).',
				'poocommerce-payments'
			),
			order: 15,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CUSTOMER_COMMUNICATION,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Other - Refund was not owed (Scenario B)
	// Note: CUSTOMER_COMMUNICATION is used here as "Other documents" because
	// UNCATEGORIZED_FILE is already used for "Proof of acceptance".
	// Including CUSTOMER_COMMUNICATION in the matrix also prevents the base
	// "Customer communication" field from being auto-merged.
	other__refund_was_not_owed: [
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Proof of acceptance', 'poocommerce-payments' ),
			description: __(
				'Screenshot or document showing where the customer agreed to or acknowledged the refund policy during checkout or on the receipt.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CUSTOMER_COMMUNICATION,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
} );

/**
 * Get evidence matrix entries for fraudulent disputes.
 */
const getFraudulentMatrix = (): {
	[ productType: string ]: Array< RecommendedDocument >;
} => ( {
	// Physical Product product type
	physical_product: [
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
			key: DOCUMENT_FIELD_KEYS.ACCESS_ACTIVITY_LOG,
			label: __(
				'Prior undisputed transaction history',
				'poocommerce-payments'
			),
			description: __(
				'Proof of past undisputed transactions from the same customer, with matching billing and device details.',
				'poocommerce-payments'
			),
			order: 15,
		},
		{
			key: DOCUMENT_FIELD_KEYS.CUSTOMER_SIGNATURE,
			label: __( "Customer's signature", 'poocommerce-payments' ),
			description: __(
				"Any relevant documents showing the customer's signature, such as signed proof of delivery.",
				'poocommerce-payments'
			),
			order: 25,
		},
		{
			key: DOCUMENT_FIELD_KEYS.REFUND_POLICY,
			label: __( 'Refund policy', 'poocommerce-payments' ),
			description: __(
				"A screenshot of your store's refund policy.",
				'poocommerce-payments'
			),
			order: 30,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Digital Product/Service product type
	// Note: SERVICE_DOCUMENTATION is repurposed as "Prior undisputed transaction history"
	// because ACCESS_ACTIVITY_LOG is already used for "Login or usage records".
	digital_product_or_service: [
		{
			key: DOCUMENT_FIELD_KEYS.ACCESS_ACTIVITY_LOG,
			label: __( 'Login or usage records', 'poocommerce-payments' ),
			description: __(
				'Any documents showing the login history, usage activity, or access logs for the digital product or service.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.SERVICE_DOCUMENTATION,
			label: __(
				'Prior undisputed transaction history',
				'poocommerce-payments'
			),
			description: __(
				'Proof of past undisputed transactions from the same customer, with matching billing and device details.',
				'poocommerce-payments'
			),
			order: 15,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Booking/Reservation product type
	booking_reservation: [
		{
			key: DOCUMENT_FIELD_KEYS.ACCESS_ACTIVITY_LOG,
			label: __(
				'Prior undisputed transaction history',
				'poocommerce-payments'
			),
			description: __(
				'Proof of past undisputed transactions from the same customer, with matching billing and device details.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Offline Service product type
	offline_service: [
		{
			key: DOCUMENT_FIELD_KEYS.ACCESS_ACTIVITY_LOG,
			label: __(
				'Prior undisputed transaction history',
				'poocommerce-payments'
			),
			description: __(
				'Proof of past undisputed transactions from the same customer, with matching billing and device details.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Event product type
	event: [
		{
			key: DOCUMENT_FIELD_KEYS.ACCESS_ACTIVITY_LOG,
			label: __(
				'Prior undisputed transaction history',
				'poocommerce-payments'
			),
			description: __(
				'Proof of past undisputed transactions from the same customer, with matching billing and device details.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
	// Other product type
	other: [
		{
			key: DOCUMENT_FIELD_KEYS.ACCESS_ACTIVITY_LOG,
			label: __(
				'Prior undisputed transaction history',
				'poocommerce-payments'
			),
			description: __(
				'Proof of past undisputed transactions from the same customer, with matching billing and device details.',
				'poocommerce-payments'
			),
			order: 10,
		},
		{
			key: DOCUMENT_FIELD_KEYS.UNCATEGORIZED_FILE,
			label: __( 'Other documents', 'poocommerce-payments' ),
			description: __(
				'Any other relevant documents that will support your case.',
				'poocommerce-payments'
			),
			order: 100,
		},
	],
} );

/**
 * The complete evidence matrix mapping reason codes to product types to fields.
 *
 * Usage:
 *   const fields = evidenceMatrix['fraudulent']?.['booking_reservation'];
 *
 * This matrix is only used when the feature flag is enabled.
 * When no matrix entry exists, the function falls back to the existing logic.
 */
export const evidenceMatrix: EvidenceMatrix = {
	fraudulent: getFraudulentMatrix(),
	product_not_received: getProductNotReceivedMatrix(),
	subscription_canceled: getSubscriptionCanceledMatrix(),
	product_unacceptable: getProductUnacceptableMatrix(),
	duplicate: getDuplicateMatrix(),
	credit_not_processed: getCreditNotProcessedMatrix(),
};

/**
 * Get recommended document fields from the evidence matrix.
 *
 * For most reasons, lookup is by [reason][productType].
 * For 'duplicate' and 'credit_not_processed' reasons, lookup uses composite key: [reason][productType__status]
 *
 * @param reason - The dispute reason code
 * @param productType - The product type
 * @param status - Optional status for status-dependent reasons (e.g., duplicateStatus or refundStatus)
 * @return Array of recommended document fields, or undefined if no matrix entry exists
 */
export const getMatrixFields = (
	reason: string,
	productType: string,
	status?: string
): Array< RecommendedDocument > | undefined => {
	// For duplicate and credit_not_processed disputes, use composite key with status
	if (
		( reason === 'duplicate' || reason === 'credit_not_processed' ) &&
		status
	) {
		const compositeKey = `${ productType }__${ status }`;
		return evidenceMatrix[ reason ]?.[ compositeKey ];
	}

	// Return the matrix entry for the specific productType, or undefined if not found
	return evidenceMatrix[ reason ]?.[ productType ];
};
