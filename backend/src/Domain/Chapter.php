<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

/**
 * Represents the chapter component.
 */
final readonly class Chapter
{
    /**
     * Creates a new Chapter instance.
     */
    public function __construct(
        private int $id,
        private string $slug,
        private string $title,
        private ?string $statement,
        private int $position,
    ) {}

    /**
     * Returns the ID.
     */
    public function getId(): int
    {
        return $this->id;
    }

    /**
     * Returns the slug.
     */
    public function getSlug(): string
    {
        return $this->slug;
    }

    /**
     * Returns the title.
     */
    public function getTitle(): string
    {
        return $this->title;
    }

    /**
     * Returns the statement.
     */
    public function getStatement(): ?string
    {
        return $this->statement;
    }

    /**
     * Returns the position.
     */
    public function getPosition(): int
    {
        return $this->position;
    }
}
