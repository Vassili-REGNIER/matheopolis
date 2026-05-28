<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\ProgressRepositoryInterface;
use Matheopolis\Application\Port\PuzzleRepositoryInterface;
use Matheopolis\Application\Port\SessionInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Application\Service\ApiMapper;
use Matheopolis\Application\Service\ApiRiddleService;

final class ApiRiddlesController extends ApiBaseController
{
    public function __construct(
        private readonly ApiRiddleService $riddles,
        private readonly ProgressRepositoryInterface $progress,
        private readonly PuzzleRepositoryInterface $puzzles,
        HttpInterface $http,
        AuthSessionInterface $auth,
        SessionInterface $session,
        UserRepositoryInterface $users,
    ) {
        parent::__construct($http, $auth, $session, $users);
    }

    public function list(): never
    {
        $this->ensureMethod('GET');
        $items = [];
        foreach ($this->puzzles->findAll() as $puzzle) {
            if (!$puzzle->isActive()) {
                continue;
            }
            $items[] = ApiMapper::puzzle($puzzle);
        }
        $this->success(['items' => $items]);
    }

    public function start(string $riddleId): never
    {
        $this->ensureMethod('POST');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'student');
        $this->ensureCsrfForMutation();

        $result = $this->riddles->start($actor->getId(), (int) $riddleId);
        $this->success([
            'progress' => ApiMapper::progress($result['progress']),
            'playToken' => $result['playToken'],
        ]);
    }

    public function progress(string $riddleId): never
    {
        $this->ensureMethod('GET');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'student');

        $progress = $this->progress->findByStudentAndPuzzle($actor->getId(), (int) $riddleId);
        if (null === $progress) {
            $this->success([
                'progress' => [
                    'riddleId' => (int) $riddleId,
                    'studentId' => $actor->getId(),
                    'status' => 'not_started',
                    'attemptCount' => 0,
                    'startedAt' => null,
                    'completedAt' => null,
                    'lastAttemptAt' => null,
                ],
            ]);
        }

        $this->success(['progress' => ApiMapper::progress($progress)]);
    }

    public function attempt(string $riddleId): never
    {
        $this->ensureMethod('POST');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'student');
        $this->ensureCsrfForMutation();
        $body = $this->jsonBody();

        $answerRaw = $body['answer'] ?? '';
        $playTokenRaw = $body['playToken'] ?? '';
        $answer = \is_string($answerRaw) ? $answerRaw : '';
        $playToken = \is_string($playTokenRaw) ? $playTokenRaw : '';
        if ('' === trim($playToken)) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'playToken is required.');
        }

        $result = $this->riddles->attempt($actor->getId(), (int) $riddleId, $answer, $playToken);
        $this->success([
            'attempt' => [
                'isCorrect' => $result['isCorrect'],
                'progress' => ApiMapper::progress($result['progress']),
                'playToken' => $result['playToken'],
            ],
        ]);
    }

    public function complete(string $riddleId): never
    {
        $this->ensureMethod('POST');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'student');
        $this->ensureCsrfForMutation();
        $body = $this->jsonBody();

        $playTokenRaw = $body['playToken'] ?? '';
        $playToken = \is_string($playTokenRaw) ? $playTokenRaw : '';
        if ('' === trim($playToken)) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'playToken is required.');
        }

        $updated = $this->riddles->complete($actor->getId(), (int) $riddleId, $playToken);
        $this->success(['progress' => ApiMapper::progress($updated)]);
    }
}
