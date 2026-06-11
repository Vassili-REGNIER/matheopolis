<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Database;

/**
 * Represents the PDO adapter component.
 */
final class PDOAdapter implements Queryable
{
    private \PDO $pdo;

    /**
     * Creates a new PDOAdapter instance.
     */
    public function __construct(string $dsn, string $user, string $password)
    {
        $this->pdo = new \PDO($dsn, $user, $password, [
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
        ]);
    }

    /**
     * @param array<string, mixed> $params
     */
    public function execute(string $query, array $params = []): Fetchable
    {
        $statement = $this->pdo->prepare($query);
        $statement->execute($params);

        return new PDOStatementAdapter($statement);
    }

    /**
     * Last insert ID.
     */
    public function lastInsertId(): int
    {
        return (int) $this->pdo->lastInsertId();
    }
}
