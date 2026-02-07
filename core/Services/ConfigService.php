<?php
declare(strict_types=1);

namespace Core\Services;

use Core\Interfaces\ConfigInterface;
use RuntimeException;

final class ConfigService implements ConfigInterface
{
    private array $settings = [];

    public function __construct(string $envPath) {
        $this->loadEnv($envPath);
    }

    /**
     * Loads environment variables from the .env file.
     *
     * @param string $path Absolute path to the .env file.
     * @throws RuntimeException If the file exists but is not readable.
     */
    private function loadEnv(string $path): void
    {
        if (!is_readable($path)) {
            throw new RuntimeException("Environment file not found or unreadable: $path");
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);

            // Skip comments
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            // Handle inline comments
            if (str_contains($line, '#')) {
                $line = strstr($line, '#', true);
                $line = trim($line);
            }

            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            $value = trim($value, "\"'");

            // Populate PHP environment
            if (!array_key_exists($key, $_SERVER) && !array_key_exists($key, $_ENV)) {
                putenv("$key=$value");
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }
    }

    /**
     * Retrieves an environment variable.
     */
    public function get(string $key, mixed $default = null): mixed {
        // Priority : loaded variable > $_ENV > default
        return $this->settings[$key] ?? $_ENV[$key] ?? $default;
    }

    /**
     * Retrieves a string environment variable.
     */
    public function getString(string $key, string $default = ''): string {
        $val = $this->get($key, $default);
        return (string)$val;
    }

    /**
     * Retrieves an integer environment variable.
     */
    public function getInt(string $key, int $default = 0): int {
        return (int)$this->get($key, $default);
    }

    /**
     * Retrieves a boolean environment variable.
     */
    public function getBool(string $key, bool $default = false): bool {
        $val = $this->get($key, $default);
        return filter_var($val, FILTER_VALIDATE_BOOLEAN);
    }
}