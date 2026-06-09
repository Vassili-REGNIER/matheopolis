<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\SessionInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Application\Service\ApiAuthService;
use Matheopolis\Application\Service\ApiMapper;
use Matheopolis\Domain\ClassEntity;
use Matheopolis\Domain\User;

final class ApiAuthController extends ApiBaseController
{
    public function __construct(
        private readonly ApiAuthService $authService,
        private readonly ClassroomRepositoryInterface $classes,
        HttpInterface $http,
        AuthSessionInterface $auth,
        SessionInterface $session,
        UserRepositoryInterface $users,
    ) {
        parent::__construct($http, $auth, $session, $users);
    }

    public function login(): never
    {
        $this->ensureMethod('POST');
        $body = $this->jsonBody();

        $identifierRaw = $body['identifier'] ?? '';
        $passwordRaw = $body['password'] ?? '';
        $identifier = \is_string($identifierRaw) ? $identifierRaw : '';
        $password = \is_string($passwordRaw) ? $passwordRaw : '';
        $user = $this->authService->login($identifier, $password);

        $this->success([
            'user' => $this->mapUser($user),
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
            'user' => $this->mapUser($user),
            'csrfToken' => $this->session->getCsrfToken(),
        ]);
    }

    public function forgotPassword(): never
    {
        $this->ensureMethod('POST');
        $body = $this->jsonBody();
        $emailRaw = $body['email'] ?? '';
        $email = \is_string($emailRaw) ? $emailRaw : '';
        $this->authService->requestPasswordReset($email);
        $this->success(['message' => 'If the email exists, a reset link has been sent.']);
    }

    public function resetPassword(): never
    {
        $this->ensureMethod('POST');
        $body = $this->jsonBody();
        $tokenRaw = $body['token'] ?? '';
        $passwordRaw = $body['password'] ?? '';
        $token = \is_string($tokenRaw) ? $tokenRaw : '';
        $password = \is_string($passwordRaw) ? $passwordRaw : '';
        $this->authService->resetPasswordWithToken($token, $password);
        $this->success(['message' => 'Password has been reset.']);
    }

    public function verifyEmail(): never
    {
        $this->ensureMethod('POST');
        $body = $this->jsonBody();
        $tokenRaw = $body['token'] ?? '';
        $token = \is_string($tokenRaw) ? $tokenRaw : '';
        $this->authService->verifyEmail($token);
        $this->success(['message' => 'Email address verified.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapUser(User $user): array
    {
        return ApiMapper::user($user, $this->classForUser($user));
    }

    private function classForUser(User $user): ?ClassEntity
    {
        $classId = $user->getClassId();

        return null !== $classId ? $this->classes->find($classId) : null;
    }
}
