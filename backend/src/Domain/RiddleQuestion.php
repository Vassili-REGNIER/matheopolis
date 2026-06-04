<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

final readonly class RiddleQuestion
{
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

    public function getId(): int
    {
        return $this->id;
    }

    public function getRiddleId(): int
    {
        return $this->riddleId;
    }

    public function getOrderIndex(): int
    {
        return $this->orderIndex;
    }

    public function getPrompt(): string
    {
        return $this->prompt;
    }

    public function getAnswer(): string
    {
        return $this->answer;
    }

    public function getHint(): ?string
    {
        return $this->hint;
    }

    public function getDifficulty(): int
    {
        return $this->difficulty;
    }

    public function getMetadataJson(): ?string
    {
        return $this->metadataJson;
    }
}
