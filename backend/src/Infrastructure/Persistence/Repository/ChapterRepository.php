<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Repository;

use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Domain\Chapter;
use Matheopolis\Infrastructure\Persistence\AbstractRepository;

final class ChapterRepository extends AbstractRepository implements ChapterRepositoryInterface
{
    /**
     * @return array<int, Chapter>
     */
    public function findAll(): array
    {
        $stmt = $this->db->execute(
            'SELECT * FROM chapters ORDER BY position ASC, id ASC',
        );
        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = $this->mapToEntity($row);
        }

        return $items;
    }

    public function find(int $id): ?Chapter
    {
        $entity = parent::find($id);

        return $entity instanceof Chapter ? $entity : null;
    }

    /**
     * @return array<int, array{classId: int, isActive: bool}>
     */
    public function findTargetClassesByChapterId(int $chapterId): array
    {
        $stmt = $this->db->execute(
            'SELECT class_id, is_active FROM chapter_target_classes WHERE chapter_id = :chapter_id ORDER BY class_id ASC',
            ['chapter_id' => $chapterId],
        );
        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = [
                'classId' => $this->rowInt($row, 'class_id'),
                'isActive' => $this->rowBool($row, 'is_active', false),
            ];
        }

        return $items;
    }

    protected function getTableName(): string
    {
        return 'chapters';
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function mapToEntity(array $row): Chapter
    {
        return new Chapter(
            $this->rowInt($row, 'id'),
            $this->rowStr($row, 'slug'),
            $this->rowStr($row, 'title'),
            $this->rowStrOrNull($row, 'statement'),
            $this->rowInt($row, 'position'),
        );
    }
}
