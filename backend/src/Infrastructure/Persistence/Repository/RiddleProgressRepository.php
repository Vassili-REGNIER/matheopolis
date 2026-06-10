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
        return $this->findLatestByUserIds($userIds);
    }

    /**
     * @param array<int, int> $userIds
     *
     * @return array<int, RiddleProgress>
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
            'SELECT rp.* FROM riddle_progressions rp
             INNER JOIN (
                 SELECT user_id, riddle_id, MAX(attempt_count) AS max_attempt
                 FROM riddle_progressions
                 WHERE user_id IN ('.implode(', ', $placeholders).')
                 GROUP BY user_id, riddle_id
             ) latest ON rp.user_id = latest.user_id
                 AND rp.riddle_id = latest.riddle_id
                 AND rp.attempt_count = latest.max_attempt',
            $params,
        );

        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = $this->mapToEntity($row);
        }

        return $items;
    }

    /**
     * @param array<int, int> $userIds
     * @param array<int, int> $riddleIds
     *
     * @return array<int, RiddleProgress>
     */
    public function findLatestByUserIdsAndRiddleIds(array $userIds, array $riddleIds): array
    {
        if ([] === $userIds || [] === $riddleIds) {
            return [];
        }

        $userPlaceholders = [];
        $params = [];
        foreach ($userIds as $index => $userId) {
            $key = 'user_'.$index;
            $params[$key] = $userId;
            $userPlaceholders[] = ':'.$key;
        }

        $riddlePlaceholders = [];
        foreach ($riddleIds as $index => $riddleId) {
            $key = 'riddle_'.$index;
            $params[$key] = $riddleId;
            $riddlePlaceholders[] = ':'.$key;
        }

        $stmt = $this->db->execute(
            'SELECT rp.* FROM riddle_progressions rp
             INNER JOIN (
                 SELECT user_id, riddle_id, MAX(attempt_count) AS max_attempt
                 FROM riddle_progressions
                 WHERE user_id IN ('.implode(', ', $userPlaceholders).')
                   AND riddle_id IN ('.implode(', ', $riddlePlaceholders).')
                 GROUP BY user_id, riddle_id
             ) latest ON rp.user_id = latest.user_id
                 AND rp.riddle_id = latest.riddle_id
                 AND rp.attempt_count = latest.max_attempt',
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
            'SELECT * FROM riddle_progressions
             WHERE user_id = :user_id AND riddle_id = :riddle_id
             ORDER BY attempt_count DESC, id DESC
             LIMIT 1',
            ['user_id' => $userId, 'riddle_id' => $riddleId],
        );
        $row = $stmt->fetch();

        return null !== $row ? $this->mapToEntity($row) : null;
    }

    public function start(int $userId, int $riddleId): RiddleProgress
    {
        $existing = $this->findByUserAndRiddle($userId, $riddleId);
        if (null !== $existing && 'in_progress' === $existing->getStatus()) {
            return $existing;
        }

        $attemptCount = null !== $existing ? $existing->getAttemptCount() + 1 : 0;

        return $this->insertAttempt($userId, $riddleId, $attemptCount);
    }

    /**
     * @return array{progress: RiddleProgress, isCorrect: bool}
     */
    public function recordResponse(
        int $userId,
        int $riddleId,
        int $questionId,
        int $questionOrderIndex,
        string $answer,
        bool $isCorrect,
        int $questionCount,
    ): array {
        $progress = $this->findByUserAndRiddle($userId, $riddleId);
        if (null === $progress) {
            throw new \RuntimeException('Riddle progress not found.');
        }

        if ($questionOrderIndex < $progress->getCurrentQuestionIndex()) {
            $this->clearResponses($progress->getId());
            $progress = $this->resetProgressForQuestion($progress->getId(), $questionOrderIndex);
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
        $score = $progress->getScore();

        if ($isCorrect) {
            $nextIndex = $progress->getCurrentQuestionIndex() + 1;
            if ($nextIndex >= $questionCount) {
                $status = 'completed';
                $completedAt = $now;
                $score = $questionCount;
            }
        }

        $this->db->execute(
            'UPDATE riddle_progressions
             SET status = :status,
                 current_question_index = :current_question_index,
                 attempt_count = attempt_count + 1,
                 score = :score,
                 completed_at = :completed_at
             WHERE id = :id',
            [
                'id' => $progress->getId(),
                'status' => $status,
                'current_question_index' => $isCorrect ? $nextIndex : $progress->getCurrentQuestionIndex(),
                'score' => $score,
                'completed_at' => $completedAt,
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
        $progress = $this->findByUserAndRiddle($userId, $riddleId);
        if (null === $progress) {
            throw new \RuntimeException('Riddle progress not found.');
        }

        $this->db->execute(
            'UPDATE riddle_progressions
             SET status = :status, completed_at = :completed_at
             WHERE id = :id',
            [
                'id' => $progress->getId(),
                'status' => 'completed',
                'completed_at' => $now,
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

    private function insertAttempt(int $userId, int $riddleId, int $attemptCount): RiddleProgress
    {
        $now = date('Y-m-d H:i:s');
        $this->db->execute(
            'INSERT INTO riddle_progressions
                (user_id, riddle_id, status, current_question_index, attempt_count, started_at)
             VALUES (:user_id, :riddle_id, :status, 0, :attempt_count, :started_at)',
            [
                'user_id' => $userId,
                'riddle_id' => $riddleId,
                'status' => 'in_progress',
                'attempt_count' => $attemptCount,
                'started_at' => $now,
            ],
        );

        $created = $this->findByUserAndRiddle($userId, $riddleId);
        if (null === $created) {
            throw new \RuntimeException('Failed to create riddle progress.');
        }

        return $created;
    }

    private function clearResponses(int $progressionId): void
    {
        $this->db->execute(
            'DELETE FROM riddle_responses WHERE progression_id = :progression_id',
            ['progression_id' => $progressionId],
        );
    }

    private function resetProgressForQuestion(int $progressionId, int $questionOrderIndex): RiddleProgress
    {
        $this->db->execute(
            'UPDATE riddle_progressions
             SET status = :status,
                 current_question_index = :current_question_index,
                 score = NULL,
                 completed_at = NULL
             WHERE id = :id',
            [
                'id' => $progressionId,
                'status' => 'in_progress',
                'current_question_index' => $questionOrderIndex,
            ],
        );

        $stmt = $this->db->execute(
            'SELECT * FROM riddle_progressions WHERE id = :id LIMIT 1',
            ['id' => $progressionId],
        );
        $row = $stmt->fetch();
        if (null === $row) {
            throw new \RuntimeException('Failed to reset riddle progress.');
        }

        return $this->mapToEntity($row);
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
            $this->rowIntOrNull($row, 'score'),
            $this->rowStr($row, 'started_at'),
            $this->rowStrOrNull($row, 'completed_at'),
        );
    }
}
