<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Port\RiddleRepositoryInterface;
use Matheopolis\Domain\Riddle;
use Matheopolis\Domain\RiddleQuestion;

final class ScenarioBuilder
{
    public function __construct(
        private readonly RiddleRepositoryInterface $riddles,
    ) {}

    /**
     * @param array<string, mixed> $row
     *
     * @return array<string, mixed>
     */
    public function infoStep(array $row): array
    {
        $content = $this->resolveInfoContent($row);
        $step = [
            'type' => 'info',
            'title' => $content['title'],
            'text' => $content['text'],
        ];

        if (isset($content['buttonText']) && '' !== $content['buttonText']) {
            $step['buttonText'] = $content['buttonText'];
        }
        $theme = $row['theme'] ?? 'default';
        if (\is_string($theme) && 'default' !== $theme) {
            $step['theme'] = $theme;
        }

        return $step;
    }

    /**
     * @param array{dialogue: array<string, mixed>, lines: array<int, array<string, mixed>>} $payload
     *
     * @return array<string, mixed>
     */
    public function dialogueStep(array $payload): array
    {
        $dialogue = $payload['dialogue'];
        $step = [
            'type' => 'dialogue',
            'lines' => [],
        ];

        $theme = $dialogue['theme'] ?? 'default';
        if (\is_string($theme) && 'default' !== $theme) {
            $step['theme'] = $theme;
        }

        foreach ($payload['lines'] as $line) {
            $speakerId = isset($line['speaker_id']) && \is_string($line['speaker_id']) ? $line['speaker_id'] : '';
            $entry = [
                'speaker' => '' !== $speakerId ? $speakerId : 'narrator',
                'text' => $line['text'],
            ];
            if ('' !== $speakerId) {
                $entry['speakerId'] = $speakerId;
                $emotion = isset($line['emotion']) && \is_string($line['emotion']) && '' !== $line['emotion']
                    ? $line['emotion']
                    : 'neutral';
                $entry['image'] = "/assets/characters/{$speakerId}-{$emotion}.png";
            }
            if (isset($line['emotion']) && \is_string($line['emotion']) && '' !== $line['emotion']) {
                $entry['emotion'] = $line['emotion'];
            }
            if (isset($line['position']) && \is_string($line['position']) && '' !== $line['position']) {
                $entry['position'] = $line['position'];
            }
            $step['lines'][] = $entry;
        }

        return $step;
    }

    /**
     * @return array<string, mixed>
     */
    public function riddleStepForPlay(Riddle $riddle): array
    {
        $questions = $this->riddles->findQuestionsByRiddleId($riddle->getId());
        $gameParams = $this->buildGameParams($riddle, $questions);

        $step = [
            'type' => 'riddle',
            'riddleId' => $riddle->getId(),
            'gameId' => $riddle->getGameId(),
            'mode' => $riddle->getMode(),
            'title' => $riddle->getTitle(),
            'instruction' => $riddle->getInstruction(),
            'completionMessage' => $riddle->getCompletionMessage(),
            'gameParams' => $gameParams,
        ];

        if (null !== $riddle->getIntroText()) {
            $step['introText'] = $riddle->getIntroText();
        }

        return $step;
    }

    /**
     * @param array<int, RiddleQuestion> $questions
     *
     * @return array<string, mixed>
     */
    private function buildGameParams(Riddle $riddle, array $questions): array
    {
        $base = $this->decodeGameParamsJson($riddle);

        $playQuestions = [];
        foreach ($questions as $question) {
            $entry = [
                'question' => $question->getPrompt(),
                'difficulty' => $question->getDifficulty(),
            ];
            if (null !== $question->getMetadataJson()) {
                $metadata = json_decode($question->getMetadataJson(), true);
                if (\is_array($metadata)) {
                    $entry['metadata'] = $metadata;
                }
            }
            $playQuestions[] = $entry;
        }

        $base['questions'] = $playQuestions;

        return $base;
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeGameParamsJson(Riddle $riddle): array
    {
        if (null === $riddle->getGameParamsJson()) {
            return [];
        }

        $decoded = json_decode($riddle->getGameParamsJson(), true);
        if (!\is_array($decoded)) {
            return [];
        }

        $params = [];
        foreach ($decoded as $key => $value) {
            if (\is_string($key)) {
                $params[$key] = $value;
            }
        }

        return $params;
    }

    /**
     * @param array<string, mixed> $row
     *
     * @return array{title: string, text: string, buttonText?: string}
     */
    private function resolveInfoContent(array $row): array
    {
        if (isset($row['content'])) {
            $decoded = \is_string($row['content'])
                ? json_decode($row['content'], true)
                : $row['content'];
            if (\is_array($decoded)) {
                return [
                    'title' => isset($decoded['title']) && \is_string($decoded['title']) ? $decoded['title'] : '',
                    'text' => isset($decoded['text']) && \is_string($decoded['text']) ? $decoded['text'] : '',
                    'buttonText' => isset($decoded['buttonText']) && \is_string($decoded['buttonText']) ? $decoded['buttonText'] : '',
                ];
            }
        }

        return [
            'title' => isset($row['title']) && \is_string($row['title']) ? $row['title'] : '',
            'text' => isset($row['text']) && \is_string($row['text']) ? $row['text'] : '',
            'buttonText' => isset($row['button_text']) && \is_string($row['button_text']) ? $row['button_text'] : '',
        ];
    }
}
