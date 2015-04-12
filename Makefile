SHELL = bash

WP_DEV_DIR = src/vendor/wordpress-develop
WP_DEV_TEST_CONFIG = $(WP_DEV_DIR)/wp-tests-config.php
WP_TEST_CONFIG = test/phpunit/wp-tests-config.php

COMPOSER_DIR = src/vendor
NPM_DIR = node_modules
BOWER_DIR = src/assets/bower_components

all: dist

$(COMPOSER_DIR):
	composer install

$(NPM_DIR):
	npm install

$(BOWER_DIR):
	bower install

install-dependencies: $(COMPOSER_DIR) $(NPM_DIR) $(BOWER_DIR)

setup: install-dependencies

$(WP_DEV_TEST_CONFIG): $(WP_TEST_CONFIG) $(COMPOSER_DIR)
	cp $< $@

mocha:
	npm test

phpunit: $(WP_DEV_TEST_CONFIG)
	composer test

test: phpunit mocha

clean-composer:
	-rm -rf src/vendor

clean-npm:
	-rm -rf node_modules

clean-bower:
	-rm -rf src/assets/bower_components

clean:
	-rm -rf tmp

maintainer-clean: clean clean-composer clean-npm clean-bower

dist:

.PHONY: 				 	\
	all 				 	\
	mocha 				 	\
	phpunit 			 	\
	test 				 	\
	clean-composer 		 	\
	clean-npm 			 	\
	clean-bower 		 	\
	clean 				 	\
	maintainer-clean 	 	\
	install-dependencies 	\
	setup 					\
	dist
