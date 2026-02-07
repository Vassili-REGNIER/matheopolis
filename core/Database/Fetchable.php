<?php
declare(strict_types=1);

namespace Core\Database;

interface Fetchable
{
    public function fetch(): ?array;
    public function fetchAll(): array;
}