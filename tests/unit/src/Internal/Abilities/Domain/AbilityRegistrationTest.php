<?php
/**
 * Tests the registration arguments shared by every WooPayments ability.
 *
 * @package PooCommerce\Payments\Tests
 */

namespace WCPay\Tests\Internal\Abilities\Domain;

use WCPAY_UnitTestCase;
use WCPay\Internal\Abilities\AbilitiesRegistrar;
use WCPay\Internal\Abilities\Domain;

/**
 * Checks each ability's name, annotations and required input in one table.
 *
 * Ability-specific schema properties are tested in each ability's own test class.
 */
class AbilityRegistrationTest extends WCPAY_UnitTestCase {

	public function test_table_covers_every_registered_ability(): void {
		$reflection = new \ReflectionClass( AbilitiesRegistrar::class );
		$registered = $reflection->getReflectionConstant( 'ABILITY_CLASSES' )->getValue();

		$tested = array_column( $this->provider_abilities(), 0 );

		sort( $registered );
		sort( $tested );
		$this->assertSame( $registered, $tested );
	}

	/**
	 * @dataProvider provider_abilities
	 */
	public function test_registration_args( string $ability_class, string $name, array $flags, array $required ): void {
		$args = $ability_class::get_registration_args();

		$this->assertSame( $name, $ability_class::get_name() );
		$this->assertSame( 'poocommerce', $args['category'] );
		$this->assertSame( [ $ability_class, 'execute' ], $args['execute_callback'] );
		$this->assertSame( [ AbilitiesRegistrar::class, 'current_user_can_manage_poocommerce' ], $args['permission_callback'] );
		$this->assertTrue( $args['meta']['show_in_rest'] );
		$this->assertSame(
			$flags,
			[
				'readonly'    => $args['meta']['annotations']['readonly'],
				'destructive' => $args['meta']['annotations']['destructive'],
				'idempotent'  => $args['meta']['annotations']['idempotent'],
				'mcp_public'  => $args['meta']['mcp']['public'],
			]
		);
		$this->assertSame( 'object', $args['input_schema']['type'] );
		$this->assertFalse( $args['input_schema']['additionalProperties'] );
		$this->assertSame( $required, $args['input_schema']['required'] ?? [] );
	}

	/**
	 * Columns: class, name, flags, required input.
	 */
	public function provider_abilities(): array {
		$read_only      = [
			'readonly'    => true,
			'destructive' => false,
			'idempotent'  => true,
			'mcp_public'  => true,
		];
		$refund         = [
			'readonly'    => false,
			'destructive' => true,
			'idempotent'  => true,
			'mcp_public'  => false,
		];
		$dispute_action = [
			'readonly'    => false,
			'destructive' => true,
			'idempotent'  => false,
			'mcp_public'  => false,
		];
		$file_upload    = [
			'readonly'    => false,
			'destructive' => false,
			'idempotent'  => false,
			'mcp_public'  => false,
		];

		return [
			'get account'                  => [ Domain\GetAccount::class, 'poocommerce-payments/get-account', $read_only, [] ],
			'get deposits overview'        => [ Domain\GetDepositsOverview::class, 'poocommerce-payments/get-deposits-overview', $read_only, [] ],
			'get active loan summary'      => [ Domain\GetActiveLoanSummary::class, 'poocommerce-payments/get-active-loan-summary', $read_only, [] ],
			'get transactions summary'     => [ Domain\GetTransactionsSummary::class, 'poocommerce-payments/get-transactions-summary', $read_only, [] ],
			'get disputes summary'         => [ Domain\GetDisputesSummary::class, 'poocommerce-payments/get-disputes-summary', $read_only, [] ],
			'get authorizations summary'   => [ Domain\GetAuthorizationsSummary::class, 'poocommerce-payments/get-authorizations-summary', $read_only, [] ],
			'get deposits summary'         => [ Domain\GetDepositsSummary::class, 'poocommerce-payments/get-deposits-summary', $read_only, [] ],
			'get dispute'                  => [ Domain\GetDispute::class, 'poocommerce-payments/get-dispute', $read_only, [ 'dispute_id' ] ],
			'get payment intent'           => [ Domain\GetPaymentIntent::class, 'poocommerce-payments/get-payment-intent', $read_only, [ 'payment_intent_id' ] ],
			'get charge'                   => [ Domain\GetCharge::class, 'poocommerce-payments/get-charge', $read_only, [ 'charge_id' ] ],
			'get timeline'                 => [ Domain\GetTimeline::class, 'poocommerce-payments/get-timeline', $read_only, [ 'intention_id' ] ],
			'get transactions'             => [ Domain\GetTransactions::class, 'poocommerce-payments/get-transactions', $read_only, [] ],
			'get disputes'                 => [ Domain\GetDisputes::class, 'poocommerce-payments/get-disputes', $read_only, [] ],
			'get authorizations'           => [ Domain\GetAuthorizations::class, 'poocommerce-payments/get-authorizations', $read_only, [] ],
			'get deposits'                 => [ Domain\GetDeposits::class, 'poocommerce-payments/get-deposits', $read_only, [] ],
			'get balance'                  => [ Domain\GetBalance::class, 'poocommerce-payments/get-balance', $read_only, [ 'date_start', 'date_end', 'currency' ] ],
			'get fraud outcomes'           => [ Domain\GetFraudOutcomes::class, 'poocommerce-payments/get-fraud-outcomes', $read_only, [ 'status' ] ],
			'get fees summary'             => [ Domain\GetFeesSummary::class, 'poocommerce-payments/get-fees-summary', $read_only, [] ],
			'refund charge'                => [ Domain\RefundCharge::class, 'poocommerce-payments/refund-charge', $refund, [ 'charge_id', 'idempotency_key' ] ],
			'submit dispute evidence'      => [ Domain\SubmitDisputeEvidence::class, 'poocommerce-payments/submit-dispute-evidence', $dispute_action, [ 'dispute_id' ] ],
			'accept dispute'               => [ Domain\AcceptDispute::class, 'poocommerce-payments/accept-dispute', $dispute_action, [ 'dispute_id' ] ],
			'upload dispute evidence file' => [ Domain\UploadDisputeEvidenceFile::class, 'poocommerce-payments/upload-dispute-evidence-file', $file_upload, [ 'file_name', 'file_type', 'file_contents' ] ],
		];
	}
}
