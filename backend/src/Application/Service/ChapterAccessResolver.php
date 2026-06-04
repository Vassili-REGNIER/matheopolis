<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Domain\Chapter;
use Matheopolis\Domain\User;

final class ChapterAccessResolver
{
    public function __construct(
        private readonly ChapterRepositoryInterface $chapters,
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

    private function canStudentAccess(User $actor, Chapter $chapter): bool
    {
        $classId = $actor->getClassId();
        if (null === $classId) {
            return true;
        }

        $override = $this->findOverride($chapter->getId(), $classId);

        return null === $override || $override;
    }

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
