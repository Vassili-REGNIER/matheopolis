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
    public function testRiddleStepForPlayOmitsAnswersAndIncludesHints(): void
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
        self::assertSame('hint', $step['gameParams']['questions'][0]['hint']);
        self::assertArrayNotHasKey('answer', $step['gameParams']['questions'][0]);
    }

    public function testInfoStepMapsSimpleContentFromJson(): void
    {
        $builder = new ScenarioBuilder($this->createMock(RiddleRepositoryInterface::class));
        $step = $builder->infoStep([
            'content' => json_encode([
                'title' => 'Welcome',
                'text' => 'Body',
                'buttonText' => 'Go',
            ], JSON_THROW_ON_ERROR),
            'theme' => 'math',
        ]);

        self::assertSame('info', $step['type']);
        self::assertSame('Welcome', $step['title']);
        self::assertSame('Body', $step['text']);
        self::assertSame('Go', $step['buttonText']);
        self::assertSame('math', $step['theme']);
        self::assertArrayNotHasKey('content', $step);
    }

    public function testInfoStepMapsRichContentDocument(): void
    {
        $builder = new ScenarioBuilder($this->createMock(RiddleRepositoryInterface::class));
        $step = $builder->infoStep([
            'content' => json_encode([
                'id' => 'binary-rules',
                'titre' => 'Règles du jeu',
                'nodes' => [
                    ['type' => 'element', 'tag' => 'p', 'text' => 'Rule body'],
                ],
                'secondaryAction' => [
                    'text' => 'Retour',
                    'targetContentId' => 'binary-rules',
                ],
                'buttonText' => 'Lire le cours',
            ], JSON_THROW_ON_ERROR),
            'theme' => 'default',
        ]);

        self::assertSame('info', $step['type']);
        self::assertSame('binary-rules', $step['content']['id']);
        self::assertSame('Règles du jeu', $step['content']['titre']);
        self::assertCount(1, $step['content']['nodes']);
        self::assertSame('Lire le cours', $step['buttonText']);
        self::assertSame('Retour', $step['secondaryAction']['text']);
        self::assertArrayNotHasKey('title', $step);
        self::assertArrayNotHasKey('theme', $step);
    }

    public function testRiddleStepIncludesIntroTextWhenPresent(): void
    {
        $riddle = new Riddle(1, 10, 2, 'slug', 'TestGame', 'challenge', 'Title', 'Instruction', 'Intro', 'Done.', null);
        $repo = $this->createMock(RiddleRepositoryInterface::class);
        $repo->method('findQuestionsByRiddleId')->willReturn([]);

        $step = (new ScenarioBuilder($repo))->riddleStepForPlay($riddle);

        self::assertSame('Intro', $step['introText']);
    }

    public function testDialogueStepMapsLinesAndSpeaker(): void
    {
        $builder = new ScenarioBuilder($this->createMock(RiddleRepositoryInterface::class));
        $step = $builder->dialogueStep([
            'dialogue' => ['theme' => 'default'],
            'lines' => [
                [
                    'text' => 'Hi',
                    'speaker_id' => 'npc',
                    'emotion' => 'happy',
                    'position' => 'right',
                ],
            ],
        ]);

        self::assertSame('dialogue', $step['type']);
        self::assertSame('npc', $step['lines'][0]['speakerId']);
        self::assertSame('happy', $step['lines'][0]['emotion']);
        self::assertSame('./public/assets/characters/npc-happy.png', $step['lines'][0]['image']);
    }

    public function testDialogueStepUsesNarratorWhenSpeakerMissing(): void
    {
        $builder = new ScenarioBuilder($this->createMock(RiddleRepositoryInterface::class));
        $step = $builder->dialogueStep([
            'dialogue' => ['theme' => 'custom'],
            'lines' => [
                ['text' => 'Once upon a time'],
            ],
        ]);

        self::assertSame('custom', $step['theme']);
        self::assertSame('narrator', $step['lines'][0]['speaker']);
        self::assertArrayNotHasKey('speakerId', $step['lines'][0]);
    }

    public function testRiddleStepMergesGameParamsJsonAndQuestionMetadata(): void
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
            '{"timeLimit":30}',
        );

        $repo = $this->createMock(RiddleRepositoryInterface::class);
        $repo->method('findQuestionsByRiddleId')->willReturn([
            new RiddleQuestion(100, 1, 0, '2+2', 'secret', 'hint', 1, '{"choices":["4","5"]}'),
        ]);

        $step = (new ScenarioBuilder($repo))->riddleStepForPlay($riddle);

        self::assertSame(30, $step['gameParams']['timeLimit']);
        self::assertSame(['4', '5'], $step['gameParams']['questions'][0]['metadata']['choices']);
    }
}
