<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\CryptoInterface;
use Matheopolis\Application\Port\ProgressRepositoryInterface;
use Matheopolis\Application\Port\PuzzleRepositoryInterface;
use Matheopolis\Application\Port\TeacherCodeRepositoryInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Domain\Exception\AuthException;
use Matheopolis\Domain\Puzzle;
use Matheopolis\Domain\Service\ProgressionPolicy;
use Matheopolis\Domain\User;

final class PlatformService
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly ClassroomRepositoryInterface $classrooms,
        private readonly TeacherCodeRepositoryInterface $teacherCodes,
        private readonly PuzzleRepositoryInterface $puzzles,
        private readonly ProgressRepositoryInterface $progress,
        private readonly CryptoInterface $crypto,
        private readonly AuthSessionInterface $auth,
        private readonly ProgressionPolicy $progressionPolicy,
    ) {}

    public function currentUser(): ?User
    {
        $userId = $this->auth->id();
        if (null === $userId) {
            return null;
        }

        return $this->users->find($userId);
    }

    /**
     * @return array<string, mixed>
     */
    public function getDashboardData(User $user): array
    {
        $role = $user->getRole();
        if ('admin' === $role) {
            $teachers = $this->users->findByRole('teacher');
            $students = $this->users->findByRole('student');

            return [
                'role' => 'admin',
                'teacherCodes' => $this->teacherCodes->findAllCodes(),
                'teachersCount' => \count($teachers),
                'studentsCount' => \count($students),
                'puzzlesCount' => \count($this->puzzles->findAll()),
            ];
        }

        if ('teacher' === $role) {
            $classes = $this->classrooms->findByTeacher($user->getId());
            $classIds = array_map(static fn ($class): int => $class->getId(), $classes);
            $students = $this->users->findStudentsByClassIds($classIds);
            $progressEntries = $this->progress->findByStudentIds(
                array_map(static fn (User $student): int => $student->getId(), $students),
            );

            return [
                'role' => 'teacher',
                'classes' => $classes,
                'students' => $students,
                'progressEntries' => $progressEntries,
            ];
        }

        if ('student' === $role) {
            $maxSolvedPosition = $this->progress->getMaxSolvedPuzzlePosition($user->getId());
            $studentProgress = $this->progress->findByStudent($user->getId());

            return [
                'role' => 'student',
                'maxSolvedPosition' => $maxSolvedPosition,
                'studentProgress' => $studentProgress,
                'puzzles' => $this->puzzles->findAll(),
            ];
        }

        return [
            'role' => 'standard',
            'puzzles' => $this->puzzles->findAll(),
        ];
    }

    public function createTeacherCode(User $actor): string
    {
        $this->requireRole($actor, 'admin');

        $code = 'TCH-'.strtoupper(substr(bin2hex(random_bytes(5)), 0, 10));
        $this->teacherCodes->create($code);

        return $code;
    }

    public function createClassroom(User $actor, string $name): void
    {
        $this->requireRole($actor, 'teacher');

        $code = 'CLS-'.strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
        $this->classrooms->insert($name, $code, $actor->getId());
    }

    public function resetStudentPassword(User $actor, int $studentId, string $newPassword): void
    {
        $this->requireRole($actor, 'teacher');
        $student = $this->users->find($studentId);
        if (null === $student || 'student' !== $student->getRole()) {
            throw new AuthException('Student not found.');
        }

        $teacherClasses = $this->classrooms->findByTeacher($actor->getId());
        $allowedClassIds = array_map(static fn ($class): int => $class->getId(), $teacherClasses);
        if (null === $student->getClassId() || !\in_array($student->getClassId(), $allowedClassIds, true)) {
            throw new AuthException('You cannot reset this student password.');
        }

        $this->users->resetPassword($studentId, $this->crypto->hashPassword($newPassword));
    }

    public function createPuzzle(User $actor, string $title, string $statement, int $position): Puzzle
    {
        if (!\in_array($actor->getRole(), ['admin', 'teacher'], true)) {
            throw new AuthException('Only admins and teachers can manage puzzles.');
        }

        $slug = $this->buildSlug($title);

        return $this->puzzles->insert($slug, $title, $statement, $position, true);
    }

    public function solvePuzzle(User $actor, int $puzzleId): void
    {
        $this->requireRole($actor, 'student');

        $puzzle = $this->puzzles->find($puzzleId);
        if (null === $puzzle || !$puzzle->isActive()) {
            throw new AuthException('Puzzle unavailable.');
        }

        $maxSolvedPosition = $this->progress->getMaxSolvedPuzzlePosition($actor->getId());
        if (!$this->progressionPolicy->canAccessPuzzle($puzzle->getPosition(), $maxSolvedPosition)) {
            throw new AuthException('You must solve previous puzzles first.');
        }

        $this->progress->markSolved(
            $actor->getId(),
            $puzzle->getId(),
            $this->progressionPolicy->hintCanBeUnlocked(true),
        );
    }

    private function requireRole(User $user, string $role): void
    {
        if ($user->getRole() !== $role) {
            throw new AuthException('Forbidden action.');
        }
    }

    private function buildSlug(string $title): string
    {
        $slug = strtolower(trim($title));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim((string) $slug, '-');
        if ('' === $slug) {
            $slug = 'puzzle-'.strtolower(bin2hex(random_bytes(3)));
        }

        return $slug;
    }
}
