<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

interface AuthTokenRepositoryInterface
{
    public function create(int $userId, string $tokenHash, string $type, string $expiresAt): void;

    public function findValidUserIdByTokenHash(string $tokenHash, string $type): ?int;

    public function deleteByUserAndType(int $userId, string $type): void;

    public function deleteByTokenHash(string $tokenHash): void;
}
