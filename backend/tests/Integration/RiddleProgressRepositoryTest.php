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
            'wrong',
            false,
            2,
        );

        self::assertFalse($result['isCorrect']);
        self::assertSame(0, $result['progress']->getCurrentQuestionIndex());
    }
}
