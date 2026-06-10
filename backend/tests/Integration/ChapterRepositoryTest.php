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
    public function testFindReturnsChapterById(): void
    {
        $narrative = NarrativeFixture::insertChallengeRiddle($this->db, 'find-ch', 'find-r');
        $repository = new ChapterRepository($this->db);

        $chapter = $repository->find($narrative['chapterId']);

        self::assertNotNull($chapter);
        self::assertSame('find-ch', $chapter->getSlug());
    }

    public function testTargetClassUpsertAndDelete(): void
    {
        $teacherId = TestUserFactory::insert($this->db, 'teacher.chapter.repo', 'teacher');
        $otherTeacherId = TestUserFactory::insert($this->db, 'teacher.chapter.repo2', 'teacher');
        $classId = NarrativeFixture::insertClass($this->db, $teacherId, 'CLS-CH-REPO');
        $otherClassId = NarrativeFixture::insertClass($this->db, $otherTeacherId, 'CLS-CH-REPO2');
        $narrative = NarrativeFixture::insertChallengeRiddle($this->db, 'target-ch', 'target-r');
        $repository = new ChapterRepository($this->db);

        $repository->upsertTargetClass($narrative['chapterId'], $classId, false);
        $repository->upsertTargetClass($narrative['chapterId'], $otherClassId, false);

        self::assertSame(
            [['classId' => $classId, 'isActive' => false]],
            $repository->findTargetClassesByChapterId($narrative['chapterId'], $teacherId),
        );

        $repository->deleteTargetClass($narrative['chapterId'], $classId);

        self::assertSame(
            [['classId' => $otherClassId, 'isActive' => false]],
            $repository->findTargetClassesByChapterId($narrative['chapterId']),
        );
    }
}
