<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Application\Service\ApiMapper;
use Matheopolis\Application\Service\ApiTeacherCodeService;

final class ApiTeacherCodesController extends ApiBaseController
{
    public function __construct(
        private readonly ApiTeacherCodeService $teacherCodeService,
        private readonly \Matheopolis\Application\Port\TeacherCodeRepositoryInterface $teacherCodes,
        \Matheopolis\Application\Port\HttpInterface $http,
        \Matheopolis\Application\Port\AuthSessionInterface $auth,
        \Matheopolis\Application\Port\SessionInterface $session,
        \Matheopolis\Application\Port\UserRepositoryInterface $users,
    ) {
        parent::__construct($http, $auth, $session, $users);
    }

    public function create(): never
    {
        $this->ensureMethod('POST');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'admin');
        $this->ensureCsrfForMutation();

        $body = $this->jsonBody();
        $code = isset($body['code']) && \is_string($body['code']) ? $body['code'] : null;
        $expiresAt = isset($body['expiresAt']) && \is_string($body['expiresAt']) ? $body['expiresAt'] : null;
        $created = $this->teacherCodeService->create($code, $expiresAt, $actor->getId());

        $this->success(['teacherCode' => ApiMapper::teacherCode($created)], 201);
    }

    public function list(): never
    {
        $this->ensureMethod('GET');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'admin');

        $statusRaw = $this->http->get('status');
        $status = \is_string($statusRaw) ? $statusRaw : null;
        $items = [];
        foreach ($this->teacherCodes->findAllCodes($status) as $item) {
            $items[] = ApiMapper::teacherCode($item);
        }

        $this->success(['items' => $items]);
    }

    public function disable(string $id): never
    {
        $this->ensureMethod('DELETE');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'admin');
        $this->ensureCsrfForMutation();
        $this->teacherCodes->disable((int) $id);
        $this->http->jsonResponse([], 204);
    }
}
