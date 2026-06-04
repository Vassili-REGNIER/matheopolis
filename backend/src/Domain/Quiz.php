<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

readonly class Quiz
{
    public function __construct(
        private int $id,
        private string $title,
        private ?string $description,
        private int $creatorId,
        private string $status,
        private bool $askAdmin,
        private int $position,
        private ?string $createdAt = null,
        private ?string $updatedAt = null,
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function getCreatorId(): int
    {
        return $this->creatorId;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function isAskAdmin(): bool
    {
        return $this->askAdmin;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function getCreatedAt(): ?string
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?string
    {
        return $this->updatedAt;
    }
}
