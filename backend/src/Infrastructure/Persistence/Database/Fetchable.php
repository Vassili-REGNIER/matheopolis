<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Database;

interface Fetchable
{
    /**
     * @return null|array<string, mixed>
     */
    public function fetch(): ?array;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function fetchAll(): array;
}
