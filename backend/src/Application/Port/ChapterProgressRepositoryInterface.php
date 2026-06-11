<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\ChapterProgress;

/**
 * Defines the contract for the chapter progress repository dependency.
 */
interface ChapterProgressRepositoryInterface
{
    /**
     * Finds matching records for the requested criteria.
     */
    public function findByUserAndChapter(int $userId, int $chapterId): ?ChapterProgress;

    /**
     * Start.
     */
    public function start(int $userId, int $chapterId): ChapterProgress;

    /**
     * Sync step index.
     */
    public function syncStepIndex(int $userId, int $chapterId, int $stepIndex): ChapterProgress;

    /**
     * Complete.
     */
    public function complete(int $userId, int $chapterId, ?int $score = null): ChapterProgress;

    /**
     * @param array<int, int> $userIds
     *
     * @return array<int, ChapterProgress>
     */
    public function findLatestByUserIds(array $userIds): array;
}
