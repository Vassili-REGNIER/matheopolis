<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Service\ApiClassService;
use Matheopolis\Application\Service\ApiMapper;

final class ApiClassesController extends ApiBaseController
{
    public function __construct(
        private readonly ApiClassService $classService,
        private readonly \Matheopolis\Application\Port\ClassroomRepositoryInterface $classes,
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
        $this->ensureRole($actor, 'teacher');
        $this->ensureCsrfForMutation();

        $body = $this->jsonBody();
        $descriptionRaw = $body['description'] ?? null;
        $description = \is_string($descriptionRaw) ? $descriptionRaw : null;
        $class = $this->classService->create((string) ($body['name'] ?? ''), $description, $actor->getId());

        $this->success(['class' => ApiMapper::classEntity($class)], 201);
    }

    public function details(string $id): never
    {
        $this->ensureMethod('GET');
        $actor = $this->currentUser();
        $class = $this->classes->find((int) $id);
        if (null === $class) {
            throw new ApiException(404, 'NOT_FOUND', 'Class not found.');
        }
        $this->classService->assertClassReadable($class, $actor);

        $teacher = $this->users->find($class->getTeacherId());
        $students = [];
        foreach ($this->classService->studentsForClass($class->getId()) as $student) {
            $students[] = ApiMapper::user($student);
        }

        $this->success([
            'class' => ApiMapper::classEntity($class),
            'teacher' => null !== $teacher ? ApiMapper::user($teacher) : null,
            'students' => $students,
        ]);
    }

    public function update(string $id): never
    {
        $this->ensureMethod('PATCH');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher', 'admin');
        $this->ensureCsrfForMutation();

        $class = $this->classes->find((int) $id);
        if (null === $class) {
            throw new ApiException(404, 'NOT_FOUND', 'Class not found.');
        }
        if ('admin' !== $actor->getRole() && $class->getTeacherId() !== $actor->getId()) {
            throw new ApiException(403, 'ACCESS_DENIED', 'Cannot update this class.');
        }

        $body = $this->jsonBody();
        $name = isset($body['name']) && \is_string($body['name']) ? trim($body['name']) : $class->getName();
        $description = array_key_exists('description', $body) && \is_string($body['description']) ? $body['description'] : $class->getDescription();
        $updated = $this->classes->update($class->getId(), $name, $description);

        $this->success(['class' => ApiMapper::classEntity($updated ?? $class)]);
    }

    public function remove(string $id): never
    {
        $this->ensureMethod('DELETE');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher', 'admin');
        $this->ensureCsrfForMutation();

        $class = $this->classes->find((int) $id);
        if (null === $class) {
            throw new ApiException(404, 'NOT_FOUND', 'Class not found.');
        }
        if ('admin' !== $actor->getRole() && $class->getTeacherId() !== $actor->getId()) {
            throw new ApiException(403, 'ACCESS_DENIED', 'Cannot delete this class.');
        }

        $this->classes->archive($class->getId());
        $this->http->jsonResponse([], 204);
    }

    public function students(string $id): never
    {
        $this->ensureMethod('GET');
        $actor = $this->currentUser();
        $class = $this->classes->find((int) $id);
        if (null === $class) {
            throw new ApiException(404, 'NOT_FOUND', 'Class not found.');
        }
        $this->classService->assertClassReadable($class, $actor);

        $items = [];
        foreach ($this->classService->studentsForClass($class->getId()) as $student) {
            $items[] = ApiMapper::user($student);
        }
        $this->success(['items' => $items]);
    }

    public function studentsProgress(string $id): never
    {
        $this->ensureMethod('GET');
        $actor = $this->currentUser();
        $class = $this->classes->find((int) $id);
        if (null === $class) {
            throw new ApiException(404, 'NOT_FOUND', 'Class not found.');
        }
        $this->classService->assertClassReadable($class, $actor);

        $this->success(['items' => $this->classService->classProgressSummary($class->getId())]);
    }
}
