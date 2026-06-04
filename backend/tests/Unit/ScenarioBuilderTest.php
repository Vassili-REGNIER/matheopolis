<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Port\RiddleRepositoryInterface;
use Matheopolis\Application\Service\ScenarioBuilder;
use Matheopolis\Domain\Riddle;
use Matheopolis\Domain\RiddleQuestion;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Application\Service\ScenarioBuilder
 */
final class ScenarioBuilderTest extends TestCase
{
    public function testRiddleStepForPlayOmitsAnswers(): void
    {
        $riddle = new Riddle(
            1,
            10,
            2,
            'slug',
            'TestGame',
            'challenge',
            'Title',
            'Instruction',
            null,
            'Done.',
            null,
        );

        $repo = $this->createMock(RiddleRepositoryInterface::class);
        $repo->method('findQuestionsByRiddleId')->willReturn([
            new RiddleQuestion(100, 1, 0, '2+2', 'secret', 'hint', 1, null),
        ]);

        $builder = new ScenarioBuilder($repo);
        $step = $builder->riddleStepForPlay($riddle);

        self::assertSame('riddle', $step['type']);
        self::assertSame(1, $step['riddleId']);
        self::assertArrayHasKey('questions', $step['gameParams']);
        self::assertSame('2+2', $step['gameParams']['questions'][0]['question']);
        self::assertArrayNotHasKey('answer', $step['gameParams']['questions'][0]);
    }
}
