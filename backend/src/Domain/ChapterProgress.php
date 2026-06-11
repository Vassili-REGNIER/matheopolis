<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

/**
 * Represents the chapter progress component.
 */
final readonly class ChapterProgress
{
    /**
     * Creates a new ChapterProgress instance.
     */
    public function __construct(
        private int $id,
        private int $userId,
        private int $chapterId,
        private string $status,
        private int $currentStepIndex,
        private ?int $score,
        private string $startedAt,
        private ?string $completedAt = null,
    ) {}

    /**
     * Returns the ID.
     */
    public function getId(): int
    {
        return $this->id;
    }

    /**
     * Returns the user ID.
     */
    public function getUserId(): int
    {
        return $this->userId;
    }

    /**
     * Returns the chapter ID.
     */
    public function getChapterId(): int
    {
        return $this->chapterId;
    }

    /**
     * Returns the status.
     */
    public function getStatus(): string
    {
        return $this->status;
    }

    /**
     * Returns the current step index.
     */
    public function getCurrentStepIndex(): int
    {
        return $this->currentStepIndex;
    }

    /**
     * Returns the score.
     */
    public function getScore(): ?int
    {
        return $this->score;
    }

    /**
     * Returns the started at.
     */
    public function getStartedAt(): string
    {
        return $this->startedAt;
    }

    /**
     * Returns the completed at.
     */
    public function getCompletedAt(): ?string
    {
        return $this->completedAt;
    }
}
