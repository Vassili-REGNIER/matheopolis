<?php

declare(strict_types=1);

use Matheopolis\Infrastructure\Config\ConfigService;

require_once dirname(__DIR__).'/bootstrap/autoload.php';

$_ENV['APP_ENV'] = 'test';
$_SERVER['APP_ENV'] = 'test';
putenv('APP_ENV=test');

$envPath = dirname(__DIR__, 2).'/.env';
if (!is_readable($envPath)) {
    throw new RuntimeException("Missing environment file: {$envPath}. Copy .env.example to .env at the repository root.");
}

new ConfigService($envPath);
