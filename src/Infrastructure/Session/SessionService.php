<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Session;

use Matheopolis\Adapter\Http\Contract\HttpInterface;
use Matheopolis\Application\Port\ConfigInterface;
use Matheopolis\Application\Port\SessionInterface;

/**
 * Session bootstrap, CSRF, flash messages.
 */
final class SessionService implements SessionInterface
{
    /**
     * @var array{lifetime: int, path: string, domain: string, secure: bool, httponly: bool, samesite: 'Strict'}
     */
    private array $cookieParams = [
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Strict',
    ];

    public function __construct(
        private readonly ConfigInterface $config,
        private readonly HttpInterface $http,
    ) {}

    public function begin(): void
    {
        if (PHP_SESSION_ACTIVE === session_status()) {
            return;
        }

        $this->cookieParams['secure'] = $this->http->isHttps();
        ini_set('session.use_strict_mode', '1');
        session_set_cookie_params($this->cookieParams);
        session_start();
        $this->ensureCsrfToken();
    }

    public function regenerate(bool $deleteOldSession = true): void
    {
        if (PHP_SESSION_ACTIVE !== session_status()) {
            return;
        }

        session_regenerate_id($deleteOldSession);
        $this->set($this->csrfKey(), bin2hex(random_bytes(32)));
    }

    public function end(): void
    {
        if (PHP_SESSION_ACTIVE !== session_status()) {
            return;
        }

        $_SESSION = [];

        if ('1' === \ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            $sessionName = session_name();
            if (!\is_string($sessionName)) {
                session_destroy();

                return;
            }
            setcookie(
                $sessionName,
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly'],
            );
        }

        session_destroy();
    }

    public function set(string $key, mixed $value): void
    {
        $_SESSION[$key] = $value;
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $_SESSION[$key] ?? $default;
    }

    public function has(string $key): bool
    {
        return \array_key_exists($key, $_SESSION);
    }

    public function forget(string $key): void
    {
        unset($_SESSION[$key]);
    }

    public function ensureCsrfToken(): string
    {
        $key = $this->csrfKey();
        $token = $this->get($key);
        if (!\is_string($token) || '' === $token) {
            $token = bin2hex(random_bytes(32));
            $this->set($key, $token);
        }

        return $token;
    }

    public function getCsrfToken(): string
    {
        return $this->ensureCsrfToken();
    }

    public function verifyCsrfToken(?string $requestToken): bool
    {
        if (null === $requestToken || '' === $requestToken) {
            return false;
        }

        $storedToken = $this->getCsrfToken();

        return hash_equals($storedToken, $requestToken);
    }

    public function setFlash(string $type, string $message): void
    {
        $key = $this->config->getString('USER_FLASH_KEY');
        $flash = $this->get($key);
        if (!\is_array($flash)) {
            $flash = [];
        }
        if (!isset($flash[$type])) {
            $flash[$type] = [];
        }
        if (!\is_array($flash[$type])) {
            $flash[$type] = [];
        }
        $flash[$type][] = $message;
        $this->set($key, $flash);
    }

    public function getFlash(string $type): array
    {
        $key = $this->config->getString('USER_FLASH_KEY');
        $flash = $this->get($key);
        if (!\is_array($flash)) {
            return [];
        }
        if (!isset($flash[$type])) {
            return [];
        }
        $messages = $flash[$type];
        unset($flash[$type]);
        $this->set($key, $flash);
        if (!\is_array($messages)) {
            return [];
        }
        $out = [];
        foreach ($messages as $m) {
            if (\is_string($m)) {
                $out[] = $m;
            }
        }

        return $out;
    }

    public function hasFlash(string $type): bool
    {
        $key = $this->config->getString('USER_FLASH_KEY');
        $flash = $this->get($key);
        if (!\is_array($flash) || !isset($flash[$type])) {
            return false;
        }

        $bucket = $flash[$type];

        return \is_array($bucket) && \count($bucket) > 0;
    }

    private function csrfKey(): string
    {
        return $this->config->getString('USER_CSRF_KEY');
    }
}
