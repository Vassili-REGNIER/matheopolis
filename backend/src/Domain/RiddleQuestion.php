<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

/**
 * Represents the riddle question component.
 */
final readonly class RiddleQuestion
{
    /**
     * Creates a new RiddleQuestion instance.
     */
    public function __construct(
        private int $id,
        private int $riddleId,
        private int $orderIndex,
        private string $prompt,
        private string $answer,
        private ?string $hint,
        private int $difficulty,
        private ?string $metadataJson,
    ) {}

    /**
     * Returns the ID.
     */
    public function getId(): int
    {
        return $this->id;
    }

    /**
     * Returns the riddle ID.
     */
    public function getRiddleId(): int
    {
        return $this->riddleId;
    }

    /**
     * Returns the order index.
     */
    public function getOrderIndex(): int
    {
        return $this->orderIndex;
    }

    /**
     * Returns the prompt.
     */
    public function getPrompt(): string
    {
        return $this->prompt;
    }

    /**
     * Returns the answer.
     */
    public function getAnswer(): string
    {
        return $this->answer;
    }

    /**
     * Returns the hint.
     */
    public function getHint(): ?string
    {
        return $this->hint;
    }

    /**
     * Returns the difficulty.
     */
    public function getDifficulty(): int
    {
        return $this->difficulty;
    }

    /**
     * Returns the metadata json.
     */
    public function getMetadataJson(): ?string
    {
        return $this->metadataJson;
    }
}
