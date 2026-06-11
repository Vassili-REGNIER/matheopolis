<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\ClassEntity;

/**
 * Defines the contract for the classroom repository dependency.
 */
interface ClassroomRepositoryInterface
{
    /**
     * Finds matching records for the requested criteria.
     */
    public function findByCode(string $code): ?ClassEntity;

    /**
     * @return array<int, ClassEntity>
     */
    public function findByTeacher(int $teacherId): array;

    /**
     * Finds matching records for the requested criteria.
     */
    public function find(int $id): ?ClassEntity;

    /**
     * Insert.
     */
    public function insert(string $name, ?string $description, string $code, int $teacherId, string $level = 'grade_6'): ClassEntity;

    /**
     * Updates the requested resource.
     */
    public function update(int $id, string $name, ?string $description, string $level): ?ClassEntity;

    /**
     * Archive.
     */
    public function archive(int $id): void;
}
