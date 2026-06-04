<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\QuizProgressRepositoryInterface;
use Matheopolis\Application\Port\QuizRepositoryInterface;
use Matheopolis\Domain\Quiz;
use Matheopolis\Domain\QuizProgress;
use Matheopolis\Domain\QuizQuestion;
use Matheopolis\Domain\User;

final class ApiQuizService
{
    public function __construct(
        private readonly QuizRepositoryInterface $quizzes,
        private readonly QuizProgressRepositoryInterface $progress,
        private readonly QuizAccessResolver $access,
        private readonly ClassroomRepositoryInterface $classes,
    ) {}

    /**
     * @return array<int, array{quiz: Quiz, progress: ?QuizProgress}>
     */
    public function listSummaries(User $actor, bool $publicationRequestedOnly = false): array
    {
        $items = [];
        foreach ($this->access->listAccessible($actor, $publicationRequestedOnly) as $quiz) {
            $items[] = [
                'quiz' => $quiz,
                'progress' => $this->progress->findByUserAndQuiz($actor->getId(), $quiz->getId()),
            ];
        }

        return $items;
    }

    public function getPlayView(User $actor, int $quizId): Quiz
    {
        $quiz = $this->requireAccessibleQuiz($actor, $quizId);

        return $quiz;
    }

    public function getProgress(User $actor, int $quizId): QuizProgress|array
    {
        $this->requireAccessibleQuiz($actor, $quizId);
        $progress = $this->progress->findByUserAndQuiz($actor->getId(), $quizId);
        if (null === $progress) {
            return $this->virtualNotStarted($actor->getId(), $quizId);
        }

        return $progress;
    }

    public function startAttempt(User $actor, int $quizId): QuizProgress
    {
        $this->requireAccessibleQuiz($actor, $quizId);
        $existing = $this->progress->findByUserAndQuiz($actor->getId(), $quizId);
        if (null !== $existing && 'in_progress' === $existing->getStatus()) {
            throw new ApiException(409, 'QUIZ_ATTEMPT_IN_PROGRESS', 'An attempt is already in progress.');
        }

        if (null === $existing) {
            return $this->progress->start($actor->getId(), $quizId);
        }

        return $this->progress->startNewAttempt($actor->getId(), $quizId);
    }

    /**
     * @param array<int, int> $optionIds
     */
    public function submitResponse(User $actor, int $quizId, int $questionId, array $optionIds): QuizProgress
    {
        $this->requireAccessibleQuiz($actor, $quizId);
        $questions = $this->quizzes->findQuestionsByQuizId($quizId, true);
        if ([] === $questions) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Quiz has no questions.');
        }

