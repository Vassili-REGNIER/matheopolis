<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\QuizRepositoryInterface;
use Matheopolis\Domain\Quiz;
use Matheopolis\Domain\User;

/**
 * Represents the quiz access resolver component.
 */
final class QuizAccessResolver
{
    /**
     * Creates a new QuizAccessResolver instance.
     */
    public function __construct(
        private readonly QuizRepositoryInterface $quizzes,
        private readonly ClassroomRepositoryInterface $classes,
    ) {}

    /**
     * @return array<int, Quiz>
     */
    public function listAccessible(User $actor, bool $publicationRequestedOnly = false): array
    {
        if ($publicationRequestedOnly) {
            if ('admin' !== $actor->getRole()) {
                return [];
            }

            return $this->quizzes->findPublicationRequests();
        }

        $items = [];
        foreach ($this->quizzes->findAll() as $quiz) {
            if ($this->canAccess($actor, $quiz)) {
                $items[] = $quiz;
            }
        }

        return $items;
    }

    /**
     * Can access.
     */
    public function canAccess(User $actor, Quiz $quiz): bool
    {
        return match ($actor->getRole()) {
            'admin' => true,
            'teacher' => 'public' === $quiz->getStatus() || $quiz->getCreatorId() === $actor->getId(),
            'student' => $this->canStudentAccess($actor, $quiz),
            'free_user' => 'public' === $quiz->getStatus(),
            default => false,
        };
    }

    /**
     * Can manage quiz.
     */
    public function canManageQuiz(User $actor, Quiz $quiz): bool
    {
        return 'admin' === $actor->getRole()
            || ('teacher' === $actor->getRole() && $quiz->getCreatorId() === $actor->getId());
    }

    /**
     * Can set target class.
     */
    public function canSetTargetClass(User $actor, Quiz $quiz, int $classId, bool $isActive): bool
    {
        $class = $this->classes->find($classId);
        if (null === $class) {
            return false;
        }

        if ('admin' === $actor->getRole()) {
            return true;
        }

        if ('teacher' !== $actor->getRole() || $class->getTeacherId() !== $actor->getId()) {
            return false;
        }

        if (!$isActive) {
            return 'public' === $quiz->getStatus();
        }

        return 'private' === $quiz->getStatus() && $quiz->getCreatorId() === $actor->getId();
    }

    /**
     * Can student access.
     */
    private function canStudentAccess(User $actor, Quiz $quiz): bool
    {
        $classId = $actor->getClassId();
        if (null === $classId) {
            return 'public' === $quiz->getStatus();
        }

        $override = $this->findOverride($quiz->getId(), $classId);
        if ('public' === $quiz->getStatus()) {
            return null === $override || $override;
        }

        return null !== $override && $override;
    }

    /**
     * Finds matching records for the requested criteria.
     */
    private function findOverride(int $quizId, int $classId): ?bool
    {
        foreach ($this->quizzes->findTargetClassesByQuizId($quizId) as $entry) {
            if ($entry['classId'] === $classId) {
                return $entry['isActive'];
            }
        }

        return null;
    }
}
