<?php

declare(strict_types=1);

namespace Matheopolis\Domain\Repository;

use Matheopolis\Domain\Registration\RegistrationDetails;
use Matheopolis\Domain\User;

interface UserRepositoryInterface
{
    public function findByLogin(string $login): ?User;

    public function find(int $id): ?User;

    public function findByIdAndToken(int $userId, string $tokenHash): ?User;

    public function setRememberToken(int $userId, ?string $tokenHash): void;

    public function insert(RegistrationDetails $details): User;
}
