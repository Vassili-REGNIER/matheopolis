<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\Riddle;
use Matheopolis\Domain\RiddleQuestion;

interface RiddleRepositoryInterface
{
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

    public function findQuestion(int $questionId): ?RiddleQuestion;

    public function findQuestionByRiddleAndIndex(int $riddleId, int $orderIndex): ?RiddleQuestion;
}
