<?php

define('WP_DEV_DIR', 'src/vendor/wordpress-develop');
define('WP_DEV_PHPUNIT_CONFIG',  WP_DEV_DIR . '/phpunit.xml.dist');

$wpdev_phpunit_config = simplexml_load_file(WP_DEV_PHPUNIT_CONFIG);

if ($wpdev_phpunit_config) {
    $wpdev_phpunit_bootstrap = (string) $wpdev_phpunit_config['bootstrap'];
    require_once WP_DEV_DIR . '/' . $wpdev_phpunit_bootstrap;
}
else {
    error_log('[Active Post Filter] Could not parse ' . WP_DEV_PHPUNIT_CONFIG .
        ' check the warning output and verify that the input file contains well-formed XML');
}

?>
