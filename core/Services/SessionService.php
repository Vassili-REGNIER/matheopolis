<?php
declare(strict_types=1);

namespace Core\Services;

use Core\Interfaces\ConfigInterface;
use Core\Interfaces\HttpInterface;
use Core\Interfaces\SessionInterface;

/**
 * Session helper.
 * Provides secure session bootstrap, basic session accessors, and CSRF token utilities.
 */
final class SessionService implements SessionInterface
{
    /**
     * Default session cookie parameters.
     * NOTE: The "secure" flag is enabled automatically when HTTPS is detected.
     */
    private array $cookieParams = [
        'lifetime' => 0,
        'path' => '/',
        'Domain' => '',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Strict'
    ];

    private ConfigInterface $config;
    private HttpInterface $http;

    public function __construct(
        ConfigInterface $config,
        HttpInterface $http,
    ) {
        $this->config = $config;
        $this->http = $http;
    }

    /**
     * Starts the session with hardened settings.
     */
    public function begin(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        // Enable secure cookies automatically when served over HTTPS
        $this->cookieParams['secure'] = $this->http->isHttps();

        // Prevent the session module from accepting uninitialized session IDs (session fixation mitigation)
        ini_set('session.use_strict_mode', '1');

        // Apply cookie params before starting the session
        session_set_cookie_params($this->cookieParams);

        session_start();

        // Ensure a CSRF token exists as early as possible
        $this->ensureCsrfToken();
    }

    /**
     * Regenerates the session ID (recommended after authentication or privilege changes).
     * Also rotates the CSRF token as a best practice when identity changes.
     */
    public function regenerate(bool $deleteOldSession = true): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            return;
        }

        session_regenerate_id($deleteOldSession);

        // Rotate CSRF token on identity change
        $this->set($this->csrfKey(), bin2hex(random_bytes(32)));
    }

    /**
     * Clears session data, destroys the session, and deletes the session cookie.
     */
    public function end(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            return;
        }

        // Clear session data
        $_SESSION = [];

        // Delete the session cookie on the client
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                (bool)$params['secure'],
                (bool)$params['httponly']
            );
        }

        // Destroy server-side session
        session_destroy();
    }

    /**
     * Sets a session value.
     */
    public function set(string $key, mixed $value): void
    {
        $_SESSION[$key] = $value;
    }

    /**
     * Gets a session value.
     *
     * @return mixed Returns the stored value or $default if missing.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        return $_SESSION[$key] ?? $default;
    }

    /**
     * Checks whether a session key exists (even if its value is null).
     */
    public function has(string $key): bool
    {
        return array_key_exists($key, $_SESSION);
    }

    /**
     * Removes a session key.
     */
    public function forget(string $key): void
    {
        unset($_SESSION[$key]);
    }

    /**
     * Ensures a CSRF token exists (lazy generation) and returns it.
     */
    public function ensureCsrfToken(): string
    {
        $key = $this->csrfKey();
        $token = $this->get($key);

        if (!is_string($token) || $token === '') {
            $token = bin2hex(random_bytes(32));
            $this->set($key, $token);
        }

        return $token;
    }

    /**
     * Returns the current CSRF token (always guaranteed to be a non-empty string).
     */
    public function getCsrfToken(): string
    {
        return $this->ensureCsrfToken();
    }

    /**
     * Verifies that the provided CSRF token matches the stored session token.
     */
    public function verifyCsrfToken(?string $requestToken): bool
    {
        if ($requestToken === null || $requestToken === '') {
            return false;
        }

        $storedToken = $this->getCsrfToken();
        return hash_equals($storedToken, $requestToken);
    }

    /**
     * Resolves the CSRF session key from configuration.
     */
    private function csrfKey(): string
    {
        return $this->config->getString('USER_CSRF_KEY');
    }

    /**
     * Set a flash message
     * @param string $type
     * @param string $message
     */
    public function setFlash(string $type, string $message): void
    {
        $key = $this->config->getString('USER_FLASH_KEY');

        $flash = $this->get($key);
        if (!is_array($flash)) {
            $flash = [];
        }

        $flash[$type][] = $message;

        $this->set($key, $flash);
    }

    /**
     * Retrieves messages of a specific type and removes them from the session.
     * * @param string $type The type of message to retrieve
     * @return array Always returns an array (empty or filled)
     */
    public function getFlash(string $type): array {
        $key = $this->config->getString('USER_FLASH_KEY');
        $flash = $this->get($key);

        if (!is_array($flash) || !isset($flash[$type])) {
            return [];
        }

        $messages = $flash[$type];
        unset($flash[$type]);
        $this->set($key, $flash);

        return $messages;
    }

    /**
     * Check if there are any messages of a certain type
     */
    public function hasFlash(string $type): bool {
        $key = $this->config->getString('USER_FLASH_KEY');
        $flash = $this->get($key);
        return isset($flash[$type]) && count($flash[$type]) > 0;
    }
}