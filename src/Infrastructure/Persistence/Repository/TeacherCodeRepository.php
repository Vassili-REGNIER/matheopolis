<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Repository;

use Matheopolis\Application\Port\TeacherCodeRepositoryInterface;
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

    public function create(string $code): TeacherCode
    {
        $createdAt = date('Y-m-d H:i:s');
        $query = 'INSERT INTO teacher_codes (code, is_used, used_by_user_id, created_at) VALUES (:code, 0, NULL, :created_at)';
        $this->db->execute($query, [
            'code' => $code,
            'created_at' => $createdAt,
        ]);

        return new TeacherCode(
            $this->db->lastInsertId(),
            $code,
            false,
            null,
            $createdAt,
        );
    }

    /**
     * @return array<int, TeacherCode>
     */
    public function findAllCodes(): array
    {
        $query = 'SELECT * FROM teacher_codes ORDER BY id DESC';
        $stmt = $this->db->execute($query);
        $codes = [];
        foreach ($stmt->fetchAll() as $row) {
            $codes[] = $this->mapToEntity($row);
        }

        return $codes;
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
