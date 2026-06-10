<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Integration;

use Matheopolis\Infrastructure\Persistence\Repository\ChapterProgressRepository;
use Matheopolis\Tests\Support\Fixture\NarrativeFixture;
use Matheopolis\Tests\Support\Fixture\TestUserFactory;
use Matheopolis\Tests\Support\IntegrationTestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Infrastructure\Persistence\Repository\ChapterProgressRepository
 */
final class ChapterProgressRepositoryTest extends IntegrationTestCase
{
    private ChapterProgressRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new ChapterProgressRepository($this->db);
    }

    public function testStartIsIdempotent(): void
    {
        $userId = TestUserFactory::insert($this->db, 'chapter.player', 'free_user');
        $narrative = NarrativeFixture::insertChallengeRiddle($this->db, 'chapter-a', 'riddle-a');

        $first = $this->repository->start($userId, $narrative['chapterId']);
        $second = $this->repository->start($userId, $narrative['chapterId']);

        self::assertSame($first->getId(), $second->getId());
        self::assertSame('in_progress', $second->getStatus());
    }

    public function testCompleteSetsCompletedAt(): void
    {
        $userId = TestUserFactory::insert($this->db, 'chapter.player2', 'student');
        $narrative = NarrativeFixture::insertChallengeRiddle($this->db, 'chapter-b', 'riddle-b');
        $this->repository->start($userId, $narrative['chapterId']);

        $completed = $this->repository->complete($userId, $narrative['chapterId'], 75);

        self::assertSame('completed', $completed->getStatus());
        self::assertSame(75, $completed->getScore());
        self::assertNotNull($completed->getCompletedAt());
    }

    public function testSyncStepIndexUpdatesResumePoint(): void
    {
        $userId = TestUserFactory::insert($this->db, 'chapter.player3', 'student');
        $narrative = NarrativeFixture::insertChallengeRiddle($this->db, 'chapter-c', 'riddle-c');
        $this->repository->start($userId, $narrative['chapterId']);

        $synced = $this->repository->syncStepIndex($userId, $narrative['chapterId'], 4);

        self::assertSame(4, $synced->getCurrentStepIndex());
        self::assertSame('in_progress', $synced->getStatus());
    }

    public function testStartAfterCompletionRestartsAttempt(): void
    {
        $userId = TestUserFactory::insert($this->db, 'chapter.player4', 'free_user');
        $narrative = NarrativeFixture::insertChallengeRiddle($this->db, 'chapter-d', 'riddle-d');
        $this->repository->start($userId, $narrative['chapterId']);
        $this->repository->syncStepIndex($userId, $narrative['chapterId'], 3);
        $this->repository->complete($userId, $narrative['chapterId']);

        $restarted = $this->repository->start($userId, $narrative['chapterId']);

        self::assertSame('in_progress', $restarted->getStatus());
        self::assertSame(0, $restarted->getCurrentStepIndex());
        self::assertNull($restarted->getCompletedAt());
    }
}
