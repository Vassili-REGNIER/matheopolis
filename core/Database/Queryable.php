<?php
declare(strict_types=1);

namespace Core\Database;

interface Queryable
{
    public function execute(string $query, array $params = []): Fetchable;
    public function lastInsertId(): int;
}