<?php
declare(strict_types=1);

namespace Src\Repository;

use Core\Repository;
use Src\Domain\ClassEntity;

class ClassRepository extends Repository
{
    protected function getTableName(): string
    {
        return 'classes';
    }

    protected function mapToEntity(array $row): ClassEntity
    {
        return new ClassEntity(
            (int)$row['id'],
            $row['name'],
            $row['code'],
            (int)$row['teacher_id'],
            $row['created_at'] ?? null
        );
    }

    /**
     * Trouve une classe via son code d'invitation unique.
     */
    public function findByCode(string $code): ?ClassEntity
    {
        $query = "SELECT * FROM classes WHERE code = :code LIMIT 1";
        $stmt = $this->db->execute($query, ['code' => $code]);
        $row = $stmt->fetch();

        return $row ? $this->mapToEntity($row) : null;
    }

    /**
     * Récupère toutes les classes d'un professeur.
     * @return ClassEntity[]
     */
    public function findByTeacher(int $teacherId): array
    {
        $query = "SELECT * FROM classes WHERE teacher_id = :tid ORDER BY created_at DESC";
        $stmt = $this->db->execute($query, ['tid' => $teacherId]);

        $classes = [];
        foreach ($stmt->fetchAll() as $row) {
            $classes[] = $this->mapToEntity($row);
        }
        return $classes;
    }
}