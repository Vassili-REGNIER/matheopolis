<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Application\Port\RiddleRepositoryInterface;
use Matheopolis\Application\Service\ApiRiddleService;
use Matheopolis\Application\Service\ChapterAccessResolver;
use Matheopolis\Application\Service\ScenarioBuilder;
use Matheopolis\Domain\Chapter;
use Matheopolis\Domain\Riddle;
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
    public function testStartRejectsPracticeRiddle(): void
    {
        $chapter = new Chapter(1, 'slug', 'Title', null, 1);
        $practice = new Riddle(2, 1, 3, 'practice-r', 'Game', 'practice', 'T', 'I', null, 'Done', null);

        $riddles = $this->createMock(RiddleRepositoryInterface::class);
        $riddles->method('find')->willReturn($practice);

        $chapters = $this->createMock(ChapterRepositoryInterface::class);
        $chapters->method('find')->willReturn($chapter);

        $service = new ApiRiddleService(
            $riddles,
            $chapters,
            new ChapterAccessResolver($chapters),
            new ScenarioBuilder($riddles),
        );

        try {
            $service->start($this->user(4, 'student'), 2);
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

    public function testSubmitResponseValidatesWithoutPersistedProgress(): void
    {
        $chapter = new Chapter(1, 'slug', 'Title', null, 1);
        $challenge = new Riddle(2, 1, 3, 'challenge-r', 'Game', 'challenge', 'T', 'I', null, 'Done', null);
        $question = new RiddleQuestion(10, 2, 0, '2+2', '4', null, 1, null);

        $riddles = $this->createMock(RiddleRepositoryInterface::class);
        $riddles->method('find')->willReturn($challenge);
        $riddles->method('findQuestionByRiddleAndIndex')->willReturn($question);
        $riddles->method('findQuestionsByRiddleId')->willReturn([$question]);

        $chapters = $this->createMock(ChapterRepositoryInterface::class);
        $chapters->method('find')->willReturn($chapter);

        $service = new ApiRiddleService(
            $riddles,
            $chapters,
            new ChapterAccessResolver($chapters),
            new ScenarioBuilder($riddles),
        );

        $result = $service->submitResponse($this->user(4, 'student'), 2, 0, 0, '4');

        self::assertTrue($result['isCorrect']);
        self::assertSame('completed', $result['progress']['status']);
        self::assertSame(1, $result['progress']['currentQuestionIndex']);
        self::assertNull($result['progress']['startedAt']);
    }

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
