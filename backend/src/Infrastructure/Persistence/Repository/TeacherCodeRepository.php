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
        $query = 'UPDATE teacher_codes SET status = :status, used_by_user_id = :uid, used_at = :used_at WHERE id = :id';
        $this->db->execute($query, [
            'status' => 'used',
            'uid' => $userId,
            'used_at' => date('Y-m-d H:i:s'),
            'id' => $codeId,
        ]);
    }

    public function create(string $code, ?string $expiresAt, ?int $createdByAdminId): TeacherCode
    {
        $createdAt = date('Y-m-d H:i:s');
        $query = 'INSERT INTO teacher_codes (code, status, used_by_user_id, created_at, used_at, expires_at, created_by_admin_id) VALUES (:code, :status, NULL, :created_at, NULL, :expires_at, :created_by_admin_id)';
        $this->db->execute($query, [
            'code' => $code,
            'status' => 'active',
            'created_at' => $createdAt,
            'expires_at' => $expiresAt,
            'created_by_admin_id' => $createdByAdminId,
        ]);

        return new TeacherCode(
            $this->db->lastInsertId(),
            $code,
            'active',
            null,
            $createdAt,
            null,
            $expiresAt,
            $createdByAdminId,
        );
    }

    /**
     * @return array<int, TeacherCode>
     */
    public function findAllCodes(?string $status = null): array
    {
        if (null !== $status && '' !== $status) {
            $stmt = $this->db->execute('SELECT * FROM teacher_codes WHERE status = :status ORDER BY id DESC', ['status' => $status]);
        } else {
            $stmt = $this->db->execute('SELECT * FROM teacher_codes ORDER BY id DESC');
        }
        $codes = [];
        foreach ($stmt->fetchAll() as $row) {
            $codes[] = $this->mapToEntity($row);
        }

        return $codes;
    }

    public function disable(int $id): void
    {
        $this->db->execute(
            'UPDATE teacher_codes SET status = :status WHERE id = :id',
            ['id' => $id, 'status' => 'disabled'],
        );
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
            $this->rowStr($row, 'status', 'active'),
            $this->rowIntOrNull($row, 'used_by_user_id'),
            $this->rowStrOrNull($row, 'created_at'),
            $this->rowStrOrNull($row, 'used_at'),
            $this->rowStrOrNull($row, 'expires_at'),
            $this->rowIntOrNull($row, 'created_by_admin_id'),
        );
    }
}
