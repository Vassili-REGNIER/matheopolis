<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\SessionInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Application\Service\ApiMapper;
use Matheopolis\Application\Service\ApiRiddleService;

/**
 * Handles HTTP requests for API riddles endpoints.
 */
final class ApiRiddlesController extends ApiBaseController
{
    /**
     * Creates a new ApiRiddlesController instance.
     */
    public function __construct(
        private readonly ApiRiddleService $riddles,
        HttpInterface $http,
        AuthSessionInterface $auth,
        SessionInterface $session,
        UserRepositoryInterface $users,
    ) {
        parent::__construct($http, $auth, $session, $users);
    }

    /**
     * Show.
     */
    public function show(string $riddleId): never
    {
        $this->ensureMethod('GET');
        $actor = $this->optionalUser();
        $this->success($this->riddles->show($actor, (int) $riddleId));
    }

    /**
     * Start.
     */
    public function start(string $riddleId): never
    {
        $this->ensureMethod('POST');
        $actor = $this->currentUser();
        $this->ensureCsrfForMutation();
        $progress = $this->riddles->start($actor, (int) $riddleId);
        $this->success(['progress' => ApiMapper::riddleProgress($progress)]);
    }

    /**
     * Progress.
     */
    public function progress(string $riddleId): never
    {
        $this->ensureMethod('GET');
        $actor = $this->currentUser();
        $this->success(['progress' => $this->riddles->getProgress($actor, (int) $riddleId)]);
    }

    /**
     * Submit response.
     */
    public function submitResponse(string $riddleId): never
    {
        $this->ensureMethod('POST');
        $actor = $this->currentUser();
        $this->ensureCsrfForMutation();
        $body = $this->jsonBody();

        $questionIdRaw = $body['questionId'] ?? null;
        $questionIndexRaw = $body['questionIndex'] ?? null;
        $answerRaw = $body['answer'] ?? '';
        $answer = \is_string($answerRaw) ? $answerRaw : '';

        $questionId = 0;
        if (\is_int($questionIdRaw)) {
            $questionId = $questionIdRaw;
        } elseif (is_numeric($questionIdRaw)) {
            $questionId = (int) $questionIdRaw;
        }
        $questionIndex = null;
        if (\is_int($questionIndexRaw) || (\is_string($questionIndexRaw) && is_numeric($questionIndexRaw))) {
            $questionIndex = (int) $questionIndexRaw;
        }
        if ($questionId <= 0 && null === $questionIndex) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'questionId or questionIndex is required.');
        }

        $result = $this->riddles->submitResponse($actor, (int) $riddleId, $questionId, $questionIndex, $answer);
        $this->success($result);
    }
}
