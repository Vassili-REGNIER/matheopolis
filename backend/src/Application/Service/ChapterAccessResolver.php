<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Domain\Chapter;
use Matheopolis\Domain\User;

/**
 * Represents the chapter access resolver component.
 */
final class ChapterAccessResolver
{
    /**
     * Creates a new ChapterAccessResolver instance.
     */
    public function __construct(
        private readonly ChapterRepositoryInterface $chapters,
        private readonly ClassroomRepositoryInterface $classes,
    ) {}

    /**
     * @return array<int, Chapter>
     */
    public function listAccessible(?User $actor): array
    {
        $items = [];
        foreach ($this->chapters->findAll() as $chapter) {
            if ($this->canAccess($actor, $chapter)) {
                $items[] = $chapter;
            }
        }

        return $items;
    }

    /**
     * Can access.
     */
    public function canAccess(?User $actor, Chapter $chapter): bool
    {
        if (null === $actor) {
            return true;
        }

        return match ($actor->getRole()) {
            'admin', 'teacher', 'free_user' => true,
            'student' => $this->canStudentAccess($actor, $chapter),
            default => false,
        };
    }

    /**
     * Can set target class.
     */
    public function canSetTargetClass(User $actor, Chapter $chapter, int $classId, bool $isActive): bool
    {
        if ($isActive) {
            return false;
        }

        $class = $this->classes->find($classId);
        if (null === $class) {
            return false;
        }

        if ('admin' === $actor->getRole()) {
            return true;
        }

        return 'teacher' === $actor->getRole() && $class->getTeacherId() === $actor->getId();
    }

    /**
     * Can remove target class.
     */
    public function canRemoveTargetClass(User $actor, int $classId): bool
    {
        $class = $this->classes->find($classId);
        if (null === $class) {
            return false;
        }

        if ('admin' === $actor->getRole()) {
            return true;
        }

        return 'teacher' === $actor->getRole() && $class->getTeacherId() === $actor->getId();
    }

    /**
     * Can student access.
     */
    private function canStudentAccess(User $actor, Chapter $chapter): bool
    {
        $classId = $actor->getClassId();
        if (null === $classId) {
            return true;
        }

        $override = $this->findOverride($chapter->getId(), $classId);

        return null === $override || $override;
    }

    /**
     * Finds matching records for the requested criteria.
     */
    private function findOverride(int $chapterId, int $classId): ?bool
    {
        foreach ($this->chapters->findTargetClassesByChapterId($chapterId) as $entry) {
            if ($entry['classId'] === $classId) {
                return $entry['isActive'];
            }
        }

        return null;
    }
}
