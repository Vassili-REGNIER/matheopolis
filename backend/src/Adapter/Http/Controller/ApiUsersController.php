<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Service\ApiMapper;
use Matheopolis\Application\Service\ApiUserService;

final class ApiUsersController extends ApiBaseController
{
    public function __construct(
        private readonly ApiUserService $userService,
        private readonly \Matheopolis\Application\Port\ClassroomRepositoryInterface $classes,
        \Matheopolis\Application\Port\HttpInterface $http,
        \Matheopolis\Application\Port\AuthSessionInterface $auth,
        \Matheopolis\Application\Port\SessionInterface $session,
        \Matheopolis\Application\Port\UserRepositoryInterface $users,
    ) {
        parent::__construct($http, $auth, $session, $users);
    }

    public function createTeacher(): never
    {
        $this->ensureMethod('POST');
        $body = $this->jsonBody();

        $user = $this->userService->registerTeacher(
            (string) ($body['firstName'] ?? ''),
            (string) ($body['lastName'] ?? ''),
            (string) ($body['username'] ?? ''),
            (string) ($body['email'] ?? ''),
            (string) ($body['password'] ?? ''),
        );

        $this->success(['user' => ApiMapper::user($user)], 201);
    }

    public function createStudent(): never
    {
        $this->ensureMethod('POST');
        $body = $this->jsonBody();

        $classCodeRaw = $body['classCode'] ?? null;
        $classCode = \is_string($classCodeRaw) ? $classCodeRaw : null;

        $user = $this->userService->registerStudent(
            (string) ($body['firstName'] ?? ''),
            (string) ($body['lastName'] ?? ''),
            (string) ($body['username'] ?? ''),
            (string) ($body['password'] ?? ''),
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
