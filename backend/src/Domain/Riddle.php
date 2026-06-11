<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

/**
 * Represents the riddle component.
 */
final readonly class Riddle
{
    /**
     * Creates a new Riddle instance.
     */
    public function __construct(
        private int $id,
        private int $stepId,
        private int $chapterId,
        private string $slug,
        private string $gameId,
        private string $mode,
        private string $title,
        private string $instruction,
        private ?string $introText,
        private string $completionMessage,
        private ?string $gameParamsJson,
    ) {}

    /**
     * Returns the ID.
     */
    public function getId(): int
    {
        return $this->id;
    }

    /**
     * Returns the step ID.
     */
    public function getStepId(): int
    {
        return $this->stepId;
    }

    /**
     * Returns the chapter ID.
     */
    public function getChapterId(): int
    {
        return $this->chapterId;
    }

    /**
     * Returns the slug.
     */
    public function getSlug(): string
    {
        return $this->slug;
    }

    /**
     * Returns the game ID.
     */
    public function getGameId(): string
    {
        return $this->gameId;
    }

    /**
     * Returns the mode.
     */
    public function getMode(): string
    {
        return $this->mode;
    }

    /**
     * Returns the title.
     */
    public function getTitle(): string
    {
        return $this->title;
    }

    /**
     * Returns the instruction.
     */
    public function getInstruction(): string
    {
        return $this->instruction;
    }

    /**
     * Returns the intro text.
     */
    public function getIntroText(): ?string
    {
        return $this->introText;
    }

    /**
     * Returns the completion message.
     */
    public function getCompletionMessage(): string
    {
        return $this->completionMessage;
    }

    /**
     * Returns the game params json.
     */
    public function getGameParamsJson(): ?string
    {
        return $this->gameParamsJson;
    }

    /**
     * Checks whether the practice condition is met.
     */
    public function isPractice(): bool
    {
        return 'practice' === $this->mode;
    }
}
