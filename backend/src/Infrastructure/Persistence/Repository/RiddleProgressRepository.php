<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Repository;

use Matheopolis\Application\Port\RiddleProgressRepositoryInterface;
use Matheopolis\Domain\RiddleProgress;
use Matheopolis\Infrastructure\Persistence\AbstractRepository;

final class RiddleProgressRepository extends AbstractRepository implements RiddleProgressRepositoryInterface
{
    /**
     * @param array<int, int> $userIds
     *
     * @return array<int, RiddleProgress>
     */
    public function findByUserIds(array $userIds): array
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
            'SELECT * FROM riddle_progressions WHERE user_id IN ('.implode(', ', $placeholders).')',
            $params,
        );

        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = $this->mapToEntity($row);
        }

        return $items;
    }

    public function findByUserAndRiddle(int $userId, int $riddleId): ?RiddleProgress
    {
        $stmt = $this->db->execute(
            'SELECT * FROM riddle_progressions WHERE user_id = :user_id AND riddle_id = :riddle_id LIMIT 1',
            ['user_id' => $userId, 'riddle_id' => $riddleId],
        );
        $row = $stmt->fetch();

        return null !== $row ? $this->mapToEntity($row) : null;
    }

    public function start(int $userId, int $riddleId): RiddleProgress
    {
        $existing = $this->findByUserAndRiddle($userId, $riddleId);
        if (null !== $existing) {
            return $existing;
        }

        $now = date('Y-m-d H:i:s');
        $this->db->execute(
            'INSERT INTO riddle_progressions
                (user_id, riddle_id, status, current_question_index, attempt_count, started_at)
             VALUES (:user_id, :riddle_id, :status, 0, 0, :started_at)',
            [
                'user_id' => $userId,
                'riddle_id' => $riddleId,
                'status' => 'in_progress',
                'started_at' => $now,
            ],
        );

        $created = $this->findByUserAndRiddle($userId, $riddleId);
        if (null === $created) {
            throw new \RuntimeException('Failed to create riddle progress.');
        }

        return $created;
    }

    /**
     * @return array{progress: RiddleProgress, isCorrect: bool}
     */
    public function recordResponse(
        int $userId,
        int $riddleId,
        int $questionId,
        string $answer,
        bool $isCorrect,
        int $questionCount,
    ): array {
        $progress = $this->findByUserAndRiddle($userId, $riddleId);
        if (null === $progress) {
            throw new \RuntimeException('Riddle progress not found.');
        }

        $now = date('Y-m-d H:i:s');
        $this->db->execute(
            'INSERT INTO riddle_responses (progression_id, question_id, answer, is_correct, created_at)
             VALUES (:progression_id, :question_id, :answer, :is_correct, :created_at)',
            [
                'progression_id' => $progress->getId(),
                'question_id' => $questionId,
                'answer' => $answer,
                'is_correct' => $isCorrect ? 1 : 0,
                'created_at' => $now,
            ],
        );

        $nextIndex = $progress->getCurrentQuestionIndex();
        $status = 'in_progress';
        $completedAt = null;

        if ($isCorrect) {
            $nextIndex = $progress->getCurrentQuestionIndex() + 1;
            if ($nextIndex >= $questionCount) {
                $status = 'completed';
                $completedAt = $now;
            }
        }

        $this->db->execute(
            'UPDATE riddle_progressions
             SET status = :status,
                 current_question_index = :current_question_index,
                 attempt_count = attempt_count + 1,
                 last_attempt_at = :last_attempt_at,
                 completed_at = :completed_at
             WHERE user_id = :user_id AND riddle_id = :riddle_id',
            [
                'status' => $status,
                'current_question_index' => $isCorrect ? $nextIndex : $progress->getCurrentQuestionIndex(),
                'last_attempt_at' => $now,
                'completed_at' => $completedAt,
                'user_id' => $userId,
                'riddle_id' => $riddleId,
            ],
        );

        $updated = $this->findByUserAndRiddle($userId, $riddleId);
        if (null === $updated) {
            throw new \RuntimeException('Failed to update riddle progress.');
        }

        return ['progress' => $updated, 'isCorrect' => $isCorrect];
    }

    public function complete(int $userId, int $riddleId): RiddleProgress
    {
        $now = date('Y-m-d H:i:s');
        $this->db->execute(
            'UPDATE riddle_progressions
             SET status = :status, completed_at = :completed_at
             WHERE user_id = :user_id AND riddle_id = :riddle_id',
            [
                'status' => 'completed',
                'completed_at' => $now,
                'user_id' => $userId,
                'riddle_id' => $riddleId,
            ],
        );

        $updated = $this->findByUserAndRiddle($userId, $riddleId);
        if (null === $updated) {
            throw new \RuntimeException('Failed to complete riddle progress.');
        }

        return $updated;
    }

    protected function getTableName(): string
    {
        return 'riddle_progressions';
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function mapToEntity(array $row): RiddleProgress
    {
        return new RiddleProgress(
            $this->rowInt($row, 'id'),
            $this->rowInt($row, 'user_id'),
            $this->rowInt($row, 'riddle_id'),
            $this->rowStr($row, 'status', 'in_progress'),
            $this->rowInt($row, 'current_question_index', 0),
            $this->rowInt($row, 'attempt_count', 0),
            $this->rowStr($row, 'started_at'),
            $this->rowStrOrNull($row, 'completed_at'),
            $this->rowStrOrNull($row, 'last_attempt_at'),
        );
    }
}
