<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\SessionInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Application\Service\ApiClassService;
use Matheopolis\Application\Service\ApiMapper;

final class ApiClassesController extends ApiBaseController
{
    public function __construct(
        private readonly ApiClassService $classService,
        private readonly ClassroomRepositoryInterface $classes,
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
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher');

        $items = [];
        foreach ($this->classService->listForTeacher($actor->getId()) as $class) {
            $items[] = ApiMapper::classEntity($class);
        }

        $this->success(['items' => $items]);
    }

    public function create(): never
    {
        $this->ensureMethod('POST');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher');
        $this->ensureCsrfForMutation();

        $body = $this->jsonBody();
        $nameRaw = $body['name'] ?? '';
        $name = \is_string($nameRaw) ? $nameRaw : '';
        $descriptionRaw = $body['description'] ?? null;
        $description = \is_string($descriptionRaw) ? $descriptionRaw : null;
        $levelRaw = $body['level'] ?? '';
        $level = \is_string($levelRaw) ? $levelRaw : '';
        $class = $this->classService->create($name, $description, $level, $actor->getId());

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
            $students[] = ApiMapper::user($student, $class);
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
        $description = \array_key_exists('description', $body) && \is_string($body['description']) ? $body['description'] : $class->getDescription();
        $levelRaw = $body['level'] ?? $class->getLevel();
        $level = \is_string($levelRaw) ? $this->classService->normalizeLevel($levelRaw) : $class->getLevel();
        $updated = $this->classes->update($class->getId(), $name, $description, $level);

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
            $items[] = ApiMapper::user($student, $class);
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

    public function studentsProgressExport(string $id): never
    {
        $this->ensureMethod('GET');
        $actor = $this->currentUser();
        $class = $this->classes->find((int) $id);
        if (null === $class) {
            throw new ApiException(404, 'NOT_FOUND', 'Class not found.');
        }
        $this->classService->assertClassReadable($class, $actor);

        $modeRaw = $this->http->get('mode', 'overview');
        $mode = \is_string($modeRaw) ? $modeRaw : 'overview';
        $chapterIdRaw = $this->http->get('chapterId');
        $chapterId = \is_string($chapterIdRaw) && '' !== $chapterIdRaw ? (int) $chapterIdRaw : null;

        $export = $this->classService->exportProgressCsv($class->getId(), $mode, $chapterId);
        $this->http->fileResponse($export['content'], 'text/csv; charset=utf-8', $export['filename']);
    }

    public function importStudents(string $id): never
    {
        $this->ensureMethod('POST');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher', 'admin');
        $this->ensureCsrfForMutation();

        $class = $this->classes->find((int) $id);
        if (null === $class) {
            throw new ApiException(404, 'NOT_FOUND', 'Class not found.');
        }
        $this->classService->assertClassOwnedByTeacher($class, $actor);

        $csvContent = $this->readCsvRequestBody();
        $export = $this->classService->importStudentsCsv($class->getId(), $csvContent);
        $this->http->fileResponse($export['content'], 'text/csv; charset=utf-8', $export['filename']);
    }

    public function resetStudentPassword(string $id, string $studentId): never
    {
        $this->ensureMethod('POST');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher', 'admin');
        $this->ensureCsrfForMutation();

        $class = $this->classes->find((int) $id);
        if (null === $class) {
            throw new ApiException(404, 'NOT_FOUND', 'Class not found.');
        }
        $this->classService->assertClassOwnedByTeacher($class, $actor);

        $password = $this->classService->resetStudentPassword($class->getId(), (int) $studentId);
        $this->success(['password' => $password]);
    }

    public function deleteStudent(string $id, string $studentId): never
    {
        $this->ensureMethod('DELETE');
        $actor = $this->currentUser();
        $this->ensureRole($actor, 'teacher', 'admin');
        $this->ensureCsrfForMutation();

        $class = $this->classes->find((int) $id);
        if (null === $class) {
            throw new ApiException(404, 'NOT_FOUND', 'Class not found.');
        }
        $this->classService->assertClassOwnedByTeacher($class, $actor);

        $this->classService->deleteStudentAccount($class->getId(), (int) $studentId);
        $this->http->jsonResponse([], 204);
    }

    private function readCsvRequestBody(): string
    {
        if (isset($_FILES['file']) && \is_array($_FILES['file']) && UPLOAD_ERR_OK === ($_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE)) {
            $tmpName = $_FILES['file']['tmp_name'] ?? '';
            if (\is_string($tmpName) && '' !== $tmpName && is_readable($tmpName)) {
                $content = file_get_contents($tmpName);
                if (\is_string($content) && '' !== trim($content)) {
                    return $content;
                }
            }
        }

        $raw = file_get_contents('php://input');
        if (!\is_string($raw) || '' === trim($raw)) {
            throw new ApiException(422, 'INVALID_CSV_FORMAT', 'Invalid CSV format.');
        }

        return $raw;
    }
}
