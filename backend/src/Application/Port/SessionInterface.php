<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

/**
 * Defines the contract for the session dependency.
 */
interface SessionInterface
{
    public const FLASH_SUCCESS = 'success';

    public const FLASH_ERROR = 'error';

    public const FLASH_INFO = 'info';

    /**
     * Begin.
     */
    public function begin(): void;

    /**
     * End.
     */
    public function end(): void;

    /**
     * Regenerate.
     */
    public function regenerate(bool $deleteOldSession = true): void;

    /**
     * Returns the .
     */
    public function get(string $key, mixed $default = null): mixed;

    /**
     * Updates the .
     */
    public function set(string $key, mixed $value): void;

    /**
     * Has.
     */
    public function has(string $key): bool;

    /**
     * Forget.
     */
    public function forget(string $key): void;

    /**
     * Ensures that the current request satisfies the required condition.
     */
    public function ensureCsrfToken(): string;

    /**
     * Returns the CSRF token.
     */
    public function getCsrfToken(): string;

    /**
     * Verifies the requested value.
     */
    public function verifyCsrfToken(?string $requestToken): bool;

    /**
     * Updates the flash.
     */
    public function setFlash(string $type, string $message): void;

    /**
     * @return array<int, string>
     */
    public function getFlash(string $type): array;

    /**
     * Checks whether the flash exists.
     */
    public function hasFlash(string $type): bool;
}
