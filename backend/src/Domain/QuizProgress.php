<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

readonly class QuizProgress
{
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

    public function getId(): int
    {
        return $this->id;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function getQuizId(): int
    {
        return $this->quizId;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function getAttemptCount(): int
    {
        return $this->attemptCount;
    }

    public function getCurrentQuestionIndex(): int
    {
        return $this->currentQuestionIndex;
    }

    public function getScore(): ?int
    {
        return $this->score;
    }

    public function getStartedAt(): string
    {
        return $this->startedAt;
    }

    public function getCompletedAt(): ?string
    {
        return $this->completedAt;
    }
}
