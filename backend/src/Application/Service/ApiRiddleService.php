<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ChapterProgressRepositoryInterface;
use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Application\Port\RiddleProgressRepositoryInterface;
use Matheopolis\Application\Port\RiddleRepositoryInterface;
use Matheopolis\Domain\Riddle;
use Matheopolis\Domain\RiddleProgress;
use Matheopolis\Domain\RiddleQuestion;
use Matheopolis\Domain\User;

final class ApiRiddleService
{
    public function __construct(
        private readonly RiddleRepositoryInterface $riddles,
        private readonly RiddleProgressRepositoryInterface $progress,
        private readonly ChapterRepositoryInterface $chapters,
        private readonly ChapterProgressRepositoryInterface $chapterProgress,
        private readonly ChapterAccessResolver $chapterAccess,
        private readonly ScenarioBuilder $scenarioBuilder,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function show(User $actor, int $riddleId): array
    {
        $riddle = $this->requireAccessibleRiddle($actor, $riddleId);

        return ApiMapper::riddleDetail($riddle, $this->scenarioBuilder->riddleStepForPlay($riddle));
    }

    public function start(User $actor, int $riddleId): RiddleProgress
    {
        $riddle = $this->requireAccessibleRiddle($actor, $riddleId);
        if ($riddle->isPractice()) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Practice riddles do not support server progression.');
        }

        $existing = $this->progress->findByUserAndRiddle($actor->getId(), $riddleId);
        if (null !== $existing && 'completed' === $existing->getStatus()) {
            throw new ApiException(409, 'RIDDLE_ALREADY_COMPLETED', 'Riddle already completed.');
        }

        $this->chapterProgress->start($actor->getId(), $riddle->getChapterId());

        return $this->progress->start($actor->getId(), $riddleId);
    }

    /**
     * @return array<string, mixed>
     */
    public function getProgress(User $actor, int $riddleId): array
    {
        $this->requireAccessibleRiddle($actor, $riddleId);
        $progress = $this->progress->findByUserAndRiddle($actor->getId(), $riddleId);
        if (null === $progress) {
            return ApiMapper::virtualRiddleProgress($actor->getId(), $riddleId);
        }

        return ApiMapper::riddleProgress($progress);
    }

    /**
     * @return array{isCorrect: bool, progress: array<string, mixed>}
     */
    public function submitResponse(User $actor, int $riddleId, int $questionId, ?int $questionIndex, string $answer): array
    {
        $riddle = $this->requireAccessibleRiddle($actor, $riddleId);
        if ($riddle->isPractice()) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Practice riddles do not accept server responses.');
        }

        $answer = trim($answer);
        if ('' === $answer) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'answer is required.');
        }

        $progress = $this->progress->findByUserAndRiddle($actor->getId(), $riddleId);
        if (null === $progress) {
            throw new ApiException(409, 'RIDDLE_NOT_IN_PROGRESS', 'Riddle not in progress.');
        }
        if ('completed' === $progress->getStatus()) {
            throw new ApiException(409, 'RIDDLE_ALREADY_COMPLETED', 'Riddle already completed.');
        }

        $question = $this->resolveQuestion($riddleId, $questionId, $questionIndex);
        if (null === $question) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid question for this riddle.');
        }
        $questionId = $question->getId();

        if ($question->getOrderIndex() !== $progress->getCurrentQuestionIndex()) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Question is not the current step.');
        }

        $questions = $this->riddles->findQuestionsByRiddleId($riddleId);
        $isCorrect = $this->answersMatch($question->getAnswer(), $answer);

        $result = $this->progress->recordResponse(
            $actor->getId(),
            $riddleId,
            $questionId,
            $answer,
            $isCorrect,
            \count($questions),
        );

        if ('completed' === $result['progress']->getStatus()) {
            $this->tryAutoCompleteChapter($actor, $riddle->getChapterId());
        }

        return [
            'isCorrect' => $isCorrect,
            'progress' => ApiMapper::riddleProgress($result['progress']),
        ];
    }

    private function tryAutoCompleteChapter(User $actor, int $chapterId): void
    {
        foreach ($this->riddles->findChallengeByChapterId($chapterId) as $challenge) {
            $riddleProgress = $this->progress->findByUserAndRiddle($actor->getId(), $challenge->getId());
            if (null === $riddleProgress || 'completed' !== $riddleProgress->getStatus()) {
                return;
            }
        }

        $chapterProgress = $this->chapterProgress->findByUserAndChapter($actor->getId(), $chapterId);
        if (null !== $chapterProgress && 'completed' !== $chapterProgress->getStatus()) {
            $this->chapterProgress->complete($actor->getId(), $chapterId);
        }
    }

    private function requireAccessibleRiddle(User $actor, int $riddleId): Riddle
    {
        $riddle = $this->riddles->find($riddleId);
        if (null === $riddle) {
            throw new ApiException(404, 'NOT_FOUND', 'Riddle not found.');
        }

        $chapter = $this->chapters->find($riddle->getChapterId());
        if (null === $chapter || !$this->chapterAccess->canAccess($actor, $chapter)) {
            throw new ApiException(404, 'NOT_FOUND', 'Riddle not found.');
        }

        return $riddle;
    }

    private function resolveQuestion(int $riddleId, int $questionId, ?int $questionIndex): ?RiddleQuestion
    {
        if ($questionId > 0) {
            $question = $this->riddles->findQuestion($questionId);

            return null !== $question && $question->getRiddleId() === $riddleId ? $question : null;
        }

        if (null === $questionIndex || $questionIndex < 0) {
            return null;
        }

        $question = $this->riddles->findQuestionByRiddleAndIndex($riddleId, $questionIndex);

        return null !== $question && $question->getRiddleId() === $riddleId ? $question : null;
    }

    private function answersMatch(string $expected, string $submitted): bool
    {
        return mb_strtolower(trim($expected)) === mb_strtolower(trim($submitted));
    }
}
