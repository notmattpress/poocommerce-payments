<?php
/**
 * WC_Payments_Tasks class
 *
 * @package PooCommerce\Payments\Tasks
 */

use Automattic\PooCommerce\Admin\Features\OnboardingTasks\TaskLists;
use PooCommerce\Payments\Tasks\WC_Payments_Task_Disputes;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Hooks into WC TaskLists to display WCPay tasks.
 */
class WC_Payments_Tasks {

	/**
	 * WC_Payments_Admin_Tasks constructor.
	 */
	public static function init() {
		// As PooCommerce Onboarding tasks need to hook into 'init' and requires an API call.
		// We only add this task for users who can manage_poocommerce / view the task.
		if ( ! current_user_can( 'manage_poocommerce' ) ) {
			return;
		}

		add_action( 'init', [ __CLASS__, 'add_task_disputes_need_response' ] );
	}

	/**
	 * Adds a task to the WC 'Things to do next' task list the if disputes awaiting response.
	 */
	public static function add_task_disputes_need_response() {
		$account_service = WC_Payments::get_account_service();
		// The task is not required if the account is not connected, under review, or rejected.
		if ( ! $account_service || ! $account_service->is_stripe_account_valid() || $account_service->is_account_under_review() || $account_service->is_account_rejected() ) {
			return;
		}
		include_once WCPAY_ABSPATH . 'includes/admin/tasks/class-wc-payments-task-disputes.php';

		// 'extended' = 'Things to do next' task list on PooCommerce > Home.
		TaskLists::add_task( 'extended', new WC_Payments_Task_Disputes() );
	}
}
