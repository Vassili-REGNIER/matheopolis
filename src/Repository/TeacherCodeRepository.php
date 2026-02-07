<?php
declare(strict_types=1);

namespace Src\Repository;

use Core\Repository;
use Src\Domain\TeacherCode;

class TeacherCodeRepository extends Repository
{
    protected function getTableName(): string
    {
        return 'teacher_codes';
    }

    protected function mapToEntity(array $row): TeacherCode
    {
        return new TeacherCode(
            (int)$row['id'],
            $row['code'],
            (bool)$row['is_used'],
            isset($row['used_by_user_id']) ? (int)$row['used_by_user_id'] : null
        );
    }

    /**
     * Trouve un code spécifique.
     */
    public function findByCode(string $code): ?TeacherCode
    {
        $query = "SELECT * FROM teacher_codes WHERE code = :code LIMIT 1";
        $stmt = $this->db->execute($query, ['code' => $code]);
        $row = $stmt->fetch();

        return $row ? $this->mapToEntity($row) : null;
    }

    /**
     * Marque le code comme utilisé par un professeur.
     */
    public function markAsUsed(int $codeId, int $userId): void
    {
        $query = "UPDATE teacher_codes SET is_used = 1, used_by_user_id = :uid WHERE id = :id";
        $this->db->execute($query, [
            'uid' => $userId,
            'id' => $codeId
        ]);
    }
}