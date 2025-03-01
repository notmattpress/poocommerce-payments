# `Add_Account_Tos_Agreement` request class

[ℹ️ This document is a part of __PooCommerce Payments Server Requests__](../README.md)

## Description

The `WCPay\Core\Server\Request\Add_Account_Tos_Agreement` class is used to construct the request for recording a new Terms of Service agreement.

## Parameters

| Parameter     | Setter                                   | Immutable | Required | Default value |
|---------------|------------------------------------------|:---------:|:--------:|:-------------:|
| `source`      | `set_source( string $source )`           |     -     |   Yes    |       -       |
| `user_name`   | `user_name( string $user_name )`         |     -     |   Yes    |       -       |

## Filter

- Name: `wcpay_add_account_tos_agreement`
- Arguments: None.

## Example:

```php
$request = Add_Account_Tos_Agreement::create();
$request->set_source( 'settings-popup' );
$request->set_user_name( 'current_username' );
$request->send();
```
