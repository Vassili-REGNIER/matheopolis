<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\TeacherCode;

interface TeacherCodeRepositoryInterface
{
    public function findByCode(string $code): ?TeacherCode;

    public function markAsUsed(int $codeId, int $userId): void;

    public function create(string $code, ?string $expiresAt, ?int $createdByAdminId): TeacherCode;

    /**
     * @return array<int, TeacherCode>
     */
    public function findAllCodes(?string $status = null): array;

    public function disable(int $id): void;
}
