<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\RiddleProgress;

interface RiddleProgressRepositoryInterface
{
    /**
     * @param array<int, int> $userIds
     *
     * @return array<int, RiddleProgress>
     */
    public function findByUserIds(array $userIds): array;

    public function findByUserAndRiddle(int $userId, int $riddleId): ?RiddleProgress;

    public function start(int $userId, int $riddleId): RiddleProgress;

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
    ): array;

    public function complete(int $userId, int $riddleId): RiddleProgress;
}
