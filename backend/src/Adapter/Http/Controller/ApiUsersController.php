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
use Matheopolis\Domain\ClassEntity;
use Matheopolis\Domain\User;

/**
 * Handles HTTP requests for API users endpoints.
 */
final class ApiUsersController extends ApiBaseController
{
    /**
     * Creates a new ApiUsersController instance.
     */
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

    /**
     * Creates the requested resource.
     */
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

        $this->success(['user' => $this->mapUser($user)], 201);
    }

    /**
     * Creates the requested resource.
     */
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

        $this->success(['user' => $this->mapUser($user)], 201);
    }

    /**
     * Creates the requested resource.
     */
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

        $this->success(['user' => $this->mapUser($user)], 201);
    }

    /**
     * Profile.
     */
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

        $this->success(['user' => $this->mapUser($target)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapUser(User $user): array
    {
        return ApiMapper::user($user, $this->classForUser($user));
    }

    /**
     * Class for user.
     */
    private function classForUser(User $user): ?ClassEntity
    {
        $classId = $user->getClassId();

        return null !== $classId ? $this->classes->find($classId) : null;
    }
}
