<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

/**
 * Represents the user component.
 */
readonly class User
{
    /**
     * Creates a new User instance.
     */
    public function __construct(
        private int $id,
        private string $firstname,
        private string $lastname,
        private string $pseudo,
        private string $password,
        private string $role,
        private ?string $email = null,
        private ?string $emailVerifiedAt = null,
        private ?int $classId = null,
        private ?string $rememberToken = null,
        private ?string $createdAt = null,
        private ?string $completedAt = null
    ) {}

    // Getters
    /**
     * Returns the ID.
     */
    public function getId(): int
    {
        return $this->id;
    }

    /**
     * Returns the firstname.
     */
    public function getFirstname(): string
    {
        return $this->firstname;
    }

    /**
     * Returns the lastname.
     */
    public function getLastname(): string
    {
        return $this->lastname;
    }

    /**
     * Returns the pseudo.
     */
    public function getPseudo(): string
    {
        return $this->pseudo;
    }

    /**
     * Returns the email.
     */
    public function getEmail(): ?string
    {
        return $this->email;
    }

    /**
     * Returns the email verified at.
     */
    public function getEmailVerifiedAt(): ?string
    {
        return $this->emailVerifiedAt;
    }

    /**
     * Checks whether the email verified condition is met.
     */
    public function isEmailVerified(): bool
    {
        return null !== $this->email && null !== $this->emailVerifiedAt;
    }

    /**
     * Returns the password.
     */
    public function getPassword(): string
    {
        return $this->password;
    }

    /**
     * Returns the role.
     */
    public function getRole(): string
    {
        return $this->role;
    }

    /**
     * Returns the class ID.
     */
    public function getClassId(): ?int
    {
        return $this->classId;
    }

    /**
     * Returns the remember token.
     */
    public function getRememberToken(): ?string
    {
        return $this->rememberToken;
    }

    /**
     * Returns the created at.
     */
    public function getCreatedAt(): ?string
    {
        return $this->createdAt;
    }

    /**
     * Returns the completed at.
     */
    public function getCompletedAt(): ?string
    {
        return $this->completedAt;
    }
}
