<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\ProgressRepositoryInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Domain\ClassEntity;
use Matheopolis\Domain\User;

final class ApiClassService
{
    public function __construct(
        private readonly ClassroomRepositoryInterface $classes,
        private readonly UserRepositoryInterface $users,
        private readonly ProgressRepositoryInterface $progress,
    ) {}

    public function create(string $name, ?string $description, int $teacherId): ClassEntity
    {
        $name = trim($name);
        if ('' === $name || mb_strlen($name) > 120) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid class name.');
        }

        $description = null !== $description ? trim($description) : null;
        if (null !== $description && mb_strlen($description) > 1000) {
            throw new ApiException(422, 'VALIDATION_ERROR', 'Class description is too long.');
        }

        $code = $this->generateClassCode();

        return $this->classes->insert($name, $description, $code, $teacherId);
    }

    public function assertClassReadable(ClassEntity $class, User $actor): void
    {
        if ('admin' === $actor->getRole()) {
            return;
        }

        if ('teacher' === $actor->getRole() && $class->getTeacherId() === $actor->getId()) {
            return;
        }

        throw new ApiException(403, 'ACCESS_DENIED', 'Cannot access this class.');
    }

    /**
     * @return array<int, User>
     */
    public function studentsForClass(int $classId): array
    {
        return $this->users->findStudentsByClassId($classId);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function classProgressSummary(int $classId): array
    {
        /** @var array<int, User> $students */
        $students = $this->users->findStudentsByClassId($classId);
        if ([] === $students) {
            return [];
        }

        $studentIds = array_map(static fn (User $user): int => $user->getId(), $students);
        /** @var array<int, int> $studentIds */
        $progressItems = $this->progress->findByStudentIds($studentIds);

        /** @var array<int, array{started:int,completed:int,last:?string}> $stats */
        $stats = [];
        foreach ($students as $student) {
            $stats[$student->getId()] = ['started' => 0, 'completed' => 0, 'last' => null];
        }

        foreach ($progressItems as $item) {
            $studentId = $item->getStudentId();
            if (!isset($stats[$studentId])) {
                continue;
            }
            ++$stats[$studentId]['started'];
            if ('completed' === $item->getStatus()) {
                ++$stats[$studentId]['completed'];
            }
            $candidate = $item->getLastAttemptAt() ?? $item->getCompletedAt() ?? $item->getStartedAt();
            if (null !== $candidate && (null === $stats[$studentId]['last'] || $candidate > $stats[$studentId]['last'])) {
                $stats[$studentId]['last'] = $candidate;
            }
        }

        $out = [];
        foreach ($students as $student) {
            $studentStat = $stats[$student->getId()];
            $started = $studentStat['started'];
            $completed = $studentStat['completed'];
            $out[] = [
                'user' => ApiMapper::user($student),
                'startedRiddles' => $started,
                'completedRiddles' => $completed,
                'completionRate' => $started > 0 ? round(($completed / $started) * 100, 2) : 0.0,
                'lastActivityAt' => $studentStat['last'],
            ];
        }

        return $out;
    }

    private function generateClassCode(): string
    {
        return 'CLS-'.strtoupper(bin2hex(random_bytes(4)));
    }
}
