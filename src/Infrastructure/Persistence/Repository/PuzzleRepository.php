<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Repository;

use Matheopolis\Application\Port\PuzzleRepositoryInterface;
use Matheopolis\Domain\Puzzle;
use Matheopolis\Infrastructure\Persistence\AbstractRepository;

final class PuzzleRepository extends AbstractRepository implements PuzzleRepositoryInterface
{
    /**
     * @return array<int, Puzzle>
     */
    public function findAll(): array
    {
        $stmt = $this->db->execute('SELECT * FROM puzzles ORDER BY position ASC');
        $puzzles = [];
        foreach ($stmt->fetchAll() as $row) {
            $puzzles[] = $this->mapToEntity($row);
        }

        return $puzzles;
    }

    public function find(int $id): ?Puzzle
    {
        $entity = parent::find($id);

        return $entity instanceof Puzzle ? $entity : null;
    }

    public function findBySlug(string $slug): ?Puzzle
    {
        $stmt = $this->db->execute('SELECT * FROM puzzles WHERE slug = :slug LIMIT 1', ['slug' => $slug]);
        $row = $stmt->fetch();

        return null !== $row ? $this->mapToEntity($row) : null;
    }

    public function insert(string $slug, string $title, string $statement, int $position, bool $isActive): Puzzle
    {
        $query = 'INSERT INTO puzzles (slug, title, statement, position, is_active) VALUES (:slug, :title, :statement, :position, :is_active)';
        $this->db->execute($query, [
            'slug' => $slug,
            'title' => $title,
            'statement' => $statement,
            'position' => $position,
            'is_active' => $isActive ? 1 : 0,
        ]);

        return new Puzzle(
            $this->db->lastInsertId(),
            $slug,
            $title,
            $statement,
            $position,
            $isActive,
        );
    }

    public function update(int $id, string $title, string $statement, int $position, bool $isActive): void
    {
        $query = 'UPDATE puzzles SET title = :title, statement = :statement, position = :position, is_active = :is_active WHERE id = :id';
        $this->db->execute($query, [
            'id' => $id,
            'title' => $title,
            'statement' => $statement,
            'position' => $position,
            'is_active' => $isActive ? 1 : 0,
        ]);
    }

    protected function getTableName(): string
    {
        return 'puzzles';
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function mapToEntity(array $row): Puzzle
    {
        return new Puzzle(
            $this->rowInt($row, 'id'),
            $this->rowStr($row, 'slug'),
            $this->rowStr($row, 'title'),
            $this->rowStr($row, 'statement'),
            $this->rowInt($row, 'position'),
            $this->rowBool($row, 'is_active', true),
        );
    }
}
