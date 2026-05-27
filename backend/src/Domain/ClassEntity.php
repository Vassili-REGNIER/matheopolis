<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

readonly class ClassEntity
{
    public function __construct(
        private int $id,
        private string $name,
        private ?string $description,
        private string $code,
        private int $teacherId,
        private ?string $createdAt = null,
        private ?string $archivedAt = null,
    ) {}

    // Getters
    public function getId(): int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function getCode(): string
    {
        return $this->code;
    }

    public function getTeacherId(): int
    {
        return $this->teacherId;
    }

    public function getCreatedAt(): ?string
    {
        return $this->createdAt;
    }

    public function getArchivedAt(): ?string
    {
        return $this->archivedAt;
    }
}
