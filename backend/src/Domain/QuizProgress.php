<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

/**
 * Represents the quiz progress component.
 */
readonly class QuizProgress
{
    /**
     * Creates a new QuizProgress instance.
     */
    public function __construct(
        private int $id,
        private int $userId,
        private int $quizId,
        private string $status,
        private int $attemptCount,
        private int $currentQuestionIndex,
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
     * Returns the quiz ID.
     */
    public function getQuizId(): int
    {
        return $this->quizId;
    }

    /**
     * Returns the status.
     */
    public function getStatus(): string
    {
        return $this->status;
    }

    /**
     * Returns the attempt count.
     */
    public function getAttemptCount(): int
    {
        return $this->attemptCount;
    }

    /**
     * Returns the current question index.
     */
    public function getCurrentQuestionIndex(): int
    {
        return $this->currentQuestionIndex;
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
