<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

interface AuthSessionInterface
{
    public function check(): bool;

    public function id(): ?int;

    public function login(int $id): void;

    public function logout(): void;
}
