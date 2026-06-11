<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\Chapter;

/**
 * Defines the contract for the chapter repository dependency.
 */
interface ChapterRepositoryInterface
{
    /**
     * @return array<int, Chapter>
     */
    public function findAll(): array;

    /**
     * Finds matching records for the requested criteria.
     */
    public function find(int $id): ?Chapter;

    /**
     * @return array<int, array{classId: int, isActive: bool}>
     */
    public function findTargetClassesByChapterId(int $chapterId, ?int $teacherId = null): array;

    /**
     * Upsert target class.
     */
    public function upsertTargetClass(int $chapterId, int $classId, bool $isActive): void;

    /**
     * Deletes the requested resource.
     */
    public function deleteTargetClass(int $chapterId, int $classId): void;
}
