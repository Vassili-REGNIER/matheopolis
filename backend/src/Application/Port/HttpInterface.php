<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

/**
 * Defines the contract for the http dependency.
 */
interface HttpInterface
{
    /**
     * Generate link.
     */
    public function generateLink(string $path): string;

    /**
     * Redirect.
     */
    public function redirect(string $path): never;

    /**
     * Post.
     */
    public function post(string $key, mixed $default = null): mixed;

    /**
     * Returns the .
     */
    public function get(string $key, mixed $default = null): mixed;

    /**
     * Checks whether the method allowed condition is met.
     */
    public function isMethodAllowed(string $allowedMethods): bool;

    /**
     * Checks whether the https condition is met.
     */
    public function isHttps(): bool;

    /**
     * Returns the requested path.
     */
    public function getRequestedPath(): string;

    /**
     * @param array<string, mixed> $data
     */
    public function jsonResponse(array $data, int $status = 200): never;

    /**
     * File response.
     */
    public function fileResponse(string $content, string $contentType, string $filename, int $status = 200): never;
}
