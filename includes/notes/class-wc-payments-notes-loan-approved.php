<?php
/**
 * Display a notice to merchants that have WCPay installed to inform them
 * that a loan offer has been approved from Stripe.
 *
 * @package PooCommerce\Payments\Admin
 */

use Automattic\PooCommerce\Admin\Notes\Note;
use Automattic\PooCommerce\Admin\Notes\Notes;
use Automattic\PooCommerce\Admin\Notes\NoteTraits;

defined( 'ABSPATH' ) || exit;

/**
 * Class WC_Payments_Notes_Loan_Approved
 */
class WC_Payments_Notes_Loan_Approved {
	use NoteTraits;

	/**
	 * Prefix of the note for use in the database.
	 */
	const NOTE_NAME = 'wc-payments-notes-loan-approved';

	/**
	 * Nonce action name
	 */
	const NOTE_ACTION = 'view-capital-page';

	/**
	 * Loan information to build the message.
	 *
	 * @var array
	 */
	private static $loan_info;

	/**
	 * Get the note.
	 */
	public static function get_note() {
		$note        = new Note();
		$dummy_order = wc_create_order();
		$dummy_order->set_currency( self::$loan_info['details']['currency'] );

		$note->set_title( __( 'Your capital loan has been approved!', 'poocommerce-payments' ) );
		$note->set_content(
			sprintf(
				/* Translators: %1: total amount lent to the merchant formatted in the account currency, %2: WooPayments */
				__(
					'Congratulations! Your capital loan has been approved and %1$s was deposited into the bank account linked to %2$s. You\'ll automatically repay the loan, plus a flat fee, through a fixed percentage of each %2$s transaction.',
					'poocommerce-payments'
				),
				WC_Payments_Explicit_Price_Formatter::get_explicit_price(
					wc_price(
						WC_Payments_Utils::interpret_stripe_amount( self::$loan_info['details']['advance_amount'] ),
						[ 'currency' => self::$loan_info['details']['currency'] ]
					),
					$dummy_order
				),
				'WooPayments'
			)
		);

		$note->set_content_data(
			(object) [
				'advance_amount'      => self::$loan_info['details']['advance_amount'],
				'advance_paid_out_at' => self::$loan_info['details']['advance_paid_out_at'],
			]
		);
		$note->set_type( Note::E_WC_ADMIN_NOTE_INFORMATIONAL );
		$note->set_name( self::NOTE_NAME );
		$note->set_source( 'poocommerce-payments' );
		$note->add_action(
			self::NOTE_NAME,
			__( 'View loan details', 'poocommerce-payments' ),
			admin_url( 'admin.php?page=wc-admin&path=/payments/loans' ),
			Note::E_WC_ADMIN_NOTE_UNACTIONED,
			true
		);

		return $note;
	}

	/**
	 * Add the note if it passes predefined conditions.
	 */
	public static function possibly_add_note() {
		// If we have the correct information, proceed. Otherwise, delete existing notes.
		if ( ! self::validate_inputs() ) {
			// We don't have the necessary info to create a note, do nothing.
			return;
		}

		// Check if the current loan info matches with the received one. If it matches, don't add a new one.
		if ( ! self::check_attached_loan_data_is_different() ) {
			// Loan paid out dates are the same, do nothing.
			return;
		}

		// Do the overridden work.
		if ( ! self::can_be_added() ) {
			return;
		}

		$new_note = self::get_note();
		$new_note->save();
	}

	/**
	 * Check if the stored loan info has all the values we need.
	 *
	 * @return bool
	 */
	private static function validate_inputs() {
		// If the loan amount isn't set correctly, don't push the note, and delete the old one if exists.
		if ( ! isset(
			self::$loan_info['details']['currency'],
			self::$loan_info['details']['advance_amount'],
			self::$loan_info['details']['advance_paid_out_at']
		)
			|| ! is_numeric( self::$loan_info['details']['advance_amount'] )
			|| empty( self::$loan_info['details']['currency'] )
		) {
			// There's something wrong with the loan information, delete the existing note, just in case of wrong information.
			return false;
		}

		self::$loan_info['details']['currency'] = strtoupper( self::$loan_info['details']['currency'] );

		return true;
	}

	/**
	 * Checks the saved paid out date on the previous note and deletes it if it doesn't match, to create a new one.
	 *
	 * @return bool
	 */
	private static function check_attached_loan_data_is_different() {
		$data_store = WC_Data_Store::load( 'admin-note' );
		$note_ids   = $data_store->get_notes_with_name( self::NOTE_NAME );

		if ( ! empty( $note_ids ) ) {
			$note = Notes::get_note( $note_ids[0] );
			if ( $note instanceof Note ) {
				$content_data = (array) $note->get_content_data();
				if ( isset( $content_data['advance_paid_out_at'], $content_data['advance_amount'] ) ) {
					if ( self::$loan_info['details']['advance_paid_out_at'] === $content_data['advance_paid_out_at'] &&
						self::$loan_info['details']['advance_amount'] === $content_data['advance_amount'] ) {
						// Note already exists for the current loan. No action will be taken.
						return false;
					}
				}
				// The note isn't for the current loan. Delete it to create a new one.
				$data_store->delete( $note );
			}
		}

		return true;
	}

	/**
	 * Sets the loan information on the class.
	 *
	 * @param array $loan_info loan information.
	 */
	public static function set_loan_details( array $loan_info ) {
		self::$loan_info = $loan_info;
	}
}
