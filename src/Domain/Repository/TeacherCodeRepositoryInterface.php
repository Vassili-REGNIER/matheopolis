<?php

declare(strict_types=1);

namespace Matheopolis\Domain\Repository;

use Matheopolis\Domain\TeacherCode;

interface TeacherCodeRepositoryInterface
{
    public function findByCode(string $code): ?TeacherCode;

    public function markAsUsed(int $codeId, int $userId): void;
}
