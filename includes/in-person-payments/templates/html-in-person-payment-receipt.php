<?php
/**
 * In Person Payments Receipt Template
 *
 * @package PooCommerce\Payments
 */

/**
 * Helper to generate markup to render a price.
 *
 * @param  array  $product The product to display.
 * @param  string $currency The currency to display.
 * @return string
 */
function format_price_helper( array $product, string $currency ): string {
	$active_price  = $product['price'];
	$regular_price = $product['regular_price'];
	$has_discount  = $active_price !== $regular_price;

	if ( $has_discount ) {
		return '<s>' . wc_price( $regular_price, [ 'currency' => $currency ] ) . '</s> ' . wc_price( $active_price, [ 'currency' => $currency ] );
	}

	return wc_price( $active_price, [ 'currency' => $currency ] );
}

?><!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Print Receipt</title>
	<style>
		body {
			margin: 0;
			padding: 0;
			border: 0;
		}

		.align-left {
			text-align: left;
		}

		.align-right {
			text-align: right;
		}
		.align-top {
			vertical-align: top;
		}

		.receipt {
			min-width: 130px;
			max-width: 300px;
			margin: 0 auto;
			text-align: center;
			font-family: SF Pro Text, sans-serif;
			font-size: 10px;

		}

		.receipt-table {
			width: 100%;
			border-collapse: separate;
			border-spacing: 0 2px;
			font-size: 10px;
		}

		.receipt__header .title {
			font-size: 14px;
			line-height: 17px;
			margin-bottom: 12px;
			margin-top: 12px;
			font-weight: 700;
		}

		.receipt__header .store {
			padding: 0 12px;
		}

		.receipt__header .store__address {
			margin-top: 12px;
			line-height: 2px;
		}

		.receipt__header .store__contact {
			margin-top: 4px;
		}

		.receipt__header .order__title {
			font-weight: 800;
		}

		.receipt__transaction {
			line-height: 2px;
		}

		.branding-logo {
			max-width: 250px;
			margin: 20px auto;
		}

		#powered_by {
			font-size: 7px;
			padding-top: 5px;
		}

	</style>
