<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Service\ApiMapper;
use Matheopolis\Domain\Chapter;
use Matheopolis\Domain\ChapterProgress;
use Matheopolis\Domain\RiddleProgress;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Application\Service\ApiMapper
 */
final class ApiMapperTest extends TestCase
{
    public function testVirtualChapterProgressUsesNotStarted(): void
    {
        $progress = ApiMapper::virtualChapterProgress(9, 3);

        self::assertSame('not_started', $progress['status']);
        self::assertSame(9, $progress['userId']);
        self::assertSame(3, $progress['chapterId']);
    }

    public function testChapterSummaryShape(): void
    {
        $chapter = new Chapter(1, 'slug', 'Title', 'Statement', 2);
        $summary = ApiMapper::chapterSummary($chapter, null);

        self::assertSame('narrative', $summary['type']);
        self::assertNull($summary['progress']);
    }

    public function testRiddleProgressMapping(): void
    {
        $entity = new RiddleProgress(1, 4, 7, 'in_progress', 2, 3, '2026-01-01 00:00:00', null, '2026-01-02 00:00:00');
        $mapped = ApiMapper::riddleProgress($entity);

        self::assertSame(7, $mapped['riddleId']);
        self::assertSame(2, $mapped['currentQuestionIndex']);
    }

    public function testChapterProgressMapping(): void
    {
        $entity = new ChapterProgress(1, 2, 3, 'completed', '2026-01-01 00:00:00', '2026-01-02 00:00:00');
        $mapped = ApiMapper::chapterProgress($entity);

        self::assertSame('completed', $mapped['status']);
        self::assertSame(3, $mapped['chapterId']);
    }
}
