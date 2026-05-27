<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Database;

interface Queryable
{
    /**
     * @param array<string, mixed> $params
     */
    public function execute(string $query, array $params = []): Fetchable;

    public function lastInsertId(): int;
}
