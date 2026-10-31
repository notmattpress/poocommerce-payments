/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Fallback labels for `dispute.evidence` keys not present (or not uniquely
 * labelled) in the wizard matrix. Consumed by `resolveFieldLabel` after
 * `findMatrixLabel` fails to resolve.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- This is a constant object.
export const FALLBACK_EVIDENCE_FIELD_LABELS: Record< string, string > = {
	billing_address: __( 'Billing address', 'poocommerce-payments' ),
	cancellation_policy_disclosure: __(
		'Cancellation policy disclosure',
		'poocommerce-payments'
	),
	cancellation_rebuttal: __( 'Cancellation logs', 'poocommerce-payments' ),
	// Base fields auto-merged by the wizard but absent from `evidenceMatrix`.
	// Labels match the wizard's, so outcome-view rows align with wizard rows.
	customer_communication: __(
		'Customer communication',
		'poocommerce-payments'
	),
	customer_signature: __( "Customer's signature", 'poocommerce-payments' ),
	// High-impact fields whose wizard labels are context-specific (e.g.
	// `shipping_documentation` = "Return tracking" in CNP cells). The
	// outcome view uses neutral Stripe-aligned labels for cells where no
	// matrix entry exists to borrow from (notably synthesised `multiple`).
	duplicate_charge_documentation: __(
		'Duplicate charge documentation',
		'poocommerce-payments'
	),
	duplicate_charge_explanation: __(
		'Duplicate charge explanation',
		'poocommerce-payments'
	),
	product_description: __( 'Product description', 'poocommerce-payments' ),
	receipt: __( 'Order receipt', 'poocommerce-payments' ),
	refund_policy: __( 'Refund policy', 'poocommerce-payments' ),
	refund_refusal_explanation: __(
		'Refund refusal explanation',
		'poocommerce-payments'
	),
	service_date: __( 'Service date', 'poocommerce-payments' ),
	shipping_address: __( 'Shipping address', 'poocommerce-payments' ),
	shipping_carrier: __( 'Shipping carrier', 'poocommerce-payments' ),
	shipping_date: __( 'Shipping date', 'poocommerce-payments' ),
	shipping_documentation: __(
		'Shipping documentation',
		'poocommerce-payments'
	),
	shipping_tracking_number: __(
		'Shipping tracking number',
		'poocommerce-payments'
	),
	// Catch-all. Wizard cells label this differently per status branch in
	// some composite cells (e.g. "Other documents" vs "Proof of acceptance"),
	// so collision detection in `findMatrixLabel` triggers this fallback.
	uncategorized_file: __( 'Other documents', 'poocommerce-payments' ),
};
