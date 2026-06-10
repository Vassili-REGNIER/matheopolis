<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\ChapterProgress;

interface ChapterProgressRepositoryInterface
{
    public function findByUserAndChapter(int $userId, int $chapterId): ?ChapterProgress;

    public function start(int $userId, int $chapterId): ChapterProgress;

    public function syncStepIndex(int $userId, int $chapterId, int $stepIndex): ChapterProgress;

    public function complete(int $userId, int $chapterId, ?int $score = null): ChapterProgress;

    /**
     * @param array<int, int> $userIds
     *
     * @return array<int, ChapterProgress>
     */
    public function findLatestByUserIds(array $userIds): array;
}
