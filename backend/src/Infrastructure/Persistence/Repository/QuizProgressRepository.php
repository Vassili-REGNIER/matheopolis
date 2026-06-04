<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Repository;

use Matheopolis\Application\Port\QuizProgressRepositoryInterface;
use Matheopolis\Domain\QuizProgress;
use Matheopolis\Infrastructure\Persistence\AbstractRepository;

final class QuizProgressRepository extends AbstractRepository implements QuizProgressRepositoryInterface
{
    public function findByUserAndQuiz(int $userId, int $quizId): ?QuizProgress
    {
        $stmt = $this->db->execute(
            'SELECT * FROM quiz_progressions WHERE user_id = :user_id AND quiz_id = :quiz_id LIMIT 1',
            ['user_id' => $userId, 'quiz_id' => $quizId],
        );
        $row = $stmt->fetch();

        return null !== $row ? $this->mapProgress($row) : null;
    }

    public function start(int $userId, int $quizId): QuizProgress
    {
        $existing = $this->findByUserAndQuiz($userId, $quizId);
        if (null !== $existing) {
            return $existing;
        }

        $startedAt = date('Y-m-d H:i:s');
        $this->db->execute(
            'INSERT INTO quiz_progressions
                (user_id, quiz_id, status, attempt_count, current_question_index, started_at)
             VALUES (:user_id, :quiz_id, :status, 1, 0, :started_at)',
            [
                'user_id' => $userId,
                'quiz_id' => $quizId,
                'status' => 'in_progress',
                'started_at' => $startedAt,
            ],
        );

        $created = $this->findByUserAndQuiz($userId, $quizId);
        if (null === $created) {
            throw new \RuntimeException('Failed to load quiz progression after insert.');
        }

        return $created;
    }

    public function startNewAttempt(int $userId, int $quizId): QuizProgress
    {
        $existing = $this->findByUserAndQuiz($userId, $quizId);
        if (null === $existing) {
            return $this->start($userId, $quizId);
        }

        $attemptCount = $existing->getAttemptCount() + 1;
        $this->db->execute(
            'UPDATE quiz_progressions
             SET status = :status,
                 attempt_count = :attempt_count,
                 current_question_index = 0,
                 completed_at = NULL
             WHERE id = :id',
            [
                'id' => $existing->getId(),
                'status' => 'in_progress',
                'attempt_count' => $attemptCount,
            ],
        );

        $updated = $this->findByUserAndQuiz($userId, $quizId);
        if (null === $updated) {
            throw new \RuntimeException('Failed to load quiz progression after new attempt.');
        }

        return $updated;
    }

    /**
     * @param array<int, int> $optionIds
     */
    public function recordAnswer(
        int $progressionId,
        int $questionId,
        int $attemptNumber,
        array $optionIds,
    ): void {
        foreach ($optionIds as $optionId) {
            $this->db->execute(
                'INSERT INTO quiz_responses (progression_id, question_id, option_id, attempt_number, created_at)
                 VALUES (:progression_id, :question_id, :option_id, :attempt_number, :created_at)',
                [
                    'progression_id' => $progressionId,
                    'question_id' => $questionId,
                    'option_id' => $optionId,
                    'attempt_number' => $attemptNumber,
                    'created_at' => date('Y-m-d H:i:s'),
                ],
            );
        }
    }

    public function advanceAfterAnswer(int $progressionId, int $nextIndex, bool $completed, ?int $score): QuizProgress
    {
        if ($completed) {
            $this->db->execute(
                'UPDATE quiz_progressions
                 SET status = :status,
                     current_question_index = :current_question_index,
                     last_score = :last_score,
                     best_score = GREATEST(COALESCE(best_score, 0), :last_score),
                     completed_at = :completed_at
                 WHERE id = :id',
                [
                    'id' => $progressionId,
                    'status' => 'completed',
                    'current_question_index' => $nextIndex,
                    'last_score' => $score,
                    'completed_at' => date('Y-m-d H:i:s'),
                ],
            );
        } else {
            $this->db->execute(
                'UPDATE quiz_progressions
                 SET current_question_index = :current_question_index
                 WHERE id = :id',
                [
                    'id' => $progressionId,
                    'current_question_index' => $nextIndex,
                ],
            );
        }

        $stmt = $this->db->execute('SELECT * FROM quiz_progressions WHERE id = :id LIMIT 1', ['id' => $progressionId]);
        $row = $stmt->fetch();
        if (null === $row) {
            throw new \RuntimeException('Quiz progression not found after update.');
        }

        return $this->mapProgress($row);
    }

    public function selectedOptionIdsByQuestion(int $progressionId, int $attemptNumber): array
    {
        $stmt = $this->db->execute(
            'SELECT question_id, option_id FROM quiz_responses
             WHERE progression_id = :progression_id AND attempt_number = :attempt_number',
            ['progression_id' => $progressionId, 'attempt_number' => $attemptNumber],
        );

        $map = [];
        foreach ($stmt->fetchAll() as $row) {
            $questionId = $this->rowInt($row, 'question_id');
            if (!isset($map[$questionId])) {
                $map[$questionId] = [];
            }
            $map[$questionId][] = $this->rowInt($row, 'option_id');
        }

        return $map;
    }

    public function questionOrderByQuizId(int $quizId): array
    {
        $stmt = $this->db->execute(
            'SELECT id, order_index FROM quiz_questions WHERE quiz_id = :quiz_id ORDER BY order_index ASC, id ASC',
            ['quiz_id' => $quizId],
        );

        $map = [];
        foreach ($stmt->fetchAll() as $row) {
            $map[$this->rowInt($row, 'id')] = $this->rowInt($row, 'order_index');
        }

        return $map;
    }

    protected function getTableName(): string
    {
        return 'quiz_progressions';
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function mapToEntity(array $row): object
    {
        return $this->mapProgress($row);
    }

    /**
     * @param array<string, mixed> $row
     */
    private function mapProgress(array $row): QuizProgress
    {
        return new QuizProgress(
            $this->rowInt($row, 'id'),
            $this->rowInt($row, 'user_id'),
            $this->rowInt($row, 'quiz_id'),
            $this->rowStr($row, 'status'),
            $this->rowInt($row, 'attempt_count'),
            $this->rowInt($row, 'current_question_index'),
            $this->rowIntOrNull($row, 'last_score'),
            $this->rowIntOrNull($row, 'best_score'),
            $this->rowStr($row, 'started_at'),
            $this->rowStrOrNull($row, 'completed_at'),
        );
    }
}
