<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Integration;

use Matheopolis\Infrastructure\Persistence\Repository\RiddleRepository;
use Matheopolis\Tests\Support\Fixture\NarrativeFixture;
use Matheopolis\Tests\Support\IntegrationTestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Infrastructure\Persistence\Repository\RiddleRepository
 */
final class RiddleRepositoryTest extends IntegrationTestCase
{
    private RiddleRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new RiddleRepository($this->db);
    }

    public function testFindLoadsChallengeRiddleWithQuestions(): void
    {
        $narrative = NarrativeFixture::insertChallengeRiddle($this->db, 'riddle-repo-ch', 'riddle-repo-r');

        $riddle = $this->repository->find($narrative['riddleId']);
        $questions = $this->repository->findQuestionsByRiddleId($narrative['riddleId']);
        $challenges = $this->repository->findChallengeByChapterId($narrative['chapterId']);

        self::assertNotNull($riddle);
        self::assertSame('challenge', $riddle->getMode());
        self::assertCount(2, $questions);
        self::assertCount(1, $challenges);
    }
}
