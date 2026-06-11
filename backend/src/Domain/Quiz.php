<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

/**
 * Represents the quiz component.
 */
readonly class Quiz
{
    /**
     * Creates a new Quiz instance.
     */
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

    /**
     * Returns the ID.
     */
    public function getId(): int
    {
        return $this->id;
    }

    /**
     * Returns the title.
     */
    public function getTitle(): string
    {
        return $this->title;
    }

    /**
     * Returns the description.
     */
    public function getDescription(): ?string
    {
        return $this->description;
    }

    /**
     * Returns the creator ID.
     */
    public function getCreatorId(): int
    {
        return $this->creatorId;
    }

    /**
     * Returns the status.
     */
    public function getStatus(): string
    {
        return $this->status;
    }

    /**
     * Checks whether the ask admin condition is met.
     */
    public function isAskAdmin(): bool
    {
        return $this->askAdmin;
    }

    /**
     * Returns the position.
     */
    public function getPosition(): int
    {
        return $this->position;
    }

    /**
     * Returns the created at.
     */
    public function getCreatedAt(): ?string
    {
        return $this->createdAt;
    }

    /**
     * Returns the updated at.
     */
    public function getUpdatedAt(): ?string
    {
        return $this->updatedAt;
    }
}
