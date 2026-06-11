<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\QuizProgress;

/**
 * Defines the contract for the quiz progress repository dependency.
 */
interface QuizProgressRepositoryInterface
{
    /**
     * Finds matching records for the requested criteria.
     */
    public function findByUserAndQuiz(int $userId, int $quizId): ?QuizProgress;

    /**
     * Start.
     */
    public function start(int $userId, int $quizId): QuizProgress;

    /**
     * Start new attempt.
     */
    public function startNewAttempt(int $userId, int $quizId): QuizProgress;

    /**
     * @param array<int, int> $optionIds
     */
    public function recordAnswer(
        int $progressionId,
        int $questionId,
        int $attemptNumber,
        array $optionIds,
    ): void;

    /**
     * Advance after answer.
     */
    public function advanceAfterAnswer(int $progressionId, int $nextIndex, bool $completed, ?int $score): QuizProgress;

    /**
     * @return array<int, array<int, int>> selected option ids keyed by question ID for the attempt
     */
    public function selectedOptionIdsByQuestion(int $progressionId, int $attemptNumber): array;

    /**
     * @return array<int, int> map questionId => orderIndex
     */
    public function questionOrderByQuizId(int $quizId): array;

    /**
     * @param array<int, int> $userIds
     * @param array<int, int> $quizIds
     *
     * @return array<int, QuizProgress>
     */
    public function findLatestByUserIdsAndQuizIds(array $userIds, array $quizIds): array;

    /**
     * @param array<int, int> $userIds
     * @param array<int, int> $quizIds
     *
     * @return array<int, array<int, int>>
     */
    public function findBestScoresByUserIdsAndQuizIds(array $userIds, array $quizIds): array;

    /**
     * @param array<int, int> $userIds
     *
     * @return array<int, QuizProgress>
     */
    public function findBestProgressByUserIdsAndQuizId(array $userIds, int $quizId): array;

    /**
     * @param array<int, int> $userIds
     * @param array<int, int> $quizIds
     *
     * @return array<int, array<int, int>>
     */
    public function findAttemptCountsByUserIdsAndQuizIds(array $userIds, array $quizIds): array;
}
