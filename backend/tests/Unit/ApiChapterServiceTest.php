<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ChapterProgressRepositoryInterface;
use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Application\Port\ScenarioRepositoryInterface;
use Matheopolis\Application\Service\ApiChapterService;
use Matheopolis\Application\Service\ChapterAccessResolver;
use Matheopolis\Domain\Chapter;
use Matheopolis\Domain\ChapterProgress;
use Matheopolis\Domain\User;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Application\Service\ApiChapterService
 */
final class ApiChapterServiceTest extends TestCase
{
    public function testCompleteRejectedWhenScenarioIsNotFinished(): void
    {
        $chapter = new Chapter(1, 'slug', 'Title', null, 1);
        $student = $this->user(3, 'student', 1);
        $progress = new ChapterProgress(10, 3, 1, 'in_progress', 0, 0, null, '2026-01-01 00:00:00', null);

        $chapters = $this->createMock(ChapterRepositoryInterface::class);
        $chapters->method('find')->willReturn($chapter);

        $chapterProgress = $this->createMock(ChapterProgressRepositoryInterface::class);
        $chapterProgress->method('findByUserAndChapter')->willReturn($progress);

        $scenarios = $this->createMock(ScenarioRepositoryInterface::class);
        $scenarios->method('buildPlayScenario')->willReturn(['steps' => [
            ['type' => 'info'],
            ['type' => 'riddle'],
        ]]);

        $service = new ApiChapterService(
            $chapters,
            $chapterProgress,
            new ChapterAccessResolver($chapters),
            $scenarios,
        );

        try {
            $service->complete($student, 1);
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(409, $e->status());
            self::assertSame('CHAPTER_NOT_READY', $e->codeName());
        }
    }

    public function testUpdateProgressRejectsStepJumps(): void
    {
        $chapter = new Chapter(1, 'slug', 'Title', null, 1);
        $student = $this->user(3, 'student', 1);
        $progress = new ChapterProgress(10, 3, 1, 'in_progress', 0, 0, null, '2026-01-01 00:00:00', null);

        $chapters = $this->createMock(ChapterRepositoryInterface::class);
        $chapters->method('find')->willReturn($chapter);

        $chapterProgress = $this->createMock(ChapterProgressRepositoryInterface::class);
        $chapterProgress->method('start')->willReturn($progress);

        $scenarios = $this->createMock(ScenarioRepositoryInterface::class);
        $scenarios->method('buildPlayScenario')->willReturn(['steps' => [
            ['type' => 'info'],
            ['type' => 'riddle'],
            ['type' => 'info'],
        ]]);

        $service = new ApiChapterService(
            $chapters,
            $chapterProgress,
            new ChapterAccessResolver($chapters),
            $scenarios,
        );

        try {
            $service->updateProgress($student, 1, 2, null);
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(409, $e->status());
            self::assertSame('CHAPTER_STEP_OUT_OF_SEQUENCE', $e->codeName());
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
