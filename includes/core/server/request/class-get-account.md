# `Get_Account` request class

[ℹ️ This document is a part of __PooCommerce Payments Server Requests__](../README.md).

## Description

The `WCPay\Core\Server\Request\Get_Account` class is used to construct the request for retrieving account data.
Note that this request sends the test_mode flag only when the site is in sandbox mode.

## Parameters

None.

## Filter

When using this request, provide the following filter:

- Name: `wcpay_get_account`.

## Example:

```php
$request = Get_Account::create();
$request->send();
```
