<?php
declare(strict_types=1);

namespace Core\Database;

use PDO;
use PDOStatement;

class PDOStatementAdapter implements Fetchable
{
    private PDOStatement $statement;

    public function __construct(PDOStatement $statement)
    {
        $this->statement = $statement;
    }

    public function fetch(): ?array
    {
        $result = $this->statement->fetch(PDO::FETCH_ASSOC);
        return $result === false ? null : $result;
    }

    public function fetchAll(): array
    {
        return $this->statement->fetchAll(PDO::FETCH_ASSOC);
    }
}