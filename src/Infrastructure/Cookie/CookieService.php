<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Cookie;

use Matheopolis\Adapter\Http\Contract\HttpInterface;
use Matheopolis\Application\Port\CookieInterface;

final class CookieService implements CookieInterface
{
    public function __construct(
        private readonly HttpInterface $http,
    ) {}

    public function set(string $name, string $value, int $minutes = 60): void
    {
        $options = [
            'expires' => time() + ($minutes * 60),
            'path' => '/',
            'domain' => '',
            'secure' => $this->http->isHttps(),
            'httponly' => true,
            'samesite' => 'Lax',
        ];
        setcookie($name, $value, $options);
    }

    public function get(string $name, mixed $default = null): mixed
    {
        return $_COOKIE[$name] ?? $default;
    }

    public function has(string $name): bool
    {
        return isset($_COOKIE[$name]);
    }

    public function remove(string $name): void
    {
        if (!$this->has($name)) {
            return;
        }

        unset($_COOKIE[$name]);
        setcookie($name, '', [
            'expires' => time() - 3600,
            'path' => '/',
        ]);
    }
}
