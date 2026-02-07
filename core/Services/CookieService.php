<?php
declare(strict_types=1);

namespace Core\Services;

use Core\Interfaces\CookieInterface;
use Core\Interfaces\HttpInterface;

final class CookieService implements CookieInterface
{
    private HttpInterface $http;

    public function __construct(HttpInterface $http) {
        $this->http = $http;
    }

    /**
     * Sets a cookie in a secure way.
     * @param string $name Cookie name
     * @param string $value Cookie value
     * @param int $minutes Lifetime in minutes (default: 1 hour)
     */
    public function set(string $name, string $value, int $minutes = 60): void
    {
        // Secure default configuration
        $options = [
            'expires' => time() + ($minutes * 60),
            'path' => '/',
            'domain' => '', // Current domain
            'secure' => $this->http->isHttps(),
            'httponly' => true, // Prevents JavaScript from reading the cookie (XSS protection)
            'samesite' => 'Lax' // Modern CSRF protection
        ];

        setcookie($name, $value, $options);
    }

    /**
     * Retrieves a cookie.
     */
    public function get(string $name, $default = null): mixed
    {
        return $_COOKIE[$name] ?? $default;
    }

    /**
     * Checks whether a cookie exists.
     */
    public function has(string $name): bool
    {
        return isset($_COOKIE[$name]);
    }

    /**
     * Deletes a cookie (by expiring it in the past).
     */
    public function remove(string $name): void
    {
        if (self::has($name)) {
            unset($_COOKIE[$name]);
            // Overwrite the cookie with a past expiration date to force the browser to delete it
            setcookie($name, '', [
                'expires' => time() - 3600,
                'path' => '/'
            ]);
        }
    }
}