<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Database;

/**
 * Defines the contract for queryable.
 */
interface Queryable
{
    /**
     * @param array<string, mixed> $params
     */
    public function execute(string $query, array $params = []): Fetchable;

    /**
     * Last insert ID.
     */
    public function lastInsertId(): int;
}
