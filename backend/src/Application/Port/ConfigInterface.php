<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

/**
 * Defines the contract for the config dependency.
 */
interface ConfigInterface
{
    /**
     * Returns the .
     */
    public function get(string $key, mixed $default = null): mixed;

    /**
     * Returns the string.
     */
    public function getString(string $key, string $default = ''): string;

    /**
     * Returns the bool.
     */
    public function getBool(string $key, bool $default = false): bool;

    /**
     * Returns the int.
     */
    public function getInt(string $key, int $default = 0): int;
}
