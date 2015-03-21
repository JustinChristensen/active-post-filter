node_command 		= node
npm_command 		= npm
bower_command 		= bower
php_command 		= php
composer_command 	= composer

all: dist

php-exists:
	@echo "Checking for $(php_command)..."
	@which $(php_command) > /dev/null

composer-exists: php-exists
	@echo "Checking for $(composer_command)..."
	@which $(composer_command) > /dev/null

node-exists:
	@echo "Checking for $(node_command)..."
	@which $(node_command) > /dev/null

npm-exists: node-exists
	@echo "Checking for $(npm_command)..."
	@which $(npm_command) > /dev/null

bower-exists: node-exists
	@echo "Checking for $(bower_command)..."
	@which $(bower_command) > /dev/null

setup-environment: composer-exists npm-exists bower-exists
	composer install
	npm install
	bower install

test:
	npm test

watch:

clean:

maintainer-clean:

dist:

.PHONY: \
	all \
	test \
	node-exists \
	npm-exists \
	bower-exists \
	watch \
	clean \
	maintainer-clean \
	dist
