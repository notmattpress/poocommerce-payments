FROM wordpress:php8.1
RUN pecl install xdebug \
	&& echo 'xdebug.remote_enable=1' >> $PHP_INI_DIR/php.ini \
	&& echo 'xdebug.remote_port=9000' >> $PHP_INI_DIR/php.ini \
	&& echo 'xdebug.remote_host=host.docker.internal' >> $PHP_INI_DIR/php.ini \
	&& echo 'xdebug.remote_autostart=0' >> $PHP_INI_DIR/php.ini \
	&& docker-php-ext-enable xdebug > /dev/null
RUN apt-get update \
	&& apt-get install --assume-yes --quiet --no-install-recommends gnupg2 subversion mariadb-client less jq
RUN apt-get install -y openssh-client
RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
	&& chmod +x wp-cli.phar \
	&& mv wp-cli.phar /usr/local/bin/wp
