<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\RiddleProgress;

/**
 * Defines the contract for the riddle progress repository dependency.
 */
interface RiddleProgressRepositoryInterface
{
    /**
     * @param array<int, int> $userIds
     *
     * @return array<int, RiddleProgress>
     */
    public function findByUserIds(array $userIds): array;

    /**
     * Finds matching records for the requested criteria.
     */
    public function findByUserAndRiddle(int $userId, int $riddleId): ?RiddleProgress;

    /**
     * Start.
     */
    public function start(int $userId, int $riddleId): RiddleProgress;

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
    ): array;

    /**
     * Complete.
     */
    public function complete(int $userId, int $riddleId): RiddleProgress;

    /**
     * @param array<int, int> $userIds
     * @param array<int, int> $riddleIds
     *
     * @return array<int, RiddleProgress>
     */
    public function findLatestByUserIdsAndRiddleIds(array $userIds, array $riddleIds): array;

    /**
     * @param array<int, int> $userIds
     * @param array<int, int> $riddleIds
     *
     * @return array<int, array<int, array{submitted: int, correct: int}>>
     */
    public function countLatestAttemptResponsesByUserIdsAndRiddleIds(array $userIds, array $riddleIds): array;

    /**
     * @param array<int, int> $userIds
     * @param array<int, int> $riddleIds
     *
     * @return array<int, array<int, int>>
     */
    public function findBestScoresByUserIdsAndRiddleIds(array $userIds, array $riddleIds): array;
}
