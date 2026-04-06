<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Database;

final class PDOAdapter implements Queryable
{
    private \PDO $pdo;

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

    public function lastInsertId(): int
    {
        return (int) $this->pdo->lastInsertId();
    }
}
