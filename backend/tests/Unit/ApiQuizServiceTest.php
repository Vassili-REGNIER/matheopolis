<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\QuizProgressRepositoryInterface;
use Matheopolis\Application\Port\QuizRepositoryInterface;
use Matheopolis\Application\Service\ApiQuizService;
use Matheopolis\Application\Service\QuizAccessResolver;
use Matheopolis\Domain\Quiz;
use Matheopolis\Domain\QuizOption;
use Matheopolis\Domain\QuizQuestion;
use Matheopolis\Domain\QuizProgress;
use Matheopolis\Domain\User;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Application\Service\ApiQuizService
 */
final class ApiQuizServiceTest extends TestCase
{
    public function testCreateRejectsEmptyTitle(): void
    {
        $service = $this->service([], []);
        $teacher = $this->user(2, 'teacher');

        try {
            $service->create($teacher, '   ', null, null, []);
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

    public function testSubmitResponseScoresCompletedAttempt(): void
    {
        $quiz = new Quiz(1, 'Quiz', null, 2, 'public', false, 0);
        $q1 = new QuizQuestion(10, 1, 'Q1', 0, 'radio', [
            new QuizOption(100, 10, 'A', true),
            new QuizOption(101, 10, 'B', false),
        ]);
        $q2 = new QuizQuestion(11, 1, 'Q2', 1, 'radio', [
            new QuizOption(110, 11, 'C', true),
            new QuizOption(111, 11, 'D', false),
        ]);
        $inProgress = new QuizProgress(5, 6, 1, 'in_progress', 1, 0, null, null, '2026-01-01 00:00:00', null);
        $afterFirst = new QuizProgress(5, 6, 1, 'in_progress', 1, 1, null, null, '2026-01-01 00:00:00', null);
        $completed = new QuizProgress(5, 6, 1, 'completed', 1, 2, 2, 2, '2026-01-01 00:00:00', '2026-01-01 00:01:00');

        $quizzes = $this->createMock(QuizRepositoryInterface::class);
        $quizzes->method('find')->willReturn($quiz);
        $quizzes->method('findQuestionsByQuizId')->willReturn([$q1, $q2]);

        $progressRepo = $this->createMock(QuizProgressRepositoryInterface::class);
        $progressRepo->method('findByUserAndQuiz')->willReturnOnConsecutiveCalls($inProgress, $afterFirst);
        $progressRepo->method('recordAnswer');
        $progressRepo->method('selectedOptionIdsByQuestion')->willReturnOnConsecutiveCalls(
            [10 => [100]],
            [10 => [100], 11 => [110]],
        );
        $progressRepo->method('advanceAfterAnswer')->willReturnOnConsecutiveCalls($afterFirst, $completed);

        $service = new ApiQuizService(
            $quizzes,
            $progressRepo,
            new QuizAccessResolver($quizzes, $this->createMock(ClassroomRepositoryInterface::class)),
            $this->createMock(ClassroomRepositoryInterface::class),
        );

        $student = $this->user(6, 'student', 1);
        $result = $service->submitResponse($student, 1, 10, [100]);
        self::assertSame('in_progress', $result->getStatus());

        $result2 = $service->submitResponse($student, 1, 11, [110]);
        self::assertSame('completed', $result2->getStatus());
        self::assertSame(2, $result2->getLastScore());
    }

    public function testTeacherCannotChangeQuizStatusOnUpdate(): void
    {
        $quiz = new Quiz(3, 'Quiz', null, 2, 'private', false, 0);
        $quizzes = $this->createMock(QuizRepositoryInterface::class);
        $quizzes->method('find')->willReturn($quiz);

        $service = new ApiQuizService(
            $quizzes,
            $this->createMock(QuizProgressRepositoryInterface::class),
            new QuizAccessResolver($quizzes, $this->createMock(ClassroomRepositoryInterface::class)),
            $this->createMock(ClassroomRepositoryInterface::class),
        );

        try {
            $service->update($this->user(2, 'teacher'), 3, null, null, 'public', null);
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(403, $e->status());
        }
    }

    public function testTeacherCanRequestPublicationOnPrivateQuiz(): void
    {
        $quiz = new Quiz(3, 'Quiz', null, 2, 'private', false, 0);
        $updated = new Quiz(3, 'Quiz', null, 2, 'private', true, 0);

        $quizzes = $this->createMock(QuizRepositoryInterface::class);
        $quizzes->method('find')->willReturn($quiz);
        $quizzes->method('update')->willReturn($updated);

        $service = new ApiQuizService(
            $quizzes,
            $this->createMock(QuizProgressRepositoryInterface::class),
            new QuizAccessResolver($quizzes, $this->createMock(ClassroomRepositoryInterface::class)),
            $this->createMock(ClassroomRepositoryInterface::class),
        );

        $result = $service->update($this->user(2, 'teacher'), 3, null, null, null, true);
        self::assertTrue($result->isAskAdmin());
    }

    public function testDeleteQuestionDeniedForOtherTeacher(): void
    {
        $quiz = new Quiz(4, 'Quiz', null, 99, 'private', false, 0);
        $question = new QuizQuestion(20, 4, 'Q', 0, 'radio', [
            new QuizOption(200, 20, 'A', true),
            new QuizOption(201, 20, 'B', false),
        ]);

        $quizzes = $this->createMock(QuizRepositoryInterface::class);
        $quizzes->method('find')->willReturn($quiz);
        $quizzes->method('findQuestionById')->willReturn($question);

        $service = new ApiQuizService(
            $quizzes,
            $this->createMock(QuizProgressRepositoryInterface::class),
            new QuizAccessResolver($quizzes, $this->createMock(ClassroomRepositoryInterface::class)),
            $this->createMock(ClassroomRepositoryInterface::class),
        );

        try {
            $service->deleteQuestion($this->user(2, 'teacher'), 4, 20);
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(403, $e->status());
        }
    }

    public function testAdminPublishClearsAskAdminFlag(): void
    {
        $quiz = new Quiz(5, 'Quiz', null, 2, 'private', true, 0);
        $published = new Quiz(5, 'Quiz', null, 2, 'public', false, 0);

        $quizzes = $this->createMock(QuizRepositoryInterface::class);
        $quizzes->method('find')->willReturn($quiz);
        $quizzes->method('update')->willReturn($published);

        $service = new ApiQuizService(
            $quizzes,
            $this->createMock(QuizProgressRepositoryInterface::class),
            new QuizAccessResolver($quizzes, $this->createMock(ClassroomRepositoryInterface::class)),
            $this->createMock(ClassroomRepositoryInterface::class),
        );

        $result = $service->update($this->user(1, 'admin'), 5, null, null, 'public', null);
        self::assertSame('public', $result->getStatus());
        self::assertFalse($result->isAskAdmin());
    }

    public function testStartAttemptRejectsWhenAlreadyInProgress(): void
    {
        $quiz = new Quiz(1, 'Quiz', null, 2, 'public', false, 0);
        $progress = new QuizProgress(5, 6, 1, 'in_progress', 1, 0, null, null, '2026-01-01 00:00:00', null);

        $quizzes = $this->createMock(QuizRepositoryInterface::class);
        $quizzes->method('find')->willReturn($quiz);

        $progressRepo = $this->createMock(QuizProgressRepositoryInterface::class);
        $progressRepo->method('findByUserAndQuiz')->willReturn($progress);

        $service = new ApiQuizService(
            $quizzes,
            $progressRepo,
            new QuizAccessResolver($quizzes, $this->createMock(ClassroomRepositoryInterface::class)),
            $this->createMock(ClassroomRepositoryInterface::class),
        );

        try {
            $service->startAttempt($this->user(6, 'student', 1), 1);
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(409, $e->status());
        }
    }

    public function testGetCorrectionRequiresCompletedAttempt(): void
    {
        $quiz = new Quiz(1, 'Quiz', null, 2, 'public', false, 0);
        $progress = new QuizProgress(5, 6, 1, 'in_progress', 1, 0, null, null, '2026-01-01 00:00:00', null);

        $quizzes = $this->createMock(QuizRepositoryInterface::class);
        $quizzes->method('find')->willReturn($quiz);

        $progressRepo = $this->createMock(QuizProgressRepositoryInterface::class);
        $progressRepo->method('findByUserAndQuiz')->willReturn($progress);

        $service = new ApiQuizService(
            $quizzes,
            $progressRepo,
            new QuizAccessResolver($quizzes, $this->createMock(ClassroomRepositoryInterface::class)),
            $this->createMock(ClassroomRepositoryInterface::class),
        );

        try {
            $service->getCorrection($this->user(6, 'student', 1), 1);
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(409, $e->status());
        }
    }

    /**
     * @param array<int, Quiz> $accessible
     */
    private function service(array $accessible, array $targetClasses): ApiQuizService
    {
        $quizzes = $this->createMock(QuizRepositoryInterface::class);
        $quizzes->method('findAll')->willReturn($accessible);
        $quizzes->method('findTargetClassesByQuizId')->willReturn($targetClasses);

        return new ApiQuizService(
            $quizzes,
            $this->createMock(QuizProgressRepositoryInterface::class),
            new QuizAccessResolver($quizzes, $this->createMock(ClassroomRepositoryInterface::class)),
            $this->createMock(ClassroomRepositoryInterface::class),
        );
    }

    private function user(int $id, string $role, ?int $classId = null): User
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
