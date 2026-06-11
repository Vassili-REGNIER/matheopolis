<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Port\ChapterProgressRepositoryInterface;
use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\RiddleProgressRepositoryInterface;
use Matheopolis\Application\Port\RiddleRepositoryInterface;
use Matheopolis\Application\Service\ApiRiddleService;
use Matheopolis\Application\Service\ChapterAccessResolver;
use Matheopolis\Application\Service\ScenarioBuilder;
use Matheopolis\Domain\Chapter;
use Matheopolis\Domain\ChapterProgress;
use Matheopolis\Domain\Riddle;
use Matheopolis\Domain\RiddleProgress;
use Matheopolis\Domain\RiddleQuestion;
use Matheopolis\Domain\User;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Application\Service\ApiRiddleService
 */
final class ApiRiddleServiceTest extends TestCase
{
    /**
     * Verifies the expected behavior.
     */
    public function testStartAllowsPracticeRiddle(): void
    {
        $chapter = new Chapter(1, 'slug', 'Title', null, 1);
        $practice = new Riddle(2, 1, 3, 'practice-r', 'Game', 'practice', 'T', 'I', null, 'Done', null);
        $progress = new RiddleProgress(10, 4, 2, 'in_progress', 0, 0, null, '2026-01-01 00:00:00', null);

        $riddles = $this->createMock(RiddleRepositoryInterface::class);
        $riddles->method('find')->willReturn($practice);

        $chapters = $this->createMock(ChapterRepositoryInterface::class);
        $chapters->method('find')->willReturn($chapter);

        $chapterProgress = $this->createMock(ChapterProgressRepositoryInterface::class);
        $chapterProgress->expects(self::once())->method('start')->with(4, 3)->willReturn(
            new ChapterProgress(1, 4, 3, 'in_progress', 0, null, '2026-01-01 00:00:00', null),
        );

        $riddleProgress = $this->createMock(RiddleProgressRepositoryInterface::class);
        $riddleProgress->method('findByUserAndRiddle')->willReturn(null);
        $riddleProgress->expects(self::once())->method('start')->with(4, 2)->willReturn($progress);

        $classes = $this->createMock(ClassroomRepositoryInterface::class);

        $service = new ApiRiddleService(
            $riddles,
            $riddleProgress,
            $chapters,
            $chapterProgress,
            new ChapterAccessResolver($chapters, $classes),
            new ScenarioBuilder($riddles),
        );

        self::assertSame($progress, $service->start($this->user(4, 'student'), 2));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testSubmitResponseValidatesPracticeRiddle(): void
    {
        $chapter = new Chapter(1, 'slug', 'Title', null, 1);
        $practice = new Riddle(2, 1, 3, 'practice-r', 'Game', 'practice', 'T', 'I', null, 'Done', null);
        $progress = new RiddleProgress(10, 4, 2, 'in_progress', 0, 0, null, '2026-01-01 00:00:00', null);
        $question = new RiddleQuestion(100, 2, 0, '2+2', '4', null, 1, null);
        $updated = new RiddleProgress(10, 4, 2, 'completed', 1, 1, 1, '2026-01-01 00:00:00', '2026-01-01 00:01:00');

        $riddles = $this->createMock(RiddleRepositoryInterface::class);
        $riddles->method('find')->willReturn($practice);
        $riddles->method('findQuestionByRiddleAndIndex')->willReturn($question);
        $riddles->method('findQuestionsByRiddleId')->willReturn([$question]);

        $chapters = $this->createMock(ChapterRepositoryInterface::class);
        $chapters->method('find')->willReturn($chapter);

        $riddleProgress = $this->createMock(RiddleProgressRepositoryInterface::class);
        $riddleProgress->method('findByUserAndRiddle')->willReturn($progress);

        $chapterProgress = $this->createMock(ChapterProgressRepositoryInterface::class);
        $chapterProgress->method('findByUserAndChapter')->willReturn(null);
        $riddles->method('findChallengeByChapterId')->willReturn([]);

        $classes = $this->createMock(ClassroomRepositoryInterface::class);

        $service = new ApiRiddleService(
            $riddles,
            $riddleProgress,
            $chapters,
            $chapterProgress,
            new ChapterAccessResolver($chapters, $classes),
            new ScenarioBuilder($riddles),
        );

        $riddleProgress->expects(self::once())
            ->method('recordResponse')
            ->with(4, 2, 100, 0, '4', true, 1)
            ->willReturn([
                'progress' => $updated,
                'isCorrect' => true,
            ])
        ;

        $result = $service->submitResponse($this->user(4, 'student'), 2, 0, 0, '4');

        self::assertTrue($result['isCorrect']);
        self::assertSame('completed', $result['progress']['status']);
    }

    /**
     * User.
     */
    private function user(int $id, string $role): User
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
            null,
            '2026-01-01 00:00:00',
        );
    }
}
