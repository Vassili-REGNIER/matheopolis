<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

/**
 * Represents the riddle progress component.
 */
final readonly class RiddleProgress
{
    /**
     * Creates a new RiddleProgress instance.
     */
    public function __construct(
        private int $id,
        private int $userId,
        private int $riddleId,
        private string $status,
        private int $currentQuestionIndex,
        private int $attemptCount,
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
     * Returns the riddle ID.
     */
    public function getRiddleId(): int
    {
        return $this->riddleId;
    }

    /**
     * Returns the status.
     */
    public function getStatus(): string
    {
        return $this->status;
    }

    /**
     * Returns the current question index.
     */
    public function getCurrentQuestionIndex(): int
    {
        return $this->currentQuestionIndex;
    }

    /**
     * Returns the attempt count.
     */
    public function getAttemptCount(): int
    {
        return $this->attemptCount;
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
