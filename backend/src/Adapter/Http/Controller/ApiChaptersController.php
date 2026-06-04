<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

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

    public function complete(string $id): never
    {
        $this->ensureMethod('POST');
        $actor = $this->currentUser();
        $this->ensureCsrfForMutation();
        $progress = $this->chapters->complete($actor, (int) $id);
        $this->success(['progress' => ApiMapper::chapterProgress($progress)]);
    }
}
