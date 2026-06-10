<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Integration;

use Matheopolis\Infrastructure\Persistence\Repository\RiddleProgressRepository;
use Matheopolis\Tests\Support\Fixture\NarrativeFixture;
use Matheopolis\Tests\Support\Fixture\TestUserFactory;
use Matheopolis\Tests\Support\IntegrationTestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Infrastructure\Persistence\Repository\RiddleProgressRepository
 */
final class RiddleProgressRepositoryTest extends IntegrationTestCase
{
    private RiddleProgressRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new RiddleProgressRepository($this->db);
    }

    public function testCorrectAnswerAdvancesQuestionIndex(): void
    {
        $userId = TestUserFactory::insert($this->db, 'player.one', 'free_user');
        $narrative = NarrativeFixture::insertChallengeRiddle($this->db);
        $this->repository->start($userId, $narrative['riddleId']);

        $result = $this->repository->recordResponse(
            $userId,
            $narrative['riddleId'],
            $narrative['questionIds'][0],
            0,
            'ans0',
            true,
            2,
        );

        self::assertTrue($result['isCorrect']);
        self::assertSame(1, $result['progress']->getCurrentQuestionIndex());
        self::assertSame('in_progress', $result['progress']->getStatus());
    }

    public function testWrongAnswerKeepsQuestionIndex(): void
    {
        $userId = TestUserFactory::insert($this->db, 'player.two', 'student');
        $narrative = NarrativeFixture::insertChallengeRiddle($this->db, 'chapter-two', 'riddle-two');
        $this->repository->start($userId, $narrative['riddleId']);

        $result = $this->repository->recordResponse(
            $userId,
            $narrative['riddleId'],
            $narrative['questionIds'][0],
            0,
            'wrong',
            false,
            2,
        );

        self::assertFalse($result['isCorrect']);
        self::assertSame(0, $result['progress']->getCurrentQuestionIndex());
        self::assertSame(0, $result['progress']->getScore());
    }

    public function testScoreUsesMistakeBasedPercentage(): void
    {
        $userId = TestUserFactory::insert($this->db, 'player.score', 'student');
        $narrative = NarrativeFixture::insertChallengeRiddle($this->db, 'chapter-score', 'riddle-score');
        $this->repository->start($userId, $narrative['riddleId']);

        $this->repository->recordResponse(
            $userId,
            $narrative['riddleId'],
            $narrative['questionIds'][0],
            0,
            'wrong',
            false,
            2,
        );
        $firstCorrect = $this->repository->recordResponse(
            $userId,
            $narrative['riddleId'],
            $narrative['questionIds'][0],
            0,
            'ans0',
            true,
            2,
        );
        $completed = $this->repository->recordResponse(
            $userId,
            $narrative['riddleId'],
            $narrative['questionIds'][1],
            1,
            'ans1',
            true,
            2,
        );

        self::assertSame(50, $firstCorrect['progress']->getScore());
        self::assertSame('completed', $completed['progress']->getStatus());
        self::assertSame(67, $completed['progress']->getScore());
    }

    public function testEarlierQuestionSubmissionRestartsAttemptAndIncrementsCount(): void
    {
        $userId = TestUserFactory::insert($this->db, 'player.restart', 'student');
        $narrative = NarrativeFixture::insertChallengeRiddle($this->db, 'chapter-restart', 'riddle-restart');
        $this->repository->start($userId, $narrative['riddleId']);

        $this->repository->recordResponse(
            $userId,
            $narrative['riddleId'],
            $narrative['questionIds'][0],
            0,
            'ans0',
            true,
            2,
        );

        $result = $this->repository->recordResponse(
            $userId,
            $narrative['riddleId'],
            $narrative['questionIds'][0],
            0,
            'wrong',
            false,
            2,
        );

        self::assertFalse($result['isCorrect']);
        self::assertSame(0, $result['progress']->getCurrentQuestionIndex());
        self::assertSame(2, $result['progress']->getAttemptCount());
    }

    public function testStartAfterCompletionCreatesNewAttemptRow(): void
    {
        $userId = TestUserFactory::insert($this->db, 'player.retry', 'free_user');
        $narrative = NarrativeFixture::insertChallengeRiddle($this->db, 'chapter-retry', 'riddle-retry');
        $this->repository->start($userId, $narrative['riddleId']);
        $this->repository->recordResponse(
            $userId,
            $narrative['riddleId'],
            $narrative['questionIds'][0],
            0,
            'ans0',
            true,
            2,
        );
        $completed = $this->repository->recordResponse(
            $userId,
            $narrative['riddleId'],
            $narrative['questionIds'][1],
            1,
            'ans1',
            true,
            2,
        );
        self::assertSame('completed', $completed['progress']->getStatus());

        $second = $this->repository->start($userId, $narrative['riddleId']);

        self::assertNotSame($completed['progress']->getId(), $second->getId());
        self::assertSame('in_progress', $second->getStatus());
        self::assertSame(0, $second->getCurrentQuestionIndex());
        self::assertSame($completed['progress']->getAttemptCount() + 1, $second->getAttemptCount());
    }
}
