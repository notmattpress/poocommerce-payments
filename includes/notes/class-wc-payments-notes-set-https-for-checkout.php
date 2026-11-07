<?php
/**
 * Set up ensure https on checkout note for PooCommerce inbox.
 *
 * @package PooCommerce\Payments\Admin
 */

use Automattic\PooCommerce\Admin\Notes\Note;
use Automattic\PooCommerce\Admin\Notes\NoteTraits;

defined( 'ABSPATH' ) || exit;

/**
 * Class WC_Payments_Notes_Set_Https_For_Checkout
 */
class WC_Payments_Notes_Set_Https_For_Checkout {
	use NoteTraits {
		can_be_added as protected trait_can_be_added;
	}

	/**
	 * Name of the note for use in the database.
	 */
	const NOTE_NAME = 'wc-payments-notes-set-https-for-checkout';

	/**
	 * Name of the note for use in the database.
	 */
	const NOTE_DOCUMENTATION_URL = 'https://poocommerce.com/document/ssl-and-https/#poocommerce-force-ssl-setting';

	/**
	 * Checks if a note can and should be added.
	 *
	 * @return bool
	 */
	public static function can_be_added() {
		// This note only makes sense if HTTPS is not enforced yet.
		if ( 'yes' === get_option( 'poocommerce_force_ssl_checkout' ) || wc_site_is_https() ) {
			return false;
		}

		return self::trait_can_be_added();
	}

	/**
	 * Get the note.
	 */
	public static function get_note() {
		$note = new Note();

		$note->set_title( __( 'Enable secure checkout', 'poocommerce-payments' ) );
		$note->set_content( __( 'Enable HTTPS on your checkout pages to display all available payment methods and protect your customers data.', 'poocommerce-payments' ) );
		$note->set_content_data( (object) [] );
		$note->set_type( Note::E_WC_ADMIN_NOTE_INFORMATIONAL );
		$note->set_name( self::NOTE_NAME );
		$note->set_source( 'poocommerce-payments' );
		$note->add_action(
			self::NOTE_NAME,
			__( 'Read more', 'poocommerce-payments' ),
			self::NOTE_DOCUMENTATION_URL,
			'unactioned',
			true
		);

		return $note;
	}
}
