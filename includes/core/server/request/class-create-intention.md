# `Create_Intention` request class

[ℹ️ This document is a part of __PooCommerce Payments Server Requests__](../README.md)

## Description

The `WCPay\Core\Server\Request\Create_Intention` class is used to construct the request for creating an intention.

## Parameters


| Parameter              | Setter                                               | Immutable | Required | Default value |
|------------------------|------------------------------------------------------|:---------:|:--------:|:-------------:|
| `amount`               | `set_amount( int $amount )`                          |    Yes    |   Yes    |       -       |
| `capture_method`       | `set_capture_method( bool $manual_capture = false )` |     -     |    -     |       -       |
| `currency`             | `set_currency_code( string $currency_code )`         |     -     |   Yes    |       -       |
| `customer`             | `set_customer( string $customer_id )`                |     -     |    -     |       -       |
| `metadata`             | `set_fingerprint( string $fingerprint = '' )`        |     -     |    -     |       -       |
| `mandate`              | `set_mandate( string $mandate )`                     |     -     |    -     |       -       |
| `mandate_data`         | `set_mandate_data( array $mandate_data )`            |     -     |    -     |       -       |
| `description`          | `set_metadata( array $metadata )`                    |     -     |    -     |       -       |
| `payment_method`       | `set_payment_method( string $payment_method_id )`    |     -     |    -     |       -       |
| `payment_method_types` | `set_payment_method_types( array $payment_methods )` |     -     |    -     |       -       |


## Filter

- Name: `wcpay_create_intent_request`
- Arguments: `WC_Order $order`

## Example:

```php
$request = Create_Intention::create();
$request->set_amount( $amount );
$request->set_capture_method( $manual_capture );
$request->set_currency_code( $currency_code );
$request->set_customer( $customer_id );
$request->set_fingerprint( $fingerprint );
$request->set_mandate( $mandate );
$request->set_mandate_data( $mandate_data );
$request->set_metadata( $metadata );
$request->set_payment_method( $payment_method_id );
$request->set_payment_method_types( $payment_methods );
$request->send();
```
