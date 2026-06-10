<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\SessionInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Application\Service\ApiChapterService;
use Matheopolis\Application\Service\ApiMapper;

final class ApiChaptersController extends ApiBaseController
{
    public function __construct(
        private readonly ApiChapterService $chapters,
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
        $actor = $this->optionalUser();
        $this->success(['items' => $this->chapters->list($actor)]);
    }

    public function show(string $id): never
    {
        $this->ensureMethod('GET');
        $actor = $this->optionalUser();
        $this->success($this->chapters->show($actor, (int) $id));
    }

    public function start(string $id): never
    {
        $this->ensureMethod('POST');
        $actor = $this->currentUser();
        $this->ensureCsrfForMutation();
        $progress = $this->chapters->start($actor, (int) $id);
        $this->success(['progress' => ApiMapper::chapterProgress($progress)]);
    }

    public function progress(string $id): never
    {
        $this->ensureMethod('GET');
        $actor = $this->currentUser();
        $this->success(['progress' => $this->chapters->getProgress($actor, (int) $id)]);
    }

    public function syncStep(string $id): never
    {
        $this->ensureMethod('POST');
        $actor = $this->currentUser();
        $this->ensureCsrfForMutation();
        $body = $this->jsonBody();
        $currentStepIndex = isset($body['currentStepIndex']) && is_numeric($body['currentStepIndex'])
            ? (int) $body['currentStepIndex']
            : -1;
        $progress = $this->chapters->syncStep($actor, (int) $id, $currentStepIndex);
        $this->success(['progress' => ApiMapper::chapterProgress($progress)]);
    }

    public function complete(string $id): never
    {
        $this->ensureMethod('POST');
        $actor = $this->currentUser();
        $this->ensureCsrfForMutation();
        $body = $this->jsonBody();
        $score = null;
        if (\array_key_exists('score', $body)) {
            if (!is_numeric($body['score'])) {
                throw new ApiException(422, 'VALIDATION_ERROR', 'score must be numeric.');
            }
            $score = (int) $body['score'];
        }
        $progress = $this->chapters->complete($actor, (int) $id, $score);
        $this->success(['progress' => ApiMapper::chapterProgress($progress)]);
    }

    public function listTargetClasses(string $id): never
    {
        $this->ensureMethod('GET');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher', 'admin');
        $items = $this->chapters->listTargetClasses($actor, (int) $id);
        $this->success(['items' => $items]);
    }

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

        $this->chapters->setTargetClass($actor, (int) $id, (int) $classId, $isActive);
        $this->success([
            'targetClass' => [
                'chapterId' => (int) $id,
                'classId' => (int) $classId,
                'isActive' => $isActive,
            ],
        ]);
    }

    public function removeTargetClass(string $id, string $classId): never
    {
        $this->ensureMethod('DELETE');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher', 'admin');
        $this->ensureCsrfForMutation();
        $this->chapters->removeTargetClass($actor, (int) $id, (int) $classId);
        $this->http->jsonResponse([], 204);
    }

    private function parseBool(mixed $value): ?bool
    {
        if (\is_bool($value)) {
            return $value;
        }
        if (1 === $value || '1' === $value) {
            return true;
        }
        if (0 === $value || '0' === $value) {
            return false;
        }
        if (\is_string($value)) {
            return match (strtolower($value)) {
                'true' => true,
                'false' => false,
                default => null,
            };
        }

        return null;
    }
}
