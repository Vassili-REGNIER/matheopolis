<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

interface ConfigInterface
{
    public function get(string $key, mixed $default = null): mixed;

    public function getString(string $key, string $default = ''): string;

    public function getBool(string $key, bool $default = false): bool;

    public function getInt(string $key, int $default = 0): int;
}
