<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Integration;

use Matheopolis\Application\Service\ScenarioBuilder;
use Matheopolis\Infrastructure\Persistence\Repository\RiddleRepository;
use Matheopolis\Infrastructure\Persistence\Repository\ScenarioRepository;
use Matheopolis\Tests\Support\Fixture\NarrativeFixture;
use Matheopolis\Tests\Support\IntegrationTestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Infrastructure\Persistence\Repository\ScenarioRepository
 */
final class ScenarioRepositoryTest extends IntegrationTestCase
{
    public function testBuildPlayScenarioIncludesRiddleStep(): void
    {
        $narrative = NarrativeFixture::insertChallengeRiddle($this->db);
        $riddles = new RiddleRepository($this->db);
        $builder = new ScenarioBuilder($riddles);
        $repository = new ScenarioRepository($this->db, $riddles, $builder);

        $scenario = $repository->buildPlayScenario($narrative['chapterId']);

        self::assertCount(1, $scenario['steps']);
        self::assertSame('riddle', $scenario['steps'][0]['type']);
        self::assertSame($narrative['riddleId'], $scenario['steps'][0]['riddleId']);
    }

    public function testBuildPlayScenarioHydratesInfoDialogueAndRiddle(): void
    {
        $narrative = NarrativeFixture::insertFullScenarioChapter($this->db);
        $riddles = new RiddleRepository($this->db);
        $builder = new ScenarioBuilder($riddles);
        $repository = new ScenarioRepository($this->db, $riddles, $builder);

        $scenario = $repository->buildPlayScenario($narrative['chapterId']);
        $types = array_column($scenario['steps'], 'type');

        self::assertSame(['info', 'dialogue', 'riddle'], $types);
        self::assertSame('Continue', $scenario['steps'][0]['buttonText'] ?? null);
        self::assertSame('guide', $scenario['steps'][1]['lines'][0]['speakerId'] ?? null);
    }
}
