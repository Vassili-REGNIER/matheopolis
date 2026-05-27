<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Config;

use Matheopolis\Application\Port\ConfigInterface;

final class ConfigService implements ConfigInterface
{
    /** @var array<string, mixed> */
    private array $settings = [];

    public function __construct(string $envPath)
    {
        $this->loadEnv($envPath);
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->settings[$key] ?? $_ENV[$key] ?? $default;
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

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (false === $lines) {
            return;
        }

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

            if (!\array_key_exists($key, $_SERVER) && !\array_key_exists($key, $_ENV)) {
                putenv("{$key}={$value}");
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }
    }
}
