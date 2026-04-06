<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Repository;

use Matheopolis\Domain\ClassEntity;
use Matheopolis\Domain\Repository\ClassRepositoryInterface;
use Matheopolis\Infrastructure\Persistence\AbstractRepository;

final class ClassRepository extends AbstractRepository implements ClassRepositoryInterface
{
    public function findByCode(string $code): ?ClassEntity
    {
        $query = 'SELECT * FROM classes WHERE code = :code LIMIT 1';
        $stmt = $this->db->execute($query, ['code' => $code]);
        $row = $stmt->fetch();

        return null !== $row ? $this->mapToEntity($row) : null;
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
