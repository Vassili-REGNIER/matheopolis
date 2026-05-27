<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

final readonly class Puzzle
{
    public function __construct(
        private int $id,
        private string $slug,
        private string $title,
        private string $statement,
        private int $position,
        private bool $isActive = true,
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getSlug(): string
    {
        return $this->slug;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getStatement(): string
    {
        return $this->statement;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }
}
