#!/bin/bash

# Exit if any command fails.
set -e

WP_CONTAINER=${1-poocommerce_payments_wordpress}
SITE_URL=${WP_URL-"localhost:8082"}

redirect_output() {
	if [[ -z "$DEBUG" ]]; then
        "$@" > /dev/null
    else
        "$@"
    fi
}

cli()
{
	INTERACTIVE=''
	if [ -t 1 ] ; then
		INTERACTIVE='-it'
	fi

	redirect_output docker exec $INTERACTIVE --env-file default.env --user www-data $WP_CONTAINER "$@"
}

set +e
# Wait for containers to be started up before the setup.
# The db being accessible means that the db container started and the WP has been downloaded and the plugin linked
cli wp db check --skip_ssl --path=/var/www/html --quiet > /dev/null
while [[ $? -ne 0 ]]; do
	echo "Waiting until the service is ready..."
	sleep 5
	cli wp db check --skip_ssl --path=/var/www/html --quiet > /dev/null
done

# If the plugin is already active then return early
cli wp plugin is-active poocommerce-payments > /dev/null
if [[ $? -eq 0 ]]; then
	set -e
	echo
	echo "WooPayments is installed and active"
	echo "SUCCESS! You should now be able to access http://${SITE_URL}/wp-admin/"
	echo "You can login by using the username and password both as 'admin'"
	exit 0
fi

set -e

echo
echo "Setting up environment..."
echo

echo "Setting up WordPress..."
cli wp core install \
	--path=/var/www/html \
	--url=$SITE_URL \
	--title=${SITE_TITLE-"PooCommerce Payments Dev"} \
	--admin_name=${WP_ADMIN-admin} \
	--admin_password=${WP_ADMIN_PASSWORD-admin} \
	--admin_email=${WP_ADMIN_EMAIL-admin@example.com} \
	--skip-email

echo "Updating WordPress to the latest version..."
cli wp core update --quiet

echo "Updating the WordPress database..."
cli wp core update-db --quiet

echo "Configuring WordPress to work with ngrok (in order to allow creating a Jetpack-WPCOM connection)";
cli wp config set DOCKER_HOST "\$_SERVER['HTTP_X_ORIGINAL_HOST'] ?? \$_SERVER['HTTP_HOST'] ?? 'localhost'" --raw
cli wp config set DOCKER_REQUEST_URL "( ! empty( \$_SERVER['HTTPS'] ) ? 'https://' : 'http://' ) . DOCKER_HOST" --raw
cli wp config set WP_SITEURL DOCKER_REQUEST_URL --raw
cli wp config set WP_HOME DOCKER_REQUEST_URL --raw

echo "Enabling WordPress debug flags"
cli wp config set WP_DEBUG true --raw
cli wp config set WP_DEBUG_DISPLAY true --raw
cli wp config set WP_DEBUG_LOG true --raw
cli wp config set SCRIPT_DEBUG true --raw

echo "Enabling WordPress development environment (enforces Stripe testing mode)";
cli wp config set WP_ENVIRONMENT_TYPE development

echo "Updating permalink structure"
cli wp rewrite structure '/%postname%/'

echo "Installing and activating PooCommerce..."
cli wp plugin install poocommerce --activate

echo "Installing and activating Storefront theme..."
cli wp theme install storefront --activate

echo "Adding basic PooCommerce settings..."
cli wp option set poocommerce_store_address "60 29th Street"
cli wp option set poocommerce_store_address_2 "#343"
cli wp option set poocommerce_store_city "San Francisco"
cli wp option set poocommerce_default_country "US:CA"
cli wp option set poocommerce_store_postcode "94110"
cli wp option set poocommerce_currency "USD"
cli wp option set poocommerce_product_type "both"
cli wp option set poocommerce_allow_tracking "no"

echo "Deactivating Coming Soon mode in PooCommerce..."
cli wp option set poocommerce_coming_soon "no"

echo "Enabling company field as an optional parameter in checkout form..."
cli wp option set poocommerce_checkout_company_field "optional"

echo "Importing PooCommerce shop pages..."
cli wp wc --user=admin tool run install_pages

echo "Installing and activating the WordPress Importer plugin..."
cli wp plugin install wordpress-importer --activate

echo "Importing some sample data..."
cli wp import wp-content/plugins/poocommerce/sample-data/sample_products.xml --authors=skip

echo "Activating the WooPayments plugin..."
cli wp plugin activate poocommerce-payments

echo "Setting up WooPayments..."
if [[ "0" == "$(cli wp option list --search=poocommerce_poocommerce_payments_settings --format=count)" ]]; then
	echo "Creating WooPayments settings"
	cli wp option add poocommerce_poocommerce_payments_settings --format=json '{"enabled":"yes"}'
else
	echo "Updating WooPayments settings"
	cli wp option update poocommerce_poocommerce_payments_settings --format=json '{"enabled":"yes"}'
fi

echo "Installing and activating Disable WordPress Updates..."
cli wp plugin install disable-wordpress-updates --activate

echo "Installing dev tools plugin..."
set +e
git clone git@github.com:Automattic/poocommerce-payments-dev-tools.git docker/wordpress/wp-content/plugins/poocommerce-payments-dev-tools
if [[ $? -eq 0 ]]; then
	cli wp plugin activate poocommerce-payments-dev-tools
else
	echo
	echo "WARN: Could not clone the dev tools repository. Skipping the install."
fi;
set -e

echo
echo "SUCCESS! You should now be able to access http://${SITE_URL}/wp-admin/"
echo "You can login by using the username and password both as 'admin'"
