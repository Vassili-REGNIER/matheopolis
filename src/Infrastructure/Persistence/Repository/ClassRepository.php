<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Repository;

use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Domain\ClassEntity;
use Matheopolis\Infrastructure\Persistence\AbstractRepository;

final class ClassRepository extends AbstractRepository implements ClassroomRepositoryInterface
{
    public function findByCode(string $code): ?ClassEntity
    {
        $query = 'SELECT * FROM classes WHERE code = :code LIMIT 1';
        $stmt = $this->db->execute($query, ['code' => $code]);
        $row = $stmt->fetch();

        return null !== $row ? $this->mapToEntity($row) : null;
    }

    public function find(int $id): ?ClassEntity
    {
        $entity = parent::find($id);

        return $entity instanceof ClassEntity ? $entity : null;
    }

    /**
     * @return array<int, ClassEntity>
     */
    public function findByTeacher(int $teacherId): array
    {
        $query = 'SELECT * FROM classes WHERE teacher_id = :tid ORDER BY created_at DESC';
        $stmt = $this->db->execute($query, ['tid' => $teacherId]);

        $classes = [];
        foreach ($stmt->fetchAll() as $row) {
            $classes[] = $this->mapToEntity($row);
        }

        return $classes;
    }

    public function insert(string $name, string $code, int $teacherId): ClassEntity
    {
        $query = 'INSERT INTO classes (name, code, teacher_id, created_at) VALUES (:name, :code, :teacher_id, :created_at)';
        $createdAt = date('Y-m-d H:i:s');
        $this->db->execute($query, [
            'name' => $name,
            'code' => $code,
            'teacher_id' => $teacherId,
            'created_at' => $createdAt,
        ]);

        return new ClassEntity(
            $this->db->lastInsertId(),
            $name,
            $code,
            $teacherId,
            $createdAt,
        );
    }

    protected function getTableName(): string
    {
        return 'classes';
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function mapToEntity(array $row): ClassEntity
    {
        return new ClassEntity(
            $this->rowInt($row, 'id'),
            $this->rowStr($row, 'name'),
            $this->rowStr($row, 'code'),
            $this->rowInt($row, 'teacher_id'),
            $this->rowStrOrNull($row, 'created_at'),
        );
    }
}
