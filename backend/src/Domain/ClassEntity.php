<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

/**
 * Represents the class entity component.
 */
readonly class ClassEntity
{
    /**
     * Creates a new ClassEntity instance.
     */
    public function __construct(
        private int $id,
        private string $name,
        private ?string $description,
        private string $code,
        private int $teacherId,
        private string $level,
        private ?string $createdAt = null,
        private ?string $archivedAt = null,
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
     * Returns the name.
     */
    public function getName(): string
    {
        return $this->name;
    }

    /**
     * Returns the description.
     */
    public function getDescription(): ?string
    {
        return $this->description;
    }

    /**
     * Returns the code.
     */
    public function getCode(): string
    {
        return $this->code;
    }

    /**
     * Returns the teacher ID.
     */
    public function getTeacherId(): int
    {
        return $this->teacherId;
    }

    /**
     * Returns the level.
     */
    public function getLevel(): string
    {
        return $this->level;
    }

    /**
     * Returns the created at.
     */
    public function getCreatedAt(): ?string
    {
        return $this->createdAt;
    }

    /**
     * Returns the archived at.
     */
    public function getArchivedAt(): ?string
    {
        return $this->archivedAt;
    }
}
