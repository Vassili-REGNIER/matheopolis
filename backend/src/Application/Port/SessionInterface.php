<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

interface SessionInterface
{
    public const FLASH_SUCCESS = 'success';

    public const FLASH_ERROR = 'error';

    public const FLASH_INFO = 'info';

    public function begin(): void;

    public function end(): void;

    public function regenerate(bool $deleteOldSession = true): void;

    public function get(string $key, mixed $default = null): mixed;

    public function set(string $key, mixed $value): void;

    public function has(string $key): bool;

    public function forget(string $key): void;

    public function ensureCsrfToken(): string;

    public function getCsrfToken(): string;

    public function verifyCsrfToken(?string $requestToken): bool;

    public function setFlash(string $type, string $message): void;

    /**
     * @return array<int, string>
     */
    public function getFlash(string $type): array;

    public function hasFlash(string $type): bool;
}
