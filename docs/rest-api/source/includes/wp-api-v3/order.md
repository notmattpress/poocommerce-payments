# Order

The order API allows you to perform operations such as capture a terminal payment, create an intent, create a customer, etc. for a particular order.

## Create a terminal intent

_@since v3.5.0_

Create a new in-person payment intent for the given order ID without confirming it.

### Error codes

-   `wcpay_missing_order` - Order not found
-   `wcpay_server_error` - Unexpected server error
-   `wcpay_intent_creation_error` - Unknown error

### HTTP request

<div class="api-endpoint">
	<div class="endpoint-data">
		<i class="label label-get">POST</i>
		<h6>/wp-json/wc/v3/payments/orders/&lt;order_id&gt;/create_terminal_intent</h6>
	</div>
</div>

### Optional parameters

-   `payment_methods` - array with payment methods. Accepted values: `card_present` and `interac_present`
-   `metadata` - metadata that will be attached to the PaymentIntent
-   `customer_id` - customer that will be attached to the PaymentIntent

```shell
curl -X POST https://example.com/wp-json/wc/v3/payments/orders/42/create_terminal_intent \
	-u consumer_key:consumer_secret
```

> JSON response example:

```json
{
	"id": "pi_ZZZZZZZZZZZZZZZZAAAAAAAA"
}
```

```json
{
	"code": "wcpay_intent_creation_error",
	"message": "Intent creation failed with the following message: <reason>",
	"data": {
		"status": 500
	}
}
```

## Capture a terminal payment

_@since v2.4.0_

Capture the funds of an in-person payment intent. Given an intent ID and an order ID, add the intent ID to the order and capture it.

### POST params

-   payment_intent_id: string

### Error codes

-   `wcpay_missing_order` - Order not found
-   `wcpay_refunded_order_uncapturable` - Payment cannot be captured for partially or fully refunded orders
-   `wcpay_payment_uncapturable` - The payment cannot be captured if intent status is not one of 'processing', 'requires_capture', or 'succeeded'
-   `wcpay_capture_error` - Unknown error
-   `wcpay_capture_error_amount_too_small` - The payment cannot be captured because the amount is too small. It includes the minimum amount and the currency as JSON in the message.

### HTTP request

<div class="api-endpoint">
	<div class="endpoint-data">
		<i class="label label-get">POST</i>
		<h6>/wp-json/wc/v3/payments/orders/&lt;order_id&gt;/capture_terminal_payment</h6>
	</div>
</div>

```shell
curl -X POST https://example.com/wp-json/wc/v3/payments/orders/42/capture_terminal_payment \
	-u consumer_key:consumer_secret \
	-H "Content-Type: application/json" \
	-d '{
    "payment_intent_id": "pi_ZZZZZZZZZZZZZZZZAAAAAAAA"
}'
```

> JSON response example:

```json
{
	"status": "succeeded",
	"id": "pi_ZZZZZZZZZZZZZZZZAAAAAAAA"
}
```

```json
{
	"code": "wcpay_server_error",
	"message": "Unexpected server error",
	"data": {
		"status": 500
	}
}
```

```json
{
  "code": "wcpay_capture_error_amount_too_small",
  "message": "{&quot;minimum_amount&quot;:50,&quot;minimum_amount_currency&quot;:&quot;USD&quot;}",
  "data": {
    "status": 400
  }
}
```

## Capture an authorization

_@since v5.1.0_

Capture the funds of an existing uncaptured payment intent that was marked to be captured manually later.

### POST params

-   payment_intent_id: string
-   order_id: string

### Error codes

-   `wcpay_missing_order` - Order not found
-   `wcpay_refunded_order_uncapturable` - Payment cannot be captured for partially or fully refunded orders
-   `wcpay_payment_uncapturable` - The payment cannot be captured if intent status is not one of 'processing', 'requires_capture', or 'succeeded'
-   `wcpay_intent_order_mismatch` - Payment cannot be captured because the order id does not match
-   `wcpay_capture_error` - Unknown error


### HTTP request

<div class="api-endpoint">
  <div class="endpoint-data">
    <i class="label label-get">POST</i>
    <h6>/wp-json/wc/v3/payments/orders/&lt;order_id&gt;/capture_authorization</h6>
  </div>
</div>

```shell
curl -X POST https://example.com/wp-json/wc/v3/payments/orders/42/capture_authorization \
  -u consumer_key:consumer_secret \
  -H "Content-Type: application/json" \
  -d '{
    "payment_intent_id": "pi_ZZZZZZZZZZZZZZZZAAAAAAAA"
}'
```

> JSON response example:

```json
{
	"status": "succeeded",
	"id": "pi_ZZZZZZZZZZZZZZZZAAAAAAAA"
}
```

```json
{
	"code": "wcpay_payment_uncapturable",
	"message": "The payment cannot be captured",
	"data": {
		"status": 409
	}
}
```
## Cancel an authorization

_@since v5.7.0_

Cancel the authorization of an existing uncaptured payment intent.

### POST params

-   payment_intent_id: string

### Error codes

-   `wcpay_missing_order` - Order not found
-   `wcpay_refunded_order_uncapturable` - Payment cannot be canceled
-   `wcpay_payment_uncapturable` - The payment cannot be canceled if intent status is not one of 'processing', 'requires_capture', or 'succeeded'
-   `wcpay_intent_order_mismatch` - Payment cannot be canceled because the order id does not match with payment intent id
-   `wcpay_cancel_error` - Unknown error

### HTTP request

<div class="api-endpoint">
  <div class="endpoint-data">
    <i class="label label-get">POST</i>
    <h6>/wp-json/wc/v3/payments/orders/&lt;order_id&gt;/cancel_authorization</h6>
  </div>
</div>

```shell
curl -X POST https://example.com/wp-json/wc/v3/payments/orders/42/cancel_authorization \
  -u consumer_key:consumer_secret \
  -H "Content-Type: application/json" \
  -d '{
    "payment_intent_id": "pi_ZZZZZZZZZZZZZZZZAAAAAAAA"
}'
```

> JSON response example:

```json
{
	"status": "canceled",
	"id": "pi_ZZZZZZZZZZZZZZZZAAAAAAAA"
}
```

```json
{
	"code": "wcpay_missing_order",
	"message": "Order not found",
	"data": {
		"status": 409
	}
}
```

## Create customer

_@since v2.8.0_

Returns customer id from order. Create or update customer if needed.

### Error codes

-   `wcpay_missing_order` - Order not found
-   `wcpay_invalid_order_status` - Invalid order status
-   `wcpay_server_error` - Unexpected server error

### HTTP request

<div class="api-endpoint">
	<div class="endpoint-data">
		<i class="label label-get">POST</i>
		<h6>/wp-json/wc/v3/payments/orders/&lt;order_id&gt;/create_customer</h6>
	</div>
</div>

```shell
curl -X POST https://example.com/wp-json/wc/v3/payments/orders/42/create_customer \
	-u consumer_key:consumer_secret
```

> JSON response example:

```json
{
	"id": "i_am_awesome"
}
```

```json
{
	"code": "wcpay_server_error",
	"message": "Unexpected server error",
	"data": {
		"status": 500
	}
}
```
