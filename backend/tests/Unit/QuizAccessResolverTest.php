<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\QuizRepositoryInterface;
use Matheopolis\Application\Service\QuizAccessResolver;
use Matheopolis\Domain\ClassEntity;
use Matheopolis\Domain\Quiz;
use Matheopolis\Domain\User;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Application\Service\QuizAccessResolver
 */
final class QuizAccessResolverTest extends TestCase
{
    public function testAdminCanAccessAnyQuiz(): void
    {
        $resolver = $this->resolver([], []);
        $quiz = $this->quiz(1, 99, 'private');
        $admin = $this->user(1, 'admin', null);

        self::assertTrue($resolver->canAccess($admin, $quiz));
    }

    public function testStudentSeesPublicQuizUnlessRestrictedForClass(): void
    {
        $quiz = $this->quiz(5, 2, 'public');
        $student = $this->user(6, 'student', 1);
        $resolver = $this->resolver(
            [$quiz],
            [['classId' => 1, 'isActive' => false]],
        );

        self::assertFalse($resolver->canAccess($student, $quiz));
    }

    public function testStudentSeesPrivateQuizWhenGrantedForClass(): void
    {
        $quiz = $this->quiz(7, 2, 'private');
        $student = $this->user(6, 'student', 1);
        $resolver = $this->resolver(
            [$quiz],
            [['classId' => 1, 'isActive' => true]],
        );

        self::assertTrue($resolver->canAccess($student, $quiz));
    }

    public function testTeacherCanManageOwnPrivateQuizOnly(): void
    {
        $resolver = $this->resolver([], []);
        $teacher = $this->user(2, 'teacher', null);
        $own = $this->quiz(1, 2, 'private');
        $other = $this->quiz(2, 3, 'private');

        self::assertTrue($resolver->canManageQuiz($teacher, $own));
        self::assertFalse($resolver->canManageQuiz($teacher, $other));
    }

    /**
     * @param array<int, Quiz>                                $quizzes
     * @param array<int, array{classId: int, isActive: bool}> $targetClasses
     */
    private function resolver(array $quizzes, array $targetClasses): QuizAccessResolver
    {
        $quizRepo = $this->createMock(QuizRepositoryInterface::class);
        $quizRepo->method('findAll')->willReturn($quizzes);
        $quizRepo->method('findTargetClassesByQuizId')->willReturn($targetClasses);

        $classRepo = $this->createMock(ClassroomRepositoryInterface::class);
        $classRepo->method('find')->willReturn(new ClassEntity(
            1,
            'Class 6A',
            null,
            'CLS-TEST',
            2,
            'grade_6',
        ));

        return new QuizAccessResolver($quizRepo, $classRepo);
    }

    private function quiz(int $id, int $creatorId, string $status): Quiz
    {
        return new Quiz($id, 'Quiz', null, $creatorId, $status, false, 0);
    }

    private function user(int $id, string $role, ?int $classId): User
    {
        return new User(
            $id,
            'First',
            'Last',
            'user'.$id,
            'hash',
            $role,
            null,
            $classId,
            null,
            '2026-01-01 00:00:00',
        );
    }
}
