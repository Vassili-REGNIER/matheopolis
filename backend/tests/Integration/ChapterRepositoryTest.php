<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Integration;

use Matheopolis\Infrastructure\Persistence\Repository\ChapterRepository;
use Matheopolis\Tests\Support\Fixture\NarrativeFixture;
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
}
