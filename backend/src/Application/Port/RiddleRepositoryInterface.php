<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\Riddle;
use Matheopolis\Domain\RiddleQuestion;

/**
 * Defines the contract for the riddle repository dependency.
 */
interface RiddleRepositoryInterface
{
    /**
     * Finds matching records for the requested criteria.
     */
    public function find(int $id): ?Riddle;

    /**
     * @return array<int, Riddle>
     */
    public function findByChapterId(int $chapterId): array;

    /**
     * @return array<int, Riddle>
     */
    public function findChallengeByChapterId(int $chapterId): array;

    /**
     * @return array<int, RiddleQuestion>
     */
    public function findQuestionsByRiddleId(int $riddleId): array;

    /**
     * Finds matching records for the requested criteria.
     */
    public function findQuestion(int $questionId): ?RiddleQuestion;

    /**
     * Finds matching records for the requested criteria.
     */
    public function findQuestionByRiddleAndIndex(int $riddleId, int $orderIndex): ?RiddleQuestion;
}
