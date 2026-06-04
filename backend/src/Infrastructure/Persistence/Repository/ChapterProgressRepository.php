<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Repository;

use Matheopolis\Application\Port\ChapterProgressRepositoryInterface;
use Matheopolis\Domain\ChapterProgress;
use Matheopolis\Infrastructure\Persistence\AbstractRepository;

final class ChapterProgressRepository extends AbstractRepository implements ChapterProgressRepositoryInterface
{
    public function findByUserAndChapter(int $userId, int $chapterId): ?ChapterProgress
    {
        $stmt = $this->db->execute(
            'SELECT * FROM chapter_progressions WHERE user_id = :user_id AND chapter_id = :chapter_id LIMIT 1',
            ['user_id' => $userId, 'chapter_id' => $chapterId],
        );
        $row = $stmt->fetch();

        return null !== $row ? $this->mapToEntity($row) : null;
    }

    public function start(int $userId, int $chapterId): ChapterProgress
    {
        $existing = $this->findByUserAndChapter($userId, $chapterId);
        if (null !== $existing) {
            return $existing;
        }

        $now = date('Y-m-d H:i:s');
        $this->db->execute(
            'INSERT INTO chapter_progressions (user_id, chapter_id, status, started_at)
             VALUES (:user_id, :chapter_id, :status, :started_at)',
            [
                'user_id' => $userId,
                'chapter_id' => $chapterId,
                'status' => 'in_progress',
                'started_at' => $now,
            ],
        );

        $created = $this->findByUserAndChapter($userId, $chapterId);
        if (null === $created) {
            throw new \RuntimeException('Failed to create chapter progress.');
        }

        return $created;
    }

    public function complete(int $userId, int $chapterId): ChapterProgress
    {
        $now = date('Y-m-d H:i:s');
        $this->db->execute(
            'UPDATE chapter_progressions
             SET status = :status, completed_at = :completed_at
             WHERE user_id = :user_id AND chapter_id = :chapter_id',
            [
                'status' => 'completed',
                'completed_at' => $now,
                'user_id' => $userId,
                'chapter_id' => $chapterId,
            ],
        );

        $updated = $this->findByUserAndChapter($userId, $chapterId);
        if (null === $updated) {
            throw new \RuntimeException('Failed to complete chapter progress.');
        }

        return $updated;
    }

    protected function getTableName(): string
    {
        return 'chapter_progressions';
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function mapToEntity(array $row): ChapterProgress
    {
        return new ChapterProgress(
            $this->rowInt($row, 'id'),
            $this->rowInt($row, 'user_id'),
            $this->rowInt($row, 'chapter_id'),
            $this->rowStr($row, 'status', 'in_progress'),
            $this->rowStr($row, 'started_at'),
            $this->rowStrOrNull($row, 'completed_at'),
        );
    }
}
