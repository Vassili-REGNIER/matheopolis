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
        $query = 'SELECT * FROM classes WHERE code = :code AND archived_at IS NULL LIMIT 1';
        $stmt = $this->db->execute($query, ['code' => $code]);
        $row = $stmt->fetch();

        return null !== $row ? $this->mapToEntity($row) : null;
    }

    public function find(int $id): ?ClassEntity
    {
        $stmt = $this->db->execute('SELECT * FROM classes WHERE id = :id LIMIT 1', ['id' => $id]);
        $row = $stmt->fetch();

        return null !== $row ? $this->mapToEntity($row) : null;
    }

    /**
     * @return array<int, ClassEntity>
     */
    public function findByTeacher(int $teacherId): array
    {
        $query = 'SELECT * FROM classes WHERE teacher_id = :tid AND archived_at IS NULL ORDER BY created_at DESC';
        $stmt = $this->db->execute($query, ['tid' => $teacherId]);

        $classes = [];
        foreach ($stmt->fetchAll() as $row) {
            $classes[] = $this->mapToEntity($row);
        }

        return $classes;
    }

    public function insert(string $name, ?string $description, string $code, int $teacherId): ClassEntity
    {
        $query = 'INSERT INTO classes (name, description, code, teacher_id, created_at) VALUES (:name, :description, :code, :teacher_id, :created_at)';
        $createdAt = date('Y-m-d H:i:s');
        $this->db->execute($query, [
            'name' => $name,
            'description' => $description,
            'code' => $code,
            'teacher_id' => $teacherId,
            'created_at' => $createdAt,
        ]);

        return new ClassEntity(
            $this->db->lastInsertId(),
            $name,
            $description,
            $code,
            $teacherId,
            $createdAt,
        );
    }

    public function update(int $id, string $name, ?string $description): ?ClassEntity
    {
        $this->db->execute(
            'UPDATE classes SET name = :name, description = :description WHERE id = :id',
            ['id' => $id, 'name' => $name, 'description' => $description],
        );

        return $this->find($id);
    }

    public function archive(int $id): void
    {
        $this->db->execute(
            'UPDATE classes SET archived_at = :archived_at WHERE id = :id',
            ['id' => $id, 'archived_at' => date('Y-m-d H:i:s')],
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
            $this->rowStrOrNull($row, 'description'),
            $this->rowStr($row, 'code'),
            $this->rowInt($row, 'teacher_id'),
            $this->rowStrOrNull($row, 'created_at'),
            $this->rowStrOrNull($row, 'archived_at'),
        );
    }
}
