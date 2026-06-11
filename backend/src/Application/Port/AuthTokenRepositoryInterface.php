<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

/**
 * Defines the contract for the auth token repository dependency.
 */
interface AuthTokenRepositoryInterface
{
    /**
     * Creates the requested resource.
     */
    public function create(int $userId, string $tokenHash, string $type, string $expiresAt): void;

    /**
     * Finds matching records for the requested criteria.
     */
    public function findValidUserIdByTokenHash(string $tokenHash, string $type): ?int;

    /**
     * Deletes the requested resource.
     */
    public function deleteByUserAndType(int $userId, string $type): void;

    /**
     * Deletes the requested resource.
     */
    public function deleteByTokenHash(string $tokenHash): void;
}