        $question = $this->findQuestionInList($questions, $questionId);
        if (null === $question) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Question does not belong to this quiz.');
        }

        $this->validateOptionSelection($question, $optionIds);

        $progress = $this->progress->findByUserAndQuiz($actor->getId(), $quizId);
        if (null === $progress) {
            $progress = $this->progress->start($actor->getId(), $quizId);
        }

        if ('completed' === $progress->getStatus()) {
            throw new ApiException(409, 'QUIZ_ATTEMPT_NOT_IN_PROGRESS', 'No attempt in progress.');
        }

        $ordered = $this->orderedQuestionIds($questions);
        $expectedQuestionId = $ordered[$progress->getCurrentQuestionIndex()] ?? null;
        if ($expectedQuestionId !== $questionId) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Questions must be answered in order.');
        }

        $this->progress->recordAnswer(
            $progress->getId(),
            $questionId,
            $progress->getAttemptCount(),
            $optionIds,
        );

        $nextIndex = $progress->getCurrentQuestionIndex() + 1;
        $completed = $nextIndex >= \count($ordered);
        $score = null;
        if ($completed) {
            $score = $this->scoreAttempt($questions, $this->progress->selectedOptionIdsByQuestion(
                $progress->getId(),
                $progress->getAttemptCount(),
            ));
        }

        return $this->progress->advanceAfterAnswer($progress->getId(), $nextIndex, $completed, $score);
    }

    /**
     * @return array{quiz: Quiz, attempt: array<string, mixed>, questions: array<int, array<string, mixed>>}
     */
    public function getCorrection(User $actor, int $quizId, ?int $attemptNumber = null): array
    {
        $quiz = $this->requireAccessibleQuiz($actor, $quizId);
        $progress = $this->progress->findByUserAndQuiz($actor->getId(), $quizId);
        if (null === $progress || 'completed' !== $progress->getStatus()) {
            throw new ApiException(409, 'QUIZ_ATTEMPT_NOT_COMPLETED', 'No completed attempt available.');
        }

        $attempt = $attemptNumber ?? $progress->getAttemptCount();
        if ($attempt < 1 || $attempt > $progress->getAttemptCount()) {
            throw new ApiException(404, 'NOT_FOUND', 'Attempt not found.');
        }

        $questions = $this->quizzes->findQuestionsByQuizId($quizId, true);
        $selected = $this->progress->selectedOptionIdsByQuestion($progress->getId(), $attempt);
        $total = \count($questions);
        $correctCount = 0;
        $payloadQuestions = [];

        foreach ($questions as $question) {
            $selectedIds = $selected[$question->getId()] ?? [];
            $isCorrect = $this->isQuestionCorrect($question, $selectedIds);
            if ($isCorrect) {
                ++$correctCount;
            }

            $payloadQuestions[] = [
                'question' => $question,
                'selectedOptionIds' => $selectedIds,
                'isCorrect' => $isCorrect,
            ];
        }

        return [
            'quiz' => $quiz,
            'attempt' => [
                'number' => $attempt,
                'completedAt' => $progress->getCompletedAt(),
                'score' => $correctCount,
                'total' => $total,
            ],
            'questions' => $payloadQuestions,
        ];
    }

    /**
     * @param array<int, array{label: string, type: string, orderIndex: int, options: array<int, array{label: string, isCorrect: bool}>}> $questions
     */
    public function create(User $actor, string $title, ?string $description, ?string $status, array $questions): Quiz
    {
        $title = trim($title);
        if ('' === $title || mb_strlen($title) > 255) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid quiz title.');
        }

        $description = null !== $description ? trim($description) : null;
        if (null !== $description && mb_strlen($description) > 5000) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Quiz description is too long.');
        }

        $resolvedStatus = $this->resolveCreateStatus($actor, $status);
        foreach ($questions as $question) {
            $this->validateQuestionInput($question);
        }

        return $this->quizzes->insert($title, $description, $actor->getId(), $resolvedStatus, $questions);
    }

    public function update(User $actor, int $quizId, ?string $title, ?string $description, ?string $status, ?bool $askAdmin): Quiz
    {
        $quiz = $this->requireQuiz($quizId);
        $this->assertCanManage($actor, $quiz);

        if ('teacher' === $actor->getRole()) {
            if (null !== $status) {
                throw new ApiException(403, 'ACCESS_DENIED', 'Teachers cannot change quiz status.');
            }
            if (true === $askAdmin && 'private' !== $quiz->getStatus()) {
                throw new ApiException(422, 'VALIDATION_ERROR', 'Publication can only be requested for private quizzes.');
            }
        }

        if ('admin' === $actor->getRole() && 'public' === $status && 'public' === $quiz->getStatus()) {
            throw new ApiException(409, 'QUIZ_ALREADY_PUBLIC', 'Quiz is already public.');
        }

        if (null !== $title) {
            $title = trim($title);
            if ('' === $title || mb_strlen($title) > 255) {
                throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid quiz title.');
            }
        }

        $resolvedStatus = $status;
        $resolvedAskAdmin = $askAdmin;
        if ('admin' === $actor->getRole() && 'public' === $status) {
            $resolvedAskAdmin = false;
        }

        $updated = $this->quizzes->update($quizId, $title, $description, $resolvedStatus, $resolvedAskAdmin);
        if (null === $updated) {
            throw new ApiException(404, 'NOT_FOUND', 'Quiz not found.');
        }

        return $updated;
    }

    public function delete(User $actor, int $quizId): void
    {
        $quiz = $this->requireQuiz($quizId);
        $this->assertCanManage($actor, $quiz);
        $this->quizzes->delete($quizId);
    }

    /**
     * @param array<int, array{label: string, isCorrect: bool}> $options
     */
    public function addQuestion(User $actor, int $quizId, string $label, string $type, int $orderIndex, array $options): QuizQuestion
    {
        $quiz = $this->requireQuiz($quizId);
        $this->assertCanManage($actor, $quiz);

        $this->validateQuestionInput([
            'label' => $label,
            'type' => $type,
            'orderIndex' => $orderIndex,
            'options' => $options,
        ]);

        return $this->quizzes->insertQuestion($quizId, trim($label), $type, $orderIndex, $options);
    }

    /**
     * @param array<int, array{label: string, isCorrect: bool}>|null $options
     */
    public function updateQuestion(
        User $actor,
        int $quizId,
        int $questionId,
        ?string $label,
        ?string $type,
        ?int $orderIndex,
        ?array $options,
    ): QuizQuestion {
        $quiz = $this->requireQuiz($quizId);
        $this->assertCanManage($actor, $quiz);

        $question = $this->quizzes->findQuestionById($questionId);
        if (null === $question || $question->getQuizId() !== $quizId) {
            throw new ApiException(404, 'NOT_FOUND', 'Question not found.');
        }

        if (null !== $options) {
            $this->validateQuestionInput([
                'label' => $label ?? $question->getLabel(),
                'type' => $type ?? $question->getType(),
                'orderIndex' => $orderIndex ?? $question->getOrderIndex(),
                'options' => $options,
            ]);
        }

        $updated = $this->quizzes->updateQuestion($questionId, $label, $type, $orderIndex, $options);
        if (null === $updated) {
            throw new ApiException(404, 'NOT_FOUND', 'Question not found.');
        }

        return $updated;
    }

    public function deleteQuestion(User $actor, int $quizId, int $questionId): void
    {
        $quiz = $this->requireQuiz($quizId);
        $this->assertCanManage($actor, $quiz);

        $question = $this->quizzes->findQuestionById($questionId);
        if (null === $question || $question->getQuizId() !== $quizId) {
            throw new ApiException(404, 'NOT_FOUND', 'Question not found.');
        }

        $this->quizzes->deleteQuestion($questionId);
    }

    /**
     * @return array<int, array{classId: int, isActive: bool}>
     */
    public function listTargetClasses(User $actor, int $quizId): array
    {
        $quiz = $this->requireQuiz($quizId);
        if ('admin' !== $actor->getRole() && !$this->access->canManageQuiz($actor, $quiz)) {
            throw new ApiException(403, 'ACCESS_DENIED', 'Cannot list target classes for this quiz.');
        }

        $teacherFilter = 'teacher' === $actor->getRole() ? $actor->getId() : null;

        return $this->quizzes->findTargetClassesByQuizId($quizId, $teacherFilter);
    }

    public function setTargetClass(User $actor, int $quizId, int $classId, bool $isActive): void
    {
        $quiz = $this->requireQuiz($quizId);
        if (!$this->access->canSetTargetClass($actor, $quiz, $classId, $isActive)) {
            throw new ApiException(403, 'ACCESS_DENIED', 'Cannot set target class for this quiz.');
        }

        $this->quizzes->upsertTargetClass($quizId, $classId, $isActive);
    }

    public function removeTargetClass(User $actor, int $quizId, int $classId): void
    {
        $quiz = $this->requireQuiz($quizId);
        $class = $this->classes->find($classId);
        if (null === $class) {
            throw new ApiException(404, 'NOT_FOUND', 'Class not found.');
        }

        if ('admin' !== $actor->getRole() && $class->getTeacherId() !== $actor->getId()) {
            throw new ApiException(403, 'ACCESS_DENIED', 'Cannot remove target class for this quiz.');
        }

        $this->quizzes->deleteTargetClass($quizId, $classId);
    }

    private function requireQuiz(int $quizId): Quiz
    {
        $quiz = $this->quizzes->find($quizId);
        if (null === $quiz) {
            throw new ApiException(404, 'NOT_FOUND', 'Quiz not found.');
        }

        return $quiz;
    }

    private function requireAccessibleQuiz(User $actor, int $quizId): Quiz
    {
        $quiz = $this->requireQuiz($quizId);
        if (!$this->access->canAccess($actor, $quiz)) {
            throw new ApiException(403, 'QUIZ_NOT_ACCESSIBLE', 'Quiz is not accessible.');
        }

        return $quiz;
    }

    private function assertCanManage(User $actor, Quiz $quiz): void
    {
        if (!$this->access->canManageQuiz($actor, $quiz)) {
            throw new ApiException(403, 'ACCESS_DENIED', 'Cannot manage this quiz.');
        }
    }

    private function resolveCreateStatus(User $actor, ?string $status): string
    {
        $resolved = $status ?? 'private';
        if (!\in_array($resolved, ['private', 'public'], true)) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid quiz status.');
        }

        if ('teacher' === $actor->getRole() && 'public' === $resolved) {
            throw new ApiException(403, 'ACCESS_DENIED', 'Teachers can only create private quizzes.');
        }

        if ('admin' !== $actor->getRole() && 'public' === $resolved) {
            throw new ApiException(403, 'ACCESS_DENIED', 'Only admins can create public quizzes.');
        }

        return $resolved;
    }

    /**
     * @param array{label: string, type: string, orderIndex?: int, options: array<int, array{label: string, isCorrect: bool}>} $question
     */
    private function validateQuestionInput(array $question): void
    {
        $label = trim($question['label']);
        if ('' === $label || mb_strlen($label) > 255) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid question label.');
        }

        $type = $question['type'];
        if (!\in_array($type, ['radio', 'select', 'checkbox'], true)) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid question type.');
        }

        $options = $question['options'];
        if (\count($options) < 2) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'At least two options are required.');
        }

        $correctCount = 0;
        foreach ($options as $option) {
            $optionLabel = trim($option['label']);
            if ('' === $optionLabel || mb_strlen($optionLabel) > 255) {
                throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid option label.');
            }
            if ($option['isCorrect']) {
                ++$correctCount;
            }
        }

        if (0 === $correctCount) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'At least one correct option is required.');
        }

        if (\in_array($type, ['radio', 'select'], true) && 1 !== $correctCount) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Radio and select questions require exactly one correct option.');
        }
    }

    /**
     * @param array<int, int> $optionIds
     */
    private function validateOptionSelection(QuizQuestion $question, array $optionIds): void
    {
        $validIds = [];
        foreach ($question->getOptions() as $option) {
            $validIds[$option->getId()] = true;
        }

        foreach ($optionIds as $optionId) {
            if (!isset($validIds[$optionId])) {
                throw new ApiException(422, 'VALIDATION_ERROR', 'Option does not belong to this question.');
            }
        }

        if (\in_array($question->getType(), ['radio', 'select'], true) && 1 !== \count($optionIds)) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Exactly one option must be selected.');
        }
    }

    /**
     * @param array<int, QuizQuestion> $questions
     *
     * @return array<int, int>
     */
    private function orderedQuestionIds(array $questions): array
    {
        usort($questions, static fn (QuizQuestion $a, QuizQuestion $b): int => $a->getOrderIndex() <=> $b->getOrderIndex()
            ?: $a->getId() <=> $b->getId());

        return array_map(static fn (QuizQuestion $q): int => $q->getId(), $questions);
    }

    /**
     * @param array<int, QuizQuestion> $questions
     */
    private function findQuestionInList(array $questions, int $questionId): ?QuizQuestion
    {
        foreach ($questions as $question) {
            if ($question->getId() === $questionId) {
                return $question;
            }
        }

        return null;
    }

    /**
     * @param array<int, array<int, int>> $selectedByQuestion
     */
    private function scoreAttempt(array $questions, array $selectedByQuestion): int
    {
        $score = 0;
        foreach ($questions as $question) {
            $selected = $selectedByQuestion[$question->getId()] ?? [];
            if ($this->isQuestionCorrect($question, $selected)) {
                ++$score;
            }
        }

        return $score;
    }

    /**
     * @param array<int, int> $selectedIds
     */
    private function isQuestionCorrect(QuizQuestion $question, array $selectedIds): bool
    {
        $correct = [];
        foreach ($question->getOptions() as $option) {
            if ($option->isCorrect()) {
                $correct[] = $option->getId();
            }
        }

        sort($correct);
        $selected = array_values($selectedIds);
        sort($selected);

        return $correct === $selected;
    }

    /**
     * @return array{quizId: int, studentId: int, status: string, attemptCount: int, currentQuestionIndex: int, startedAt: null, completedAt: null, lastScore: null, bestScore: null}
     */
    private function virtualNotStarted(int $userId, int $quizId): array
    {
        return [
            'quizId' => $quizId,
            'studentId' => $userId,
            'status' => 'not_started',
            'attemptCount' => 0,
            'currentQuestionIndex' => 0,
            'startedAt' => null,
            'completedAt' => null,
            'lastScore' => null,
            'bestScore' => null,
        ];
    }
}
