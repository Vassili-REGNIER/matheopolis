<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\ClassEntity;

interface ClassroomRepositoryInterface
{
    public function findByCode(string $code): ?ClassEntity;

    /**
     * @return array<int, ClassEntity>
     */
    public function findByTeacher(int $teacherId): array;

    public function find(int $id): ?ClassEntity;

    public function insert(string $name, ?string $description, string $code, int $teacherId): ClassEntity;

    public function update(int $id, string $name, ?string $description): ?ClassEntity;

    public function archive(int $id): void;
}
