<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Application\Port\RiddleRepositoryInterface;
use Matheopolis\Domain\Riddle;
use Matheopolis\Domain\RiddleQuestion;
use Matheopolis\Domain\User;

final class ApiRiddleService
{
    public function __construct(
        private readonly RiddleRepositoryInterface $riddles,
        private readonly ChapterRepositoryInterface $chapters,
        private readonly ChapterAccessResolver $chapterAccess,
        private readonly ScenarioBuilder $scenarioBuilder,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function show(?User $actor, int $riddleId): array
    {
        $riddle = $this->requireAccessibleRiddle($actor, $riddleId);

        return ApiMapper::riddleDetail($riddle, $this->scenarioBuilder->riddleStepForPlay($riddle));
    }

    /**
     * @return array<string, mixed>
     */
    public function start(User $actor, int $riddleId): array
    {
        $riddle = $this->requireAccessibleRiddle($actor, $riddleId);
        if ($riddle->isPractice()) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Practice riddles do not support server progression.');
        }

        return $this->virtualRiddleProgress($actor->getId(), $riddleId, 'in_progress', 0, 0, null);
    }

    /**
     * @return array<string, mixed>
     */
    public function getProgress(User $actor, int $riddleId): array
    {
        $this->requireAccessibleRiddle($actor, $riddleId);

        return ApiMapper::virtualRiddleProgress($actor->getId(), $riddleId);
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

        $question = $this->resolveQuestion($riddleId, $questionId, $questionIndex);
        if (null === $question) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid question for this riddle.');
        }

        $questions = $this->riddles->findQuestionsByRiddleId($riddleId);
        $isCorrect = $this->answersMatch($question->getAnswer(), $answer);
        $currentQuestionIndex = $question->getOrderIndex();
        $nextQuestionIndex = $isCorrect ? $currentQuestionIndex + 1 : $currentQuestionIndex;
        $completed = $isCorrect && $nextQuestionIndex >= \count($questions);

        return [
            'isCorrect' => $isCorrect,
            'progress' => $this->virtualRiddleProgress(
                $actor->getId(),
                $riddleId,
                $completed ? 'completed' : 'in_progress',
                $nextQuestionIndex,
                1,
                $isCorrect ? $nextQuestionIndex : null,
            ),
        ];
    }

    private function requireAccessibleRiddle(?User $actor, int $riddleId): Riddle
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

    /**
     * @return array<string, mixed>
     */
    private function virtualRiddleProgress(
        int $userId,
        int $riddleId,
        string $status,
        int $currentQuestionIndex,
        int $attemptCount,
        ?int $score,
    ): array {
        return [
            'riddleId' => $riddleId,
            'userId' => $userId,
            'status' => $status,
            'currentQuestionIndex' => $currentQuestionIndex,
            'attemptCount' => $attemptCount,
            'score' => $score,
            'startedAt' => null,
            'completedAt' => null,
        ];
    }
}
