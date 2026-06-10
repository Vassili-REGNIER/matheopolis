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
    public function findTargetClassesByChapterId(int $chapterId, ?int $teacherId = null): array
    {
        if (null === $teacherId) {
            $stmt = $this->db->execute(
                'SELECT class_id, is_active FROM chapter_target_classes WHERE chapter_id = :chapter_id ORDER BY class_id ASC',
                ['chapter_id' => $chapterId],
            );
        } else {
            $stmt = $this->db->execute(
                'SELECT ctc.class_id, ctc.is_active
                 FROM chapter_target_classes ctc
                 INNER JOIN classes c ON c.id = ctc.class_id
                 WHERE ctc.chapter_id = :chapter_id AND c.teacher_id = :teacher_id
                 ORDER BY ctc.class_id ASC',
                ['chapter_id' => $chapterId, 'teacher_id' => $teacherId],
            );
        }

        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = [
                'classId' => $this->rowInt($row, 'class_id'),
                'isActive' => $this->rowBool($row, 'is_active', false),
            ];
        }

        return $items;
    }

    public function upsertTargetClass(int $chapterId, int $classId, bool $isActive): void
    {
        $this->db->execute(
            'INSERT INTO chapter_target_classes (chapter_id, class_id, is_active) VALUES (:chapter_id, :class_id, :is_active)
             ON DUPLICATE KEY UPDATE is_active = VALUES(is_active)',
            [
                'chapter_id' => $chapterId,
                'class_id' => $classId,
                'is_active' => $isActive ? 1 : 0,
            ],
        );
    }

    public function deleteTargetClass(int $chapterId, int $classId): void
    {
        $this->db->execute(
            'DELETE FROM chapter_target_classes WHERE chapter_id = :chapter_id AND class_id = :class_id',
            ['chapter_id' => $chapterId, 'class_id' => $classId],
        );
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
