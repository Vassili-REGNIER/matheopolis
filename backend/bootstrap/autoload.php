<?php

declare(strict_types=1);

if (!defined('PROJECT_ROOT')) {
    define('PROJECT_ROOT', dirname(__DIR__));
}

/**
 * Autoloader PSR-4 minimal : Matheopolis\<segments> → src/<segments>.php.
 *
 * Example: Matheopolis\Domain\User → src/Domain/User.php
 *          Matheopolis\Infrastructure\Bootstrap\Container → src/Infrastructure/Bootstrap/Container.php
 */
spl_autoload_register(static function (string $class): void {
    $prefix = 'Matheopolis\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relative = substr($class, strlen($prefix));
    $baseDir = dirname(__DIR__).'/src';
    $path = $baseDir.'/'.str_replace('\\', DIRECTORY_SEPARATOR, $relative).'.php';

    if (is_file($path)) {
        require $path;
    }
});
