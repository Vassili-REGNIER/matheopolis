<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

readonly class QuizProgress
{
    public function __construct(
        private int $id,
        private int $studentId,
        private int $quizId,
        private string $status,
        private int $attemptCount,
        private int $currentQuestionIndex,
        private ?int $lastScore,
        private ?int $bestScore,
        private string $startedAt,
        private ?string $completedAt = null,
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getStudentId(): int
    {
        return $this->studentId;
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

    public function getLastScore(): ?int
    {
        return $this->lastScore;
    }

    public function getBestScore(): ?int
    {
        return $this->bestScore;
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
