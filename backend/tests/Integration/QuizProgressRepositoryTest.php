<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Integration;

use Matheopolis\Infrastructure\Persistence\Repository\QuizProgressRepository;
use Matheopolis\Tests\Support\Fixture\QuizFixture;
use Matheopolis\Tests\Support\Fixture\TestUserFactory;
use Matheopolis\Tests\Support\IntegrationTestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Infrastructure\Persistence\Repository\QuizProgressRepository
 */
final class QuizProgressRepositoryTest extends IntegrationTestCase
{
    private QuizProgressRepository $repository;

    /**
     * Updates the up.
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new QuizProgressRepository($this->db);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testStartCreatesInProgressAttempt(): void
    {
        $userId = TestUserFactory::insert($this->db, 'quiz.player', 'student');
        $teacherId = TestUserFactory::insert($this->db, 'quiz.teacher', 'teacher');
        $quiz = QuizFixture::insertQuiz($this->db, $teacherId);

        $progress = $this->repository->start($userId, $quiz['quizId']);

        self::assertSame('in_progress', $progress->getStatus());
        self::assertSame(1, $progress->getAttemptCount());
        self::assertSame(0, $progress->getCurrentQuestionIndex());
    }

    /**
     * Verifies the expected behavior.
     */
    public function testAdvanceAfterAnswerCompletesQuizWithScore(): void
    {
        $userId = TestUserFactory::insert($this->db, 'quiz.player2', 'free_user');
        $teacherId = TestUserFactory::insert($this->db, 'quiz.teacher2', 'teacher');
        $quiz = QuizFixture::insertQuiz($this->db, $teacherId);
        $progress = $this->repository->start($userId, $quiz['quizId']);

        $this->repository->recordAnswer(
            $progress->getId(),
            $quiz['questionIds'][0],
            $progress->getAttemptCount(),
            [$quiz['correctOptionIds'][0]],
        );
        $this->repository->recordAnswer(
            $progress->getId(),
            $quiz['questionIds'][1],
            $progress->getAttemptCount(),
            [$quiz['correctOptionIds'][1]],
        );

        $completed = $this->repository->advanceAfterAnswer($progress->getId(), 2, true, 2);

        self::assertSame('completed', $completed->getStatus());
        self::assertSame(2, $completed->getScore());
    }

    /**
     * Verifies the expected behavior.
     */
    public function testStartNewAttemptResetsIndex(): void
    {
        $userId = TestUserFactory::insert($this->db, 'quiz.player3', 'student');
        $teacherId = TestUserFactory::insert($this->db, 'quiz.teacher3', 'teacher');
        $quiz = QuizFixture::insertQuiz($this->db, $teacherId);
        $first = $this->repository->start($userId, $quiz['quizId']);
        $this->repository->advanceAfterAnswer($first->getId(), 2, true, 2);

        $second = $this->repository->startNewAttempt($userId, $quiz['quizId']);

        self::assertSame('in_progress', $second->getStatus());
        self::assertSame(2, $second->getAttemptCount());
        self::assertSame(0, $second->getCurrentQuestionIndex());
    }
}
