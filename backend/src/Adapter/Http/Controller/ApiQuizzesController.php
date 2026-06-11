<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\QuizRepositoryInterface;
use Matheopolis\Application\Port\SessionInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Application\Service\ApiMapper;
use Matheopolis\Application\Service\ApiQuizService;

/**
 * Handles HTTP requests for API quizzes endpoints.
 */
final class ApiQuizzesController extends ApiBaseController
{
    /**
     * Creates a new ApiQuizzesController instance.
     */
    public function __construct(
        private readonly ApiQuizService $quizzes,
        private readonly QuizRepositoryInterface $quizRepository,
        HttpInterface $http,
        AuthSessionInterface $auth,
        SessionInterface $session,
        UserRepositoryInterface $users,
    ) {
        parent::__construct($http, $auth, $session, $users);
    }

    /**
     * List.
     */
    public function list(): never
    {
        $this->ensureMethod('GET');
        $actor = $this->currentUser();
        $publicationRequested = $this->isTruthyQuery('publicationRequested');

        $items = [];
        foreach ($this->quizzes->listSummaries($actor, $publicationRequested) as $entry) {
            $quiz = $entry['quiz'];
            $items[] = ApiMapper::quizSummary(
                $quiz,
                $this->quizRepository->countQuestions($quiz->getId()),
                $entry['progress'],
            );
        }

        $this->success(['items' => $items]);
    }

    /**
     * Show.
     */
    public function show(string $id): never
    {
        $this->ensureMethod('GET');
        $actor = $this->currentUser();
        $quizId = (int) $id;
        $quiz = $this->quizzes->getPlayView($actor, $quizId);
        $canManage = $this->quizzes->canManage($actor, $quiz);
        $questions = $this->quizRepository->findQuestionsByQuizId($quizId, $canManage);

        $this->success([
            'quiz' => $canManage
                ? ApiMapper::quizManage($quiz, \count($questions), $questions)
                : ApiMapper::quizPlay($quiz, \count($questions), $questions),
        ]);
    }

    /**
     * Progress.
     */
    public function progress(string $id): never
    {
        $this->ensureMethod('GET');
        $actor = $this->currentUser();
        $progress = $this->quizzes->getProgress($actor, (int) $id);
        $this->success(['progress' => ApiMapper::quizProgress($progress)]);
    }

    /**
     * Start attempt.
     */
    public function startAttempt(string $id): never
    {
        $this->ensureMethod('POST');
        $actor = $this->currentUser();
        $this->ensureCsrfForMutation();
        $progress = $this->quizzes->startAttempt($actor, (int) $id);
        $this->success(['progress' => ApiMapper::quizProgress($progress)], 201);
    }

