<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

/**
 * Defines the contract for the auth session dependency.
 */
interface AuthSessionInterface
{
    /**
     * Check.
     */
    public function check(): bool;

    /**
     * Id.
     */
    public function id(): ?int;

    /**
     * Login.
     */
    public function login(int $id): void;

    /**
     * Logout.
     */
    public function logout(): void;
}
