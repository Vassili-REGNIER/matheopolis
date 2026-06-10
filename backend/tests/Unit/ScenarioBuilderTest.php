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
    public function testChallengeRiddleStepForPlayIncludesQuestionMetadataButOmitsAnswers(): void
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
        self::assertSame(100, $step['gameParams']['questions'][0]['id']);
        self::assertSame(0, $step['gameParams']['questions'][0]['questionIndex']);
        self::assertSame('2+2', $step['gameParams']['questions'][0]['question']);
        self::assertSame('hint', $step['gameParams']['questions'][0]['hint']);
        self::assertArrayNotHasKey('answer', $step['gameParams']['questions'][0]);
    }

    public function testPracticeRiddleStepForPlayIncludesAnswers(): void
    {
        $riddle = new Riddle(
            1,
            10,
            2,
            'slug',
            'TestGame',
            'practice',
            'Title',
            'Instruction',
            null,
            'Done.',
            null,
        );

        $repo = $this->createMock(RiddleRepositoryInterface::class);
        $repo->method('findQuestionsByRiddleId')->willReturn([
            new RiddleQuestion(100, 1, 0, '2+2', '4', 'hint', 1, null),
        ]);

        $builder = new ScenarioBuilder($repo);
        $step = $builder->riddleStepForPlay($riddle);

        self::assertSame('4', $step['gameParams']['questions'][0]['answer']);
        self::assertSame('hint', $step['gameParams']['questions'][0]['hint']);
    }

    public function testInfoStepMapsOptionalFields(): void
    {
        $builder = new ScenarioBuilder($this->createMock(RiddleRepositoryInterface::class));
        $step = $builder->infoStep([
            'title' => 'Welcome',
            'text' => 'Body',
            'button_text' => 'Go',
            'theme' => 'math',
        ]);

        self::assertSame('info', $step['type']);
        self::assertSame('Go', $step['buttonText']);
        self::assertSame('math', $step['theme']);
    }

    public function testInfoStepPreservesStructuredContent(): void
    {
        $builder = new ScenarioBuilder($this->createMock(RiddleRepositoryInterface::class));
        $step = $builder->infoStep([
            'content' => json_encode([
                'id' => 'binary-rules',
                'titre' => 'Game rules',
                'nodes' => [
                    [
                        'type' => 'element',
                        'tag' => 'p',
                        'text' => 'Read the course before practicing.',
                    ],
                ],
                'secondaryAction' => [
                    'text' => 'Back to rules',
                    'targetContentId' => 'binary-rules',
                ],
                'buttonText' => 'Read course',
            ], JSON_THROW_ON_ERROR),
            'theme' => 'default',
        ]);

        self::assertSame('info', $step['type']);
        self::assertArrayNotHasKey('title', $step);
        self::assertArrayNotHasKey('text', $step);
        self::assertSame('Read course', $step['buttonText']);
        self::assertSame('Game rules', $step['content']['titre']);
        self::assertSame('binary-rules', $step['content']['id']);
        self::assertSame('Back to rules', $step['secondaryAction']['text']);
        self::assertSame('binary-rules', $step['secondaryAction']['targetContentId']);
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