    /**
     * Submit response.
     */
    public function submitResponse(string $id): never
    {
        $this->ensureMethod('POST');
        $actor = $this->currentUser();
        $this->ensureCsrfForMutation();
        $body = $this->jsonBody();

        $questionIdRaw = $body['questionId'] ?? null;
        if (!\is_int($questionIdRaw) && !(\is_string($questionIdRaw) && is_numeric($questionIdRaw))) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'questionId is required.');
        }
        $questionId = (int) $questionIdRaw;

        $progress = $this->quizzes->submitResponse(
            $actor,
            (int) $id,
            $questionId,
            $this->parseOptionIds($body['optionIds'] ?? null),
        );
        $this->success(['progress' => ApiMapper::quizProgress($progress)]);
    }

    /**
     * Correction.
     */
    public function correction(string $id): never
    {
        $this->ensureMethod('GET');
        $actor = $this->currentUser();
        $attempt = $this->parseOptionalAttemptNumber();
        $correction = $this->quizzes->getCorrection($actor, (int) $id, $attempt);
        $this->success(ApiMapper::quizCorrection($correction));
    }

    /**
     * Creates the requested resource.
     */
    public function create(): never
    {
        $this->ensureMethod('POST');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher', 'admin');
        $this->ensureCsrfForMutation();
        $body = $this->jsonBody();

        $titleRaw = $body['title'] ?? '';
        $title = \is_string($titleRaw) ? $titleRaw : '';
        $descriptionRaw = $body['description'] ?? null;
        $description = \is_string($descriptionRaw) ? $descriptionRaw : null;
        $statusRaw = $body['status'] ?? null;
        $status = \is_string($statusRaw) ? $statusRaw : null;

        $quiz = $this->quizzes->create(
            $actor,
            $title,
            $description,
            $status,
            $this->parseInlineQuestions($body['questions'] ?? []),
        );

        $questions = $this->quizRepository->findQuestionsByQuizId($quiz->getId(), true);
        $this->success([
            'quiz' => ApiMapper::quizManage($quiz, \count($questions), $questions),
        ], 201);
    }

    /**
     * Updates the requested resource.
     */
    public function update(string $id): never
    {
        $this->ensureMethod('PATCH');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher', 'admin');
        $this->ensureCsrfForMutation();
        $body = $this->jsonBody();

        $title = \array_key_exists('title', $body) && \is_string($body['title']) ? $body['title'] : null;
        $description = \array_key_exists('description', $body)
            ? (\is_string($body['description']) ? $body['description'] : null)
            : null;
        $status = \array_key_exists('status', $body) && \is_string($body['status']) ? $body['status'] : null;
        $askAdmin = \array_key_exists('askAdmin', $body) ? $this->parseBool($body['askAdmin']) : null;

        $quiz = $this->quizzes->update($actor, (int) $id, $title, $description, $status, $askAdmin);
        $questions = $this->quizRepository->findQuestionsByQuizId($quiz->getId(), true);
        $this->success([
            'quiz' => ApiMapper::quizManage($quiz, \count($questions), $questions),
        ]);
    }

    /**
     * Remove.
     */
    public function remove(string $id): never
    {
        $this->ensureMethod('DELETE');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher', 'admin');
        $this->ensureCsrfForMutation();
        $this->quizzes->delete($actor, (int) $id);
        $this->http->jsonResponse([], 204);
    }

    /**
     * Add question.
     */
    public function addQuestion(string $id): never
    {
        $this->ensureMethod('POST');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher', 'admin');
        $this->ensureCsrfForMutation();
        $body = $this->jsonBody();

        $labelRaw = $body['label'] ?? '';
        $label = \is_string($labelRaw) ? $labelRaw : '';
        $typeRaw = $body['type'] ?? '';
        $type = \is_string($typeRaw) ? $typeRaw : '';
        $orderIndexRaw = $body['orderIndex'] ?? 0;
        $orderIndex = \is_int($orderIndexRaw)
            ? $orderIndexRaw
            : (\is_string($orderIndexRaw) && is_numeric($orderIndexRaw) ? (int) $orderIndexRaw : 0);

        $question = $this->quizzes->addQuestion(
            $actor,
            (int) $id,
            $label,
            $type,
            $orderIndex,
            $this->parseQuestionOptions($body['options'] ?? null),
        );

        $this->success(['question' => ApiMapper::quizQuestionManage($question)], 201);
    }

    /**
     * Updates the requested resource.
     */
    public function updateQuestion(string $id, string $questionId): never
    {
        $this->ensureMethod('PATCH');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher', 'admin');
        $this->ensureCsrfForMutation();
        $body = $this->jsonBody();

        $label = \array_key_exists('label', $body) && \is_string($body['label']) ? $body['label'] : null;
        $type = \array_key_exists('type', $body) && \is_string($body['type']) ? $body['type'] : null;
        $orderIndex = null;
        if (\array_key_exists('orderIndex', $body)) {
            $orderIndexRaw = $body['orderIndex'];
            if (\is_int($orderIndexRaw) || (\is_string($orderIndexRaw) && is_numeric($orderIndexRaw))) {
                $orderIndex = (int) $orderIndexRaw;
            }
        }
        $options = \array_key_exists('options', $body)
            ? $this->parseQuestionOptions($body['options'])
            : null;

        $question = $this->quizzes->updateQuestion(
            $actor,
            (int) $id,
            (int) $questionId,
            $label,
            $type,
            $orderIndex,
            $options,
        );

        $this->success(['question' => ApiMapper::quizQuestionManage($question)]);
    }

    /**
     * Deletes the requested resource.
     */
    public function deleteQuestion(string $id, string $questionId): never
    {
        $this->ensureMethod('DELETE');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher', 'admin');
        $this->ensureCsrfForMutation();
        $this->quizzes->deleteQuestion($actor, (int) $id, (int) $questionId);
        $this->http->jsonResponse([], 204);
    }

    /**
     * List target classes.
     */
    public function listTargetClasses(string $id): never
    {
        $this->ensureMethod('GET');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher', 'admin');
        $items = $this->quizzes->listTargetClasses($actor, (int) $id);
        $this->success(['items' => $items]);
    }

    /**
     * Updates the target class.
     */
    public function setTargetClass(string $id, string $classId): never
    {
        $this->ensureMethod('PUT');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher', 'admin');
        $this->ensureCsrfForMutation();
        $body = $this->jsonBody();
        $isActive = $this->parseBool($body['isActive'] ?? null);
        if (null === $isActive) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'isActive is required.');
        }

        $this->quizzes->setTargetClass($actor, (int) $id, (int) $classId, $isActive);
        $this->success([
            'targetClass' => [
                'quizId' => (int) $id,
                'classId' => (int) $classId,
                'isActive' => $isActive,
            ],
        ]);
    }

    /**
     * Remove target class.
     */
    public function removeTargetClass(string $id, string $classId): never
    {
        $this->ensureMethod('DELETE');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher', 'admin');
        $this->ensureCsrfForMutation();
        $this->quizzes->removeTargetClass($actor, (int) $id, (int) $classId);
        $this->http->jsonResponse([], 204);
    }

    /**
     * Checks whether the truthy query condition is met.
     */
    private function isTruthyQuery(string $key): bool
    {
        $value = $this->http->get($key);
        if (true === $value || 1 === $value || '1' === $value) {
            return true;
        }
        if (\is_string($value)) {
            return 'true' === strtolower($value);
        }

        return false;
    }

    /**
     * Parse optional attempt number.
     */
    private function parseOptionalAttemptNumber(): ?int
    {
        $value = $this->http->get('attempt');
        if (null === $value || '' === $value) {
            return null;
        }
        if (\is_int($value)) {
            return $value;
        }
        if (\is_string($value) && is_numeric($value)) {
            return (int) $value;
        }

        throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid attempt number.');
    }

    /**
     * @return array<int, int>
     */
    private function parseOptionIds(mixed $raw): array
    {
        if (!\is_array($raw)) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'optionIds must be an array.');
        }

        $ids = [];
        foreach ($raw as $value) {
            if (\is_int($value)) {
                $ids[] = $value;

                continue;
            }
            if (\is_string($value) && is_numeric($value)) {
                $ids[] = (int) $value;

                continue;
            }

            throw new ApiException(422, 'VALIDATION_ERROR', 'optionIds must contain integers.');
        }

        return $ids;
    }

    /**
     * @return array<int, array{label: string, type: string, orderIndex: int, options: array<int, array{label: string, isCorrect: bool}>}>
     */
    private function parseInlineQuestions(mixed $raw): array
    {
        if (!\is_array($raw)) {
            return [];
        }

        $questions = [];
        foreach ($raw as $question) {
            if (!\is_array($question)) {
                throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid questions payload.');
            }
            $labelRaw = $question['label'] ?? '';
            $typeRaw = $question['type'] ?? '';
            $orderIndexRaw = $question['orderIndex'] ?? 0;
            if (!\is_string($labelRaw) || !\is_string($typeRaw)) {
                throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid question payload.');
            }
            $orderIndex = \is_int($orderIndexRaw)
                ? $orderIndexRaw
                : (\is_string($orderIndexRaw) && is_numeric($orderIndexRaw) ? (int) $orderIndexRaw : 0);

            $questions[] = [
                'label' => $labelRaw,
                'type' => $typeRaw,
                'orderIndex' => $orderIndex,
                'options' => $this->parseQuestionOptions($question['options'] ?? null),
            ];
        }

        return $questions;
    }

    /**
     * @return array<int, array{label: string, isCorrect: bool}>
     */
    private function parseQuestionOptions(mixed $raw): array
    {
        if (!\is_array($raw)) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'options must be an array.');
        }

        $options = [];
        foreach ($raw as $option) {
            if (!\is_array($option)) {
                throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid option payload.');
            }
            $labelRaw = $option['label'] ?? '';
            if (!\is_string($labelRaw)) {
                throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid option label.');
            }
            $options[] = [
                'label' => $labelRaw,
                'isCorrect' => $this->parseBool($option['isCorrect'] ?? null) ?? false,
            ];
        }

        return $options;
    }

    /**
     * Parse bool.
     */
    private function parseBool(mixed $value): ?bool
    {
        if (null === $value) {
            return null;
        }
        if (\is_bool($value)) {
            return $value;
        }
        if (\is_int($value)) {
            return 0 !== $value;
        }
        if (\is_string($value)) {
            return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        }

        return null;
    }
}
