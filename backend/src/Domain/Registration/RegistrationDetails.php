<?php

declare(strict_types=1);

namespace Matheopolis\Domain\Registration;

/**
 * Immutable data required to persist a new user account (password already hashed).
 */
final readonly class RegistrationDetails
{
    /**
     * Creates a new RegistrationDetails instance.
     */
    public function __construct(
        public string $firstname,
        public string $lastname,
        public string $pseudo,
        public string $hashedPassword,
        public string $role,
        public ?string $email,
        public ?int $classId,
    ) {}
}
