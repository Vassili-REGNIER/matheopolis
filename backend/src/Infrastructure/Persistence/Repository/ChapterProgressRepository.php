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
             ORDER BY attempt_count DESC, id DESC
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
            'SELECT cp.* FROM chapter_progressions cp
             INNER JOIN (
                 SELECT user_id, chapter_id, MAX(attempt_count) AS max_attempt
                 FROM chapter_progressions
                 WHERE user_id IN ('.implode(', ', $placeholders).')
                 GROUP BY user_id, chapter_id
             ) latest ON cp.user_id = latest.user_id
                 AND cp.chapter_id = latest.chapter_id
                 AND cp.attempt_count = latest.max_attempt',
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
            return $existing;
        }

        $now = date('Y-m-d H:i:s');
        $this->db->execute(
            'INSERT INTO chapter_progressions (user_id, chapter_id, status, current_step_index, attempt_count, started_at)
             VALUES (:user_id, :chapter_id, :status, 0, 0, :started_at)',
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

    public function advanceToStep(int $userId, int $chapterId, int $currentStepIndex, ?int $score): ChapterProgress
    {
        $progress = $this->findByUserAndChapter($userId, $chapterId);
        if (null === $progress) {
            throw new \RuntimeException('Chapter progress not found.');
        }

        $this->db->execute(
            'UPDATE chapter_progressions
             SET current_step_index = :current_step_index,
                 score = :score
             WHERE id = :id',
            [
                'id' => $progress->getId(),
                'current_step_index' => $currentStepIndex,
                'score' => $score,
            ],
        );

        $updated = $this->findByUserAndChapter($userId, $chapterId);
        if (null === $updated) {
            throw new \RuntimeException('Failed to update chapter progress.');
        }

        return $updated;
    }

    public function complete(int $userId, int $chapterId): ChapterProgress
    {
        $now = date('Y-m-d H:i:s');
        $this->db->execute(
            'UPDATE chapter_progressions
             SET status = :status, completed_at = :completed_at
             WHERE user_id = :user_id AND chapter_id = :chapter_id
             AND attempt_count = (
                 SELECT max_attempt FROM (
                     SELECT MAX(attempt_count) AS max_attempt
                     FROM chapter_progressions
                     WHERE user_id = :user_id AND chapter_id = :chapter_id
                 ) AS sub
             )',
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
            $this->rowInt($row, 'attempt_count', 0),
            $this->rowIntOrNull($row, 'score'),
            $this->rowStr($row, 'started_at'),
            $this->rowStrOrNull($row, 'completed_at'),
        );
    }
}
