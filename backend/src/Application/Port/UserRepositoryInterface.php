<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\Registration\RegistrationDetails;
use Matheopolis\Domain\User;

/**
 * Defines the contract for the user repository dependency.
 */
interface UserRepositoryInterface
{
    /**
     * Finds matching records for the requested criteria.
     */
    public function findByLogin(string $login): ?User;

    /**
     * Finds matching records for the requested criteria.
     */
    public function find(int $id): ?User;

    /**
     * Finds matching records for the requested criteria.
     */
    public function findByIdAndToken(int $userId, string $tokenHash): ?User;

    /**
     * Updates the remember token.
     */
    public function setRememberToken(int $userId, ?string $tokenHash): void;

    /**
     * Insert.
     */
    public function insert(RegistrationDetails $details): User;

    /**
     * @param array<int, int> $classIds
     *
     * @return array<int, User>
     */
    public function findStudentsByClassIds(array $classIds): array;

    /**
     * Deletes the requested resource.
     */
    public function delete(int $id): void;

    /**
     * Resets the requested state.
     */
    public function resetPassword(int $userId, string $passwordHash): void;

    /**
     * @return array<int, User>
     */
    public function findByRole(string $role): array;

    /**
     * Finds matching records for the requested criteria.
     */
    public function findByUsername(string $username): ?User;

    /**
     * @return array<int, User>
     */
    public function findStudentsByClassId(int $classId): array;

    /**
     * Assign student to class.
     */
    public function assignStudentToClass(int $userId, int $classId): void;

    /**
     * Mark email verified.
     */
    public function markEmailVerified(int $userId): void;
}
