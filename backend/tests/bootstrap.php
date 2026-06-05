<?php

declare(strict_types=1);

require_once dirname(__DIR__).'/bootstrap/autoload.php';

$_ENV['APP_ENV'] = 'test';
$_SERVER['APP_ENV'] = 'test';
putenv('APP_ENV=test');

$envTestPath = dirname(__DIR__).'/.env.test';
if (is_readable($envTestPath)) {
    $lines = file($envTestPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (false !== $lines) {
        foreach ($lines as $line) {
            $line = trim($line);
            if ('' === $line || str_starts_with($line, '#')) {
                continue;
            }
            $parts = explode('=', $line, 2);
            if (2 !== count($parts)) {
                continue;
            }
            $key = trim($parts[0]);
            if (false !== getenv($key)) {
                continue;
            }
            $value = trim($parts[1]);
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
            putenv($key.'='.$value);
        }
    }
}
