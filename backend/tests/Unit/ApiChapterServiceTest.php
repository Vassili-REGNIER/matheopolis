<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ChapterProgressRepositoryInterface;
use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\RiddleProgressRepositoryInterface;
use Matheopolis\Application\Port\RiddleRepositoryInterface;
use Matheopolis\Application\Port\ScenarioRepositoryInterface;
use Matheopolis\Application\Service\ApiChapterService;
use Matheopolis\Application\Service\ChapterAccessResolver;
use Matheopolis\Domain\Chapter;
use Matheopolis\Domain\ChapterProgress;
use Matheopolis\Domain\Riddle;
use Matheopolis\Domain\User;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Application\Service\ApiChapterService
 */
final class ApiChapterServiceTest extends TestCase
{
    public function testCompleteRejectedWhenChallengeRiddleNotDone(): void
    {
        $chapter = new Chapter(1, 'slug', 'Title', null, 1);
        $student = $this->user(3, 'student', 1);
        $progress = new ChapterProgress(10, 3, 1, 'in_progress', 0, null, '2026-01-01 00:00:00', null);
        $challenge = new Riddle(5, 1, 2, 'riddle', 'Game', 'challenge', 'T', 'I', null, 'Done', null);

        $chapters = $this->createMock(ChapterRepositoryInterface::class);
        $chapters->method('find')->willReturn($chapter);

        $chapterProgress = $this->createMock(ChapterProgressRepositoryInterface::class);
        $chapterProgress->method('findByUserAndChapter')->willReturn($progress);

        $riddles = $this->createMock(RiddleRepositoryInterface::class);
        $riddles->method('findChallengeByChapterId')->willReturn([$challenge]);

        $riddleProgress = $this->createMock(RiddleProgressRepositoryInterface::class);
        $riddleProgress->method('findByUserAndRiddle')->willReturn(null);

        $classes = $this->createMock(ClassroomRepositoryInterface::class);

        $service = new ApiChapterService(
            $chapters,
            $chapterProgress,
            $riddles,
            $riddleProgress,
            new ChapterAccessResolver($chapters, $classes),
            $this->createMock(ScenarioRepositoryInterface::class),
        );

        try {
            $service->complete($student, 1);
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(409, $e->status());
            self::assertSame('CHAPTER_NOT_READY', $e->codeName());
        }
    }

    private function user(int $id, string $role, ?int $classId): User
    {
        return new User(
            $id,
            'First',
            'Last',
            'user'.$id,
            'hash',
            $role,
            null,
            null,
            $classId,
            null,
            '2026-01-01 00:00:00',
        );
    }
}
