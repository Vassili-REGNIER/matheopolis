<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\Chapter;

interface ChapterRepositoryInterface
{
    /**
     * @return array<int, Chapter>
     */
    public function findAll(): array;

    public function find(int $id): ?Chapter;

    /**
     * @return array<int, array{classId: int, isActive: bool}>
     */
    public function findTargetClassesByChapterId(int $chapterId): array;
}
