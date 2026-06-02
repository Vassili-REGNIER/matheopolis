<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\SessionInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Application\Service\ApiMapper;
use Matheopolis\Application\Service\ApiUserService;

final class ApiUsersController extends ApiBaseController
{
    public function __construct(
        private readonly ApiUserService $userService,
        private readonly ClassroomRepositoryInterface $classes,
        HttpInterface $http,
        AuthSessionInterface $auth,
        SessionInterface $session,
        UserRepositoryInterface $users,
    ) {
        parent::__construct($http, $auth, $session, $users);
    }

    public function createTeacher(): never
    {
        $this->ensureMethod('POST');
        $body = $this->jsonBody();
        $firstNameRaw = $body['firstName'] ?? '';
        $lastNameRaw = $body['lastName'] ?? '';
        $emailRaw = $body['email'] ?? '';
        $passwordRaw = $body['password'] ?? '';

        $user = $this->userService->registerTeacher(
            \is_string($firstNameRaw) ? $firstNameRaw : '',
            \is_string($lastNameRaw) ? $lastNameRaw : '',
            \is_string($emailRaw) ? $emailRaw : '',
            \is_string($passwordRaw) ? $passwordRaw : '',
        );

        $this->success(['user' => ApiMapper::user($user)], 201);
    }

    public function createAccount(): never
    {
        $this->ensureMethod('POST');
        $body = $this->jsonBody();
        $firstNameRaw = $body['firstName'] ?? '';
        $lastNameRaw = $body['lastName'] ?? '';
        $emailRaw = $body['email'] ?? '';
        $passwordRaw = $body['password'] ?? '';

        $user = $this->userService->registerAccount(
            \is_string($firstNameRaw) ? $firstNameRaw : '',
            \is_string($lastNameRaw) ? $lastNameRaw : '',
            \is_string($emailRaw) ? $emailRaw : '',
            \is_string($passwordRaw) ? $passwordRaw : '',
        );

        $this->success(['user' => ApiMapper::user($user)], 201);
    }

    public function createStudent(): never
    {
        $this->ensureMethod('POST');
        $body = $this->jsonBody();

        $classCodeRaw = $body['classCode'] ?? null;
        $classCode = \is_string($classCodeRaw) ? $classCodeRaw : null;
        $firstNameRaw = $body['firstName'] ?? '';
        $lastNameRaw = $body['lastName'] ?? '';
        $passwordRaw = $body['password'] ?? '';

        $user = $this->userService->registerStudent(
            \is_string($firstNameRaw) ? $firstNameRaw : '',
            \is_string($lastNameRaw) ? $lastNameRaw : '',
            \is_string($passwordRaw) ? $passwordRaw : '',
            $classCode,
        );

        $this->success(['user' => ApiMapper::user($user)], 201);
    }

    public function profile(string $id): never
    {
        $this->ensureMethod('GET');
        $actor = $this->currentUser();
        $target = $this->users->find((int) $id);
        if (null === $target) {
            throw new ApiException(404, 'NOT_FOUND', 'User not found.');
        }

        if ('admin' !== $actor->getRole() && $actor->getId() !== $target->getId()) {
            if ('teacher' !== $actor->getRole() || 'student' !== $target->getRole() || null === $target->getClassId()) {
                throw new ApiException(403, 'ACCESS_DENIED', 'Access denied.');
            }
            $class = $this->classes->find($target->getClassId());
            if (null === $class || $class->getTeacherId() !== $actor->getId()) {
                throw new ApiException(403, 'ACCESS_DENIED', 'Access denied.');
            }
        }

        $this->success(['user' => ApiMapper::user($target)]);
    }
}
