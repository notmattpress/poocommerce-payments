<?php
/**
 * Class Blocks_Data_Extractor
 *
 * @package PooCommerce\Payments
 */

namespace WCPay;

use Automattic\PooCommerce\StoreApi\StoreApi;
use Automattic\PooCommerce\StoreApi\Schemas\ExtendSchema;
use Automattic\PooCommerce\Blocks\StoreApi\Schemas\CheckoutSchema;
use Automattic\PooCommerce\Blocks\Integrations\IntegrationRegistry;

defined( 'ABSPATH' ) || exit; // block direct access.

/**
 * Extract data fields from certain block based plugins.
 */
class Blocks_Data_Extractor {

	/**
	 * Instance of the integration registry.
	 *
	 * @var IntegrationRegistry
	 */
	private $integration_registry;


	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->integration_registry = new IntegrationRegistry();
	}

	/**
	 * Get a list of available Blocks.
	 *
	 * @return array
	 */
	private function get_available_blocks() {
		$blocks = [];
		if ( class_exists( '\AutomateWoo\Blocks\Marketing_Optin_Block' ) ) {
			$blocks[] = new \Automatewoo\Blocks\Marketing_Optin_Block();
		}

		if ( class_exists( '\Mailchimp_Woocommerce_Newsletter_Blocks_Integration' ) ) {
			$blocks[] = new \Mailchimp_Woocommerce_Newsletter_Blocks_Integration();
		}

		if ( class_exists( '\WCK\Blocks\CheckoutIntegration' ) ) {
			$blocks[] = new \WCK\Blocks\CheckoutIntegration();
		}

		return $blocks;
	}

	/**
	 * Register all the blocks.
	 *
	 * @param array $blocks A list of blocks to register.
	 * @return void
	 */
	private function register_blocks( $blocks ) {
		foreach ( $blocks as $block ) {
			$this->integration_registry->register( $block );
		}
	}

	/**
	 * Unregister all blocks.
	 *
	 * @param array $blocks A list of blocks to unregister.
	 * @return void
	 */
	private function unregister_blocks( $blocks ) {
		foreach ( $blocks as $block ) {
			$this->integration_registry->unregister( $block );
		}
	}

	/**
	 * Mailpoet's block registration is different from the other two plugins. Data fields are passed
	 * from the parent class. This method fetches the data fields without registering the plugin.
	 *
	 * @return array
	 */
	private function get_mailpoet_data() {
		$mailpoet_wc_subscription = \MailPoet\DI\ContainerWrapper::getInstance()->get( \MailPoet\PooCommerce\Subscription::class );
		$settings_instance        = \MailPoet\Settings\SettingsController::getInstance();
		$settings                 = [
			'defaultText'   => $settings_instance->get( 'poocommerce.optin_on_checkout.message', '' ),
			'optinEnabled'  => $settings_instance->get( 'poocommerce.optin_on_checkout.enabled', false ),
			'defaultStatus' => false,
		];

		if ( version_compare( \MAILPOET_VERSION, '4.18.0', '<=' ) ) {
			$settings['defaultStatus'] = $mailpoet_wc_subscription->isCurrentUserSubscribed();
		}
		return $settings;
	}

	/**
	 * Retrieve data fields.
	 *
	 * @return array
	 */
	public function get_data() {
		$blocks = $this->get_available_blocks();

		$this->register_blocks( $blocks );

		$blocks_data = $this->integration_registry->get_all_registered_script_data();

		if ( class_exists( 'MailPoet\DI\ContainerWrapper' ) && class_exists( 'MailPoet\PooCommerce\Subscription' ) ) {
			$blocks_data += [ 'mailpoet_data' => $this->get_mailpoet_data() ];
		}

		$this->unregister_blocks( $blocks );

		return $blocks_data;
	}

	/**
	 * Retrieves the namespaces in the Store API checkout schema.
	 *
	 * @return array
	 */
	public function get_checkout_schema_namespaces(): array {
		$namespaces = [];

		if (
			class_exists( 'Automattic\PooCommerce\StoreApi\StoreApi' ) &&
			class_exists( 'Automattic\PooCommerce\StoreApi\Schemas\ExtendSchema' ) &&
			class_exists( 'Automattic\PooCommerce\Blocks\StoreApi\Schemas\CheckoutSchema' )
		) {
			try {
				$checkout_schema = StoreApi::container()->get( ExtendSchema::class )->get_endpoint_schema( CheckoutSchema::IDENTIFIER );
			} catch ( \Exception $e ) {
				return $namespaces;
			}

			$namespaces = array_keys( (array) $checkout_schema );
		}

		return $namespaces;
	}
}
