<?php
namespace Core\Interfaces;

interface SessionInterface {
    const FLASH_SUCCESS = 'success';
    const FLASH_ERROR = 'error';
    const FLASH_INFO = 'info';
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
    public function getFlash(string $type): array;
    public function hasFlash(string $type): bool;
}