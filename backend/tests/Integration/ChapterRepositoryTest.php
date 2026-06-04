<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Integration;

use Matheopolis\Infrastructure\Persistence\Repository\ChapterRepository;
use Matheopolis\Tests\Support\Fixture\NarrativeFixture;
use Matheopolis\Tests\Support\Fixture\TestUserFactory;
use Matheopolis\Tests\Support\IntegrationTestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Infrastructure\Persistence\Repository\ChapterRepository
 */
final class ChapterRepositoryTest extends IntegrationTestCase
{
    private ChapterRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new ChapterRepository($this->db);
    }

    public function testFindAllIncludesInsertedChapter(): void
    {
        $narrative = NarrativeFixture::insertChallengeRiddle($this->db, 'repo-chapter', 'repo-riddle');

        $chapters = $this->repository->findAll();

        $ids = array_map(static fn ($c) => $c->getId(), $chapters);
        self::assertContains($narrative['chapterId'], $ids);
    }

    public function testFindTargetClassesForChapter(): void
    {
        $teacherId = TestUserFactory::insert($this->db, 'teacher.chapter', 'teacher');
        $classId = NarrativeFixture::insertClass($this->db, $teacherId);
        $narrative = NarrativeFixture::insertChallengeRiddle($this->db, 'restricted-repo', 'riddle-repo');
        NarrativeFixture::restrictChapterForClass($this->db, $narrative['chapterId'], $classId);

        $targets = $this->repository->findTargetClassesByChapterId($narrative['chapterId']);

        self::assertSame([['classId' => $classId, 'isActive' => false]], $targets);
    }
}
