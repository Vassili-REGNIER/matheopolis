<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Repository;

use Matheopolis\Domain\Repository\TeacherCodeRepositoryInterface;
use Matheopolis\Domain\TeacherCode;
use Matheopolis\Infrastructure\Persistence\AbstractRepository;

final class TeacherCodeRepository extends AbstractRepository implements TeacherCodeRepositoryInterface
{
    public function findByCode(string $code): ?TeacherCode
    {
        $query = 'SELECT * FROM teacher_codes WHERE code = :code LIMIT 1';
        $stmt = $this->db->execute($query, ['code' => $code]);
        $row = $stmt->fetch();

        return null !== $row ? $this->mapToEntity($row) : null;
    }

    public function markAsUsed(int $codeId, int $userId): void
    {
        $query = 'UPDATE teacher_codes SET is_used = 1, used_by_user_id = :uid WHERE id = :id';
        $this->db->execute($query, [
            'uid' => $userId,
            'id' => $codeId,
        ]);
    }

    protected function getTableName(): string
    {
        return 'teacher_codes';
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function mapToEntity(array $row): TeacherCode
    {
        return new TeacherCode(
            $this->rowInt($row, 'id'),
            $this->rowStr($row, 'code'),
            $this->rowBool($row, 'is_used'),
            $this->rowIntOrNull($row, 'used_by_user_id'),
            $this->rowStrOrNull($row, 'created_at'),
        );
    }
}