</head>
<body>
	<div class="receipt">
		<div class="receipt__header">
			<?php if ( ! empty( $branding_logo['content_type'] ) ) { ?>
				<img class="branding-logo" src="data:<?php echo esc_html( $branding_logo['content_type'] ); ?>;base64,<?php echo esc_html( $branding_logo['file_content'] ); ?>" alt="<?php echo esc_html( $business_name ); ?>"/>
			<?php } ?>
			<h1 class="title"><?php echo esc_html( $business_name ); ?></h1>
			<hr />
			<div class="store">
				<?php if ( $support_address ) { ?>
				<div class="store__address">
					<p><?php echo esc_html( $support_address['line1'] ); ?></p>
					<p><?php echo esc_html( $support_address['line2'] ); ?></p>
					<p><?php echo esc_html( implode( ' ', [ $support_address['city'], $support_address['state'], $support_address['postal_code'], $support_address['country'] ] ) ); ?></p>
					<?php echo esc_html( gmdate( 'Y/m/d - H:iA' ) ); ?>
				</div>
				<?php } ?>
				<p class="store__contact">
					<?php echo esc_html( implode( ' ', [ $support_phone, $support_email ] ) ); ?>
				</p>
			</div>
			<div class="order">
				<p class="order__title"><?php printf( '%s %s', esc_html__( 'Order', 'poocommerce-payments' ), esc_html( $order['id'] ) ); ?></p>
			</div>
		</div>
		<hr />
		<div class="receipt__products">
			<table class="receipt-table">
				<?php foreach ( $line_items as $item ) { ?>
				<tr>
					<td class="align-left">
						<div><?php echo esc_html( $item['name'] ); ?></div>
						<div><?php echo esc_html( $item['quantity'] ); ?> @ <?php echo wp_kses( format_price_helper( $item['product'], $order['currency'] ), 'post' ); ?></div>
						<div><?php printf( '%s: %s', esc_html__( 'SKU', 'poocommerce-payments' ), esc_html( $item['product']['id'] ) ); ?></div> <!-- TODO SKU or ID? -->
					</td>
					<td class="align-right align-top"><?php echo wp_kses( wc_price( $item['subtotal'], [ 'currency' => $order['currency'] ] ), 'post' ); ?></td>
				</tr>
				<?php } ?>
			</table>
		</div>
		<hr />
		<div class="receipt__subtotal">
			<table class="receipt-table">
				<tr>
					<td class="align-left"><b><?php echo esc_html__( 'SUBTOTAL', 'poocommerce-payments' ); ?></b></td>
					<td class="align-right"><b><?php echo wp_kses( wc_price( $order['subtotal'], [ 'currency' => $order['currency'] ] ), 'post' ); ?></b></td>
				</tr>
				<?php foreach ( $coupon_lines as $order_coupon ) { ?>
				<tr>
					<td class="align-left">
						<div><?php printf( '%s: %s', esc_html__( 'Discount', 'poocommerce-payments' ), esc_html( $order_coupon['code'] ) ); ?></div>
						<div><?php echo esc_html( $order_coupon['description'] ); ?></div>
					</td>
					<td class="align-right align-top"><?php echo wp_kses( wc_price( abs( $order_coupon['discount'] ) * -1, [ 'currency' => $order['currency'] ] ), 'post' ); ?></td>
				</tr>
				<?php } ?>
				<?php if ( 0 < $order['total_fees'] ) : ?>
					<tr>
						<td class="align-left"><?php esc_html_e( 'Fees:', 'poocommerce-payments' ); ?></td>
						<td class="align-right align-top">
							<?php echo wp_kses( wc_price( $order['total_fees'], [ 'currency' => $order['currency'] ] ), 'post' ); ?>
						</td>
					</tr>
				<?php endif; ?>
				<?php if ( 0 < $order['shipping_tax'] ) : ?>
					<tr>
						<td class="align-left"><?php esc_html_e( 'Shipping:', 'poocommerce-payments' ); ?></td>
						<td class="align-right align-top">
							<?php echo wp_kses( wc_price( $order['shipping_tax'], [ 'currency' => $order['currency'] ] ), 'post' ); ?>
						</td>
					</tr>
				<?php endif; ?>
				<?php foreach ( $tax_lines as $tax_line ) { ?>
				<tr>
					<td class="align-left">
						<div><?php echo esc_html__( 'Tax', 'poocommerce-payments' ); ?></div>
						<div><?php echo esc_html( wc_round_tax_total( $tax_line['rate_percent'] ) ); ?>%</div>
					</td>
					<td class="align-right align-top"><?php echo wp_kses( wc_price( $tax_line['tax_total'] + $tax_line['shipping_tax_total'], [ 'currency' => $order['currency'] ] ), 'post' ); ?></td>
				</tr>
				<?php } ?>
				<tr>
					<td colspan="2" class="align-left"></td>
				</tr>
				<tr>
					<td class="align-left"><b><?php echo esc_html__( 'TOTAL', 'poocommerce-payments' ); ?></b></td>
					<td class="align-right"><b><?php echo wp_kses( wc_price( $order['total'], [ 'currency' => $order['currency'] ] ), 'post' ); ?></b></td>
				</tr>
			</table>
		</div>
		<hr />
		<div class="receipt__amount-paid">
			<table class="receipt-table">
				<tr>
					<td class="align-left"><b><?php echo esc_html__( 'AMOUNT PAID', 'poocommerce-payments' ); ?></b>:</td>
					<td class="align-right"><b><?php echo wp_kses( wc_price( $amount_captured, [ 'currency' => $order['currency'] ] ), 'post' ); ?></b></td>
				</tr>
				<tr>
					<td colspan="2" class="align-left"><?php echo esc_html( sprintf( '%s - %s', ucfirst( $payment_method_details['brand'] ), $payment_method_details['last4'] ) ); ?></td>
				</tr>
			</table>
		</div>
		<hr />
		<div class="receipt__transaction">
			<p id="application-preferred-name"><?php printf( '%s: %s', esc_html__( 'Application name', 'poocommerce-payments' ), esc_html( ucfirst( $receipt['application_preferred_name'] ) ) ); ?></p>
			<p id="dedicated-file-name"><?php printf( '%s: %s', esc_html__( 'AID', 'poocommerce-payments' ), esc_html( ucfirst( $receipt['dedicated_file_name'] ) ) ); ?></p>
			<p id="account_type"><?php printf( '%s: %s', esc_html__( 'Account Type', 'poocommerce-payments' ), esc_html( ucfirst( $receipt['account_type'] ) ) ); ?></p>
			<p id="powered_by"><?php echo esc_html__( 'Powered by PooCommerce', 'poocommerce-payments' ); ?></p>
		</div>
	</div>
</body>
</html>
