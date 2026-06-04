<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

final readonly class RiddleProgress
{
    public function __construct(
        private int $id,
        private int $userId,
        private int $riddleId,
        private string $status,
        private int $currentQuestionIndex,
        private int $attemptCount,
        private string $startedAt,
        private ?string $completedAt = null,
        private ?string $lastAttemptAt = null,
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function getRiddleId(): int
    {
        return $this->riddleId;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function getCurrentQuestionIndex(): int
    {
        return $this->currentQuestionIndex;
    }

    public function getAttemptCount(): int
    {
        return $this->attemptCount;
    }

    public function getStartedAt(): string
    {
        return $this->startedAt;
    }

    public function getCompletedAt(): ?string
    {
        return $this->completedAt;
    }

    public function getLastAttemptAt(): ?string
    {
        return $this->lastAttemptAt;
    }
}
