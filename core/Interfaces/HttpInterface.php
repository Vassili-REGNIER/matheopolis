<?php
namespace Core\Interfaces;

interface HttpInterface {
    public function generateLink(string $path): string;
    public function redirect(string $path): never;
    public function post(string $key, mixed $default = null): mixed;
    public function get(string $key, mixed $default = null): mixed;
    public function isMethodAllowed(string $allowedMethods): bool;
    public function isHttps(): bool;
    public function getRequestedPath(): string;
    public function jsonResponse(array $data, int $status = 200): never;
}