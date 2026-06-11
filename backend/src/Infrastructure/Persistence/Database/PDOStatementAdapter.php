<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Database;

/**
 * Represents the PDO statement adapter component.
 */
final class PDOStatementAdapter implements Fetchable
{
    /**
     * Creates a new PDOStatementAdapter instance.
     */
    public function __construct(
        private readonly \PDOStatement $statement,
    ) {}

    /**
     * Fetch.
     */
    public function fetch(): ?array
    {
        $result = $this->statement->fetch(\PDO::FETCH_ASSOC);
        if (false === $result) {
            return null;
        }

        /** @var array<string, mixed> $result */
        return $result;
    }

    /**
     * Fetch all.
     */
    public function fetchAll(): array
    {
        $rows = $this->statement->fetchAll(\PDO::FETCH_ASSOC);
        /** @var array<int, array<string, mixed>> $rows */

        return $rows;
    }
}
