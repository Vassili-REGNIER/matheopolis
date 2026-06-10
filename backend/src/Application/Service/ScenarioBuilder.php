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
        ];

        if (isset($content['title']) && \is_string($content['title']) && '' !== $content['title']) {
            $step['title'] = $content['title'];
        }
        if (isset($content['text']) && \is_string($content['text']) && '' !== $content['text']) {
            $step['text'] = $content['text'];
        }
        if (isset($content['buttonText']) && \is_string($content['buttonText']) && '' !== $content['buttonText']) {
            $step['buttonText'] = $content['buttonText'];
        }
        if (isset($content['content'])) {
            $step['content'] = $content['content'];
        }
        if (isset($content['contentCss']) && \is_string($content['contentCss']) && '' !== $content['contentCss']) {
            $step['contentCss'] = $content['contentCss'];
        }
        if (isset($content['secondaryAction'])) {
            $step['secondaryAction'] = $content['secondaryAction'];
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
                'id' => $question->getId(),
                'questionIndex' => $question->getOrderIndex(),
                'question' => $question->getPrompt(),
                'difficulty' => $question->getDifficulty(),
                'hint' => $question->getHint() ?? '',
            ];
            if ('practice' === $riddle->getMode()) {
                $entry['answer'] = $question->getAnswer();
            }
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
     * @return array<string, mixed>
     */
    private function resolveInfoContent(array $row): array
    {
        if (isset($row['content'])) {
            $decoded = \is_string($row['content'])
                ? json_decode($row['content'], true)
                : $row['content'];
            if (\is_array($decoded)) {
                $content = [
                    'title' => isset($decoded['title']) && \is_string($decoded['title']) ? $decoded['title'] : '',
                    'text' => isset($decoded['text']) && \is_string($decoded['text']) ? $decoded['text'] : '',
                    'buttonText' => isset($decoded['buttonText']) && \is_string($decoded['buttonText']) ? $decoded['buttonText'] : '',
                ];

                $structuredContent = $this->extractStructuredInfoContent($decoded);
                if (null !== $structuredContent) {
                    $content['content'] = $structuredContent;
                }

                if (isset($decoded['contentCss']) && \is_string($decoded['contentCss'])) {
                    $content['contentCss'] = $decoded['contentCss'];
                }

                $secondaryAction = $this->normalizeSecondaryAction($decoded['secondaryAction'] ?? null);
                if (null !== $secondaryAction) {
                    $content['secondaryAction'] = $secondaryAction;
                }

                return $content;
            }
        }

        return [
            'title' => isset($row['title']) && \is_string($row['title']) ? $row['title'] : '',
            'text' => isset($row['text']) && \is_string($row['text']) ? $row['text'] : '',
            'buttonText' => isset($row['button_text']) && \is_string($row['button_text']) ? $row['button_text'] : '',
        ];
    }

    /**
     * @param array<int|string, mixed> $decoded
     *
     * @return null|array<int|string, mixed>
     */
    private function extractStructuredInfoContent(array $decoded): ?array
    {
        if ($this->isList($decoded)) {
            return $decoded;
        }

        $document = [];
        foreach (['id', 'titre', 'paragraph', 'nodes', 'styles'] as $key) {
            if (\array_key_exists($key, $decoded)) {
                $document[$key] = $decoded[$key];
            }
        }

        return [] === $document ? null : $document;
    }

    /**
     * @param array<int|string, mixed> $values
     */
    private function isList(array $values): bool
    {
        $expectedKey = 0;
        foreach (array_keys($values) as $key) {
            if ($key !== $expectedKey) {
                return false;
            }
            ++$expectedKey;
        }

        return true;
    }

    /**
     * @return null|array{text: string, targetContentId: int|string}
     */
    private function normalizeSecondaryAction(mixed $value): ?array
    {
        if (!\is_array($value)) {
            return null;
        }

        $text = $value['text'] ?? null;
        $targetContentId = $value['targetContentId'] ?? null;
        if (!\is_string($text) || '' === $text) {
            return null;
        }
        if (!\is_string($targetContentId) && !\is_int($targetContentId)) {
            return null;
        }

        return [
            'text' => $text,
            'targetContentId' => $targetContentId,
        ];
    }
}
