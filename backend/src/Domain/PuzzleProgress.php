<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

final readonly class PuzzleProgress
{
    public function __construct(
        private int $id,
        private int $studentId,
        private int $puzzleId,
        private string $status,
        private int $attemptCount,
        private ?string $startedAt = null,
        private ?string $completedAt = null,
        private ?string $lastAttemptAt = null,
        private ?string $tokenHash = null,
        private ?string $tokenExpiresAt = null,
        private ?string $tokenNonce = null,
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getStudentId(): int
    {
        return $this->studentId;
    }

    public function getPuzzleId(): int
    {
        return $this->puzzleId;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function getAttemptCount(): int
    {
        return $this->attemptCount;
    }

    public function getStartedAt(): ?string
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

    public function getTokenHash(): ?string
    {
        return $this->tokenHash;
    }

    public function getTokenExpiresAt(): ?string
    {
        return $this->tokenExpiresAt;
    }

    public function getTokenNonce(): ?string
    {
        return $this->tokenNonce;
    }
}
