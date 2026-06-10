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
            'SELECT * FROM chapter_progressions
             WHERE user_id = :user_id AND chapter_id = :chapter_id
             LIMIT 1',
            ['user_id' => $userId, 'chapter_id' => $chapterId],
        );
        $row = $stmt->fetch();

        return null !== $row ? $this->mapToEntity($row) : null;
    }

    /**
     * @param array<int, int> $userIds
     *
     * @return array<int, ChapterProgress> keyed by progression id
     */
    public function findLatestByUserIds(array $userIds): array
    {
        if ([] === $userIds) {
            return [];
        }

        $placeholders = [];
        $params = [];
        foreach ($userIds as $index => $userId) {
            $key = 'user_'.$index;
            $params[$key] = $userId;
            $placeholders[] = ':'.$key;
        }

        $stmt = $this->db->execute(
            'SELECT * FROM chapter_progressions
             WHERE user_id IN ('.implode(', ', $placeholders).')',
            $params,
        );

        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = $this->mapToEntity($row);
        }

        return $items;
    }

    public function start(int $userId, int $chapterId): ChapterProgress
    {
        $existing = $this->findByUserAndChapter($userId, $chapterId);
        if (null !== $existing) {
            if ('in_progress' === $existing->getStatus()) {
                return $existing;
            }

            return $this->restart($userId, $chapterId);
        }

        $now = date('Y-m-d H:i:s');
        $this->db->execute(
            'INSERT INTO chapter_progressions (user_id, chapter_id, status, current_step_index, started_at)
             VALUES (:user_id, :chapter_id, :status, 0, :started_at)',
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

    public function syncStepIndex(int $userId, int $chapterId, int $stepIndex): ChapterProgress
    {
        $this->db->execute(
            'UPDATE chapter_progressions
             SET current_step_index = :current_step_index
             WHERE user_id = :user_id
               AND chapter_id = :chapter_id
               AND status = :status',
            [
                'current_step_index' => $stepIndex,
                'user_id' => $userId,
                'chapter_id' => $chapterId,
                'status' => 'in_progress',
            ],
        );

        $updated = $this->findByUserAndChapter($userId, $chapterId);
        if (null === $updated || 'in_progress' !== $updated->getStatus()) {
            throw new \RuntimeException('Failed to sync chapter step index.');
        }

        return $updated;
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
            $this->rowInt($row, 'current_step_index', 0),
            $this->rowIntOrNull($row, 'score'),
            $this->rowStr($row, 'started_at'),
            $this->rowStrOrNull($row, 'completed_at'),
        );
    }

    private function restart(int $userId, int $chapterId): ChapterProgress
    {
        $now = date('Y-m-d H:i:s');
        $this->db->execute(
            'UPDATE chapter_progressions
             SET status = :status,
                 current_step_index = 0,
                 score = NULL,
                 started_at = :started_at,
                 completed_at = NULL
             WHERE user_id = :user_id AND chapter_id = :chapter_id',
            [
                'status' => 'in_progress',
                'started_at' => $now,
                'user_id' => $userId,
                'chapter_id' => $chapterId,
            ],
        );

        $restarted = $this->findByUserAndChapter($userId, $chapterId);
        if (null === $restarted || 'in_progress' !== $restarted->getStatus()) {
            throw new \RuntimeException('Failed to restart chapter progress.');
        }

        return $restarted;
    }
}
