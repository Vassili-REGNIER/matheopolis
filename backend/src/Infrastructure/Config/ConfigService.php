<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Config;

use Matheopolis\Application\Port\ConfigInterface;

final class ConfigService implements ConfigInterface
{
    /** @var list<string> */
    private const MAPPED_KEYS = [
        'APP_ENV',
        'APP_DEBUG',
        'APP_MAINTENANCE',
        'APP_URL',
        'APP_PATH',
        'APP_FRONTEND_ORIGIN',
        'DB_HOST',
        'DB_PORT',
        'DB_NAME',
        'DB_USER',
        'DB_PASS',
        'USER_COOKIE',
        'USER_FLASH_KEY',
        'USER_CSRF_KEY',
        'SESSION_IDLE_TIMEOUT',
        'SESSION_COOKIE_SAMESITE',
        'TEST_API_BASE_URL',
    ];

    /** @var array<string, mixed> */
    private array $settings = [];

    public function __construct(string $envPath)
    {
        $this->loadEnv($envPath);
    }

    public function get(string $key, mixed $default = null): mixed
    {
        if (\array_key_exists($key, $this->settings)) {
            return $this->settings[$key];
        }

        if (\array_key_exists($key, $_ENV)) {
            return $_ENV[$key];
        }

        if (\array_key_exists($key, $_SERVER)) {
            return $_SERVER[$key];
        }

        $envValue = getenv($key);
        if (false !== $envValue) {
            return $envValue;
        }

        return $default;
    }

    public function getString(string $key, string $default = ''): string
    {
        $val = $this->get($key, $default);
        if (\is_string($val)) {
            return $val;
        }
        if (\is_scalar($val)) {
            return (string) $val;
        }

        return $default;
    }

    public function getInt(string $key, int $default = 0): int
    {
        $val = $this->get($key, $default);
        if (\is_int($val)) {
            return $val;
        }
        if (\is_string($val) && is_numeric($val)) {
            return (int) $val;
        }
        if (\is_float($val)) {
            return (int) $val;
        }

        return $default;
    }

    public function getBool(string $key, bool $default = false): bool
    {
        $val = $this->get($key, $default);
        if (\is_bool($val)) {
            return $val;
        }
        $filtered = filter_var($val, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        return $filtered ?? $default;
    }

    /**
     * Loads environment variables from the .env file when available.
     * Supports prefixed keys (DEV_*, PROD_*, TEST_*) from the repository root .env,
     * and flat keys from backend/.env (AlwaysData server deploy).
     *
     * @throws \RuntimeException if the file exists but is not readable
     */
    private function loadEnv(string $path): void
    {
        if (!file_exists($path)) {
            return;
        }

        if (!is_readable($path)) {
            throw new \RuntimeException("Environment file exists but is unreadable: {$path}");
        }

        $raw = $this->parseEnvFile($path);
        $prefix = $this->resolvePrefix($raw);

        foreach (self::MAPPED_KEYS as $key) {
            $value = $this->resolveValue($raw, $prefix, $key);
            if (null === $value) {
                continue;
            }

            $this->settings[$key] = $value;
            $this->applyToEnvironment($key, $value);
        }
    }

    /**
     * @return array<string, string>
     */
    private function parseEnvFile(string $path): array
    {
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (false === $lines) {
            return [];
        }

        $raw = [];
        foreach ($lines as $line) {
            $line = trim($line);

            if ('' === $line || str_starts_with($line, '#')) {
                continue;
            }

            if (str_contains($line, '#')) {
                $line = strstr($line, '#', true);
                $line = trim((string) $line);
            }

            $parts = explode('=', $line, 2);
            if (2 !== \count($parts)) {
                continue;
            }

            [$key, $value] = $parts;
            $key = trim($key);
            $value = trim($value);
            $value = trim($value, "\"'");

            if ('' !== $key) {
                $raw[$key] = $value;
            }
        }

        return $raw;
    }

    /**
     * @param array<string, string> $raw
     */
    private function resolvePrefix(array $raw): string
    {
        $mode = $this->resolveMode($raw);

        return match ($mode) {
            'prod', 'production' => 'PROD_',
            'test' => 'TEST_',
            default => 'DEV_',
        };
    }

    /**
     * @param array<string, string> $raw
     */
    private function resolveMode(array $raw): string
    {
        $runtimeMode = $_ENV['APP_ENV'] ?? getenv('APP_ENV');
        if (\is_string($runtimeMode) && '' !== $runtimeMode) {
            return $runtimeMode;
        }

        foreach (['APP_ENV', 'TEST_APP_ENV', 'DEV_APP_ENV', 'PROD_APP_ENV'] as $key) {
            if (isset($raw[$key]) && '' !== $raw[$key]) {
                return $raw[$key];
            }
        }

        return 'dev';
    }

    /**
     * @param array<string, string> $raw
     */
    private function resolveValue(array $raw, string $prefix, string $key): ?string
    {
        $prefixedKey = $prefix.$key;

        if (isset($raw[$prefixedKey]) && '' !== $raw[$prefixedKey]) {
            return $raw[$prefixedKey];
        }

        if (isset($raw[$key]) && '' !== $raw[$key]) {
            return $raw[$key];
        }

        return null;
    }

    private function applyToEnvironment(string $key, string $value): void
    {
        if (!\array_key_exists($key, $_SERVER) && !\array_key_exists($key, $_ENV)) {
            putenv("{$key}={$value}");
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }
}
