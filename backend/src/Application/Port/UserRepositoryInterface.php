<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\Registration\RegistrationDetails;
use Matheopolis\Domain\User;

interface UserRepositoryInterface
{
    public function findByLogin(string $login): ?User;

    public function find(int $id): ?User;

    public function findByIdAndToken(int $userId, string $tokenHash): ?User;

    public function setRememberToken(int $userId, ?string $tokenHash): void;

    public function insert(RegistrationDetails $details): User;

    /**
     * @param array<int, int> $classIds
     *
     * @return array<int, User>
     */
    public function findStudentsByClassIds(array $classIds): array;

    public function resetPassword(int $userId, string $passwordHash): void;

    /**
     * @return array<int, User>
     */
    public function findByRole(string $role): array;

    public function findByUsername(string $username): ?User;

    /**
     * @return array<int, User>
     */
    public function findStudentsByClassId(int $classId): array;

    public function assignStudentToClass(int $userId, int $classId): void;
}
