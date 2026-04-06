<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

readonly class TeacherCode
{
    public function __construct(
        private int $id,
        private string $code,
        private bool $used,
        private ?int $usedByUserId = null,
        private ?string $createdAt = null,
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getCode(): string
    {
        return $this->code;
    }

    public function isUsed(): bool
    {
        return $this->used;
    }

    public function getUsedByUserId(): ?int
    {
        return $this->usedByUserId;
    }

    public function getCreatedAt(): ?string
    {
        return $this->createdAt;
    }
}
