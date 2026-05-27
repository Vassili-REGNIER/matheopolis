<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Application\Service\ApiAuthService;
use Matheopolis\Application\Service\ApiMapper;

final class ApiAuthController extends ApiBaseController
{
    public function __construct(
        private readonly ApiAuthService $authService,
        \Matheopolis\Application\Port\HttpInterface $http,
        \Matheopolis\Application\Port\AuthSessionInterface $auth,
        \Matheopolis\Application\Port\SessionInterface $session,
        \Matheopolis\Application\Port\UserRepositoryInterface $users,
    ) {
        parent::__construct($http, $auth, $session, $users);
    }

    public function login(): never
    {
        $this->ensureMethod('POST');
        $body = $this->jsonBody();

        $identifier = (string) ($body['identifier'] ?? '');
        $password = (string) ($body['password'] ?? '');
        $user = $this->authService->login($identifier, $password);

        $this->success([
            'user' => ApiMapper::user($user),
            'csrfToken' => $this->session->getCsrfToken(),
        ]);
    }

    public function logout(): never
    {
        $this->ensureMethod('POST');
        $this->currentUser();
        $this->ensureCsrfForMutation();
        $this->authService->logout();
        $this->http->jsonResponse([], 204);
    }

    public function me(): never
    {
        $this->ensureMethod('GET');
        $user = $this->currentUser();
        $this->success([
            'user' => ApiMapper::user($user),
            'csrfToken' => $this->session->getCsrfToken(),
        ]);
    }
}
