<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

readonly class TeacherCode
{
    public function __construct(
        private int $id,
        private string $code,
        private string $status,
        private ?int $usedByUserId = null,
        private ?string $createdAt = null,
        private ?string $usedAt = null,
        private ?string $expiresAt = null,
        private ?int $createdByAdminId = null,
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getCode(): string
    {
        return $this->code;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function isUsed(): bool
    {
        return 'used' === $this->status;
    }

    public function getUsedByUserId(): ?int
    {
        return $this->usedByUserId;
    }

    public function getCreatedAt(): ?string
    {
        return $this->createdAt;
    }

    public function getUsedAt(): ?string
    {
        return $this->usedAt;
    }

    public function getExpiresAt(): ?string
    {
        return $this->expiresAt;
    }

    public function getCreatedByAdminId(): ?int
    {
        return $this->createdByAdminId;
    }
}
