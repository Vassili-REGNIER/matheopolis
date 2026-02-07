<?php
declare(strict_types=1);

namespace Src\Repository;

use Core\Repository;
use Src\Domain\Chapter;

class ChapterRepository extends Repository
{
    protected function getTableName(): string
    {
        return 'chapters';
    }

    protected function mapToEntity(array $row): Chapter
    {
        return new Chapter(
            (int)$row['id'],
            $row['title'],
            $row['slug'],
            $row['order_index'],
            $row['level'] ?? null,
        );
    }

    /**
     * Récupère tous les chapitres ordonnés par leur index.
     */
    public function findAllOrdered(): array
    {
        $query = "SELECT * FROM chapters ORDER BY order_index ASC";
        $stmt = $this->db->execute($query);

        $chapters = [];
        foreach ($stmt->fetchAll() as $row) {
            $chapters[] = $this->mapToEntity($row);
        }
        return $chapters;
    }

    /**
     * Filtre les chapitres par niveau (ex: '6ème').
     */
    public function findByLevel(string $level): array
    {
        // Inclut aussi les chapitres "communs" (level IS NULL)
        $query = "SELECT * FROM chapters WHERE level = :level OR level IS NULL ORDER BY order_index ASC";
        $stmt = $this->db->execute($query, ['level' => $level]);

        $chapters = [];
        foreach ($stmt->fetchAll() as $row) {
            $chapters[] = $this->mapToEntity($row);
        }
        return $chapters;
    }

    public function findBySlug(string $slug): ?Chapter
    {
        $query = "SELECT * FROM chapters WHERE slug = :slug LIMIT 1";
        $stmt = $this->db->execute($query, ['slug' => $slug]);
        $row = $stmt->fetch();

        return $row ? $this->mapToEntity($row) : null;
    }
}