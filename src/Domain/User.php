<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

readonly class User
{
    public function __construct(
        private int $id,
        private string $firstname,
        private string $lastname,
        private string $pseudo,
        private string $password,
        private string $role,
        private ?string $email = null,
        private ?int $classId = null,
        private ?string $rememberToken = null,
        private ?string $createdAt = null,
        private ?string $completedAt = null
    ) {}

    // Getters
    public function getId(): int
    {
        return $this->id;
    }

    public function getFirstname(): string
    {
        return $this->firstname;
    }

    public function getLastname(): string
    {
        return $this->lastname;
    }

    public function getPseudo(): string
    {
        return $this->pseudo;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function getClassId(): ?int
    {
        return $this->classId;
    }

    public function getRememberToken(): ?string
    {
        return $this->rememberToken;
    }

    public function getCreatedAt(): ?string
    {
        return $this->createdAt;
    }

    public function getCompletedAt(): ?string
    {
        return $this->completedAt;
    }
}
