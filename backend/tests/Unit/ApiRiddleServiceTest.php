<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ChapterProgressRepositoryInterface;
use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Application\Port\RiddleProgressRepositoryInterface;
use Matheopolis\Application\Port\RiddleRepositoryInterface;
use Matheopolis\Application\Service\ApiRiddleService;
use Matheopolis\Application\Service\ChapterAccessResolver;
use Matheopolis\Application\Service\ScenarioBuilder;
use Matheopolis\Domain\Chapter;
use Matheopolis\Domain\Riddle;
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
            $this->createMock(RiddleProgressRepositoryInterface::class),
            $chapters,
            $this->createMock(ChapterProgressRepositoryInterface::class),
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
