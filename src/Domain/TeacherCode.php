<?php
declare(strict_types=1);

namespace Src\Domain;

readonly class TeacherCode
{
    public function __construct(
        private int $id,
        private string $code,
        private ?bool $isUsed,
        private ?int $usedByUserId = null,
        private ?string $createdAt = null
    ) {}

    public function getId(): int { return $this->id; }
    public function getCode(): string { return $this->code; }
    public function isUsed(): bool { return $this->isUsed; }
    public function getUsedByUserId(): ?int { return $this->usedByUserId; }
    public function getCreatedAt(): ?string { return $this->createdAt; }
}