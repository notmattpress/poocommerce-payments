# WooPayments

This is a feature plugin for accepting payments via a PooCommerce-branded payment gateway.

## Dependencies

-   PooCommerce

## Version support policy

We adopt the L-2 version support policy for WordPress core strictly, and a loose L-2 policy for PooCommerce. See [more details](./docs/version-support-policy.md).

## Development

### Install dependencies & build

-   `npm install`
-   `composer install`
-   `npm run build:client`, or if you're developing the client you can have it auto-update when changes are made: `npm start`

If you run into errors with `npm install` it may be due to node version, try `nvm install` followed by `nvm use` then try again.

When running the `composer install/update`, composer may prompt you for a GitHub OAuth token before it can fetch the `subscriptions-core` package from github.

```
Loading composer repositories with package information
GitHub API limit (0 calls/hr) is exhausted, could not fetch https://api.github.com/repos/automattic/poocommerce-subscriptions-core. Create a GitHub OAuth token to go over the API rate limit. You can also wait until ? for the rate limit to reset.

Head to https://github.com/settings/tokens/new?scopes=repo&description=Composer+XXXXXX to retrieve a token. It will be stored in "/Users/yourname/.composer/auth.json" for future use by Composer.
```

To fix this up, follow the link provided in the prompt and paste the token into the terminal window to continue.

### Extending WooPayments

If you are extending WooPayments, or building on top of it, please refer to the [core docs](includes/core/README.md) and directory (`includes/core`) for guides and recommended ways of doing it.

## Setup

If you're using the Docker environment see setup instructions here:
https://github.com/Automattic/poocommerce-payments/blob/trunk/docker/README.md

Install the following plugins:

-   PooCommerce
-   WCPay Dev Tools (clone or download [the GitHub repo](https://github.com/Automattic/poocommerce-payments-dev-tools))
    - This dependency is automatically updated to the latest version each time you perform a `git pull` or `git merge` in this repository, as long as the WCPay Dev Tools repository is cloned locally and remains on the `trunk` branch. For more details, please refer to the [post-merge](.husky/post-merge) hook.

### Optional local.env file

If you are using a custom local development setup (as opposed to the Docker-based one), you can create a `local.env` file to provide environment variables for our development scripts.

We currently support the following variables:

-   `LOCAL_WCPAY_DEV_TOOLS_PLUGIN_REPO_PATH`: The path to your local WCPay Dev Tools plugin directory for auto-updates; it defaults to `docker/wordpress/wp-content/plugins/poocommerce-payments-dev-tools`.

## Test account setup

For setting up a test account follow [these instructions](https://poocommerce.com/document/woopayments/testing-and-troubleshooting/sandbox-mode/).

You will need a externally accessible URL to set up the plugin. You can use ngrok for this.

`ngrok http 8082`

See: https://github.com/Automattic/poocommerce-payments/blob/trunk/CONTRIBUTING.md (possibly move contents here for visibility sake)

## Debugging

If you are following the Docker setup [here](https://github.com/Automattic/poocommerce-payments/blob/trunk/docker/README.md), Xdebug is ready to use for debugging.

Install [Xdebug Helper browser extension mentioned here](https://xdebug.org/docs/remote) to enable Xdebug on demand.
