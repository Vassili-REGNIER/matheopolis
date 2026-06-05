<?php

declare(strict_types=1);

use Matheopolis\Infrastructure\Config\ConfigService;

require_once dirname(__DIR__).'/bootstrap/autoload.php';

$_ENV['APP_ENV'] = 'test';
$_SERVER['APP_ENV'] = 'test';
putenv('APP_ENV=test');

$rootEnv = dirname(__DIR__, 2).'/.env';
$backendEnv = dirname(__DIR__).'/.env';
$envPath = is_readable($rootEnv) ? $rootEnv : $backendEnv;

new ConfigService($envPath);
