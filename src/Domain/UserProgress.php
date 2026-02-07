<?php
declare(strict_types=1);

namespace Src\Domain;

readonly class UserProgress
{
    public function __construct(
        private int $userId,
        private int $chapterId,
        private string $status,
        private ?int $score = null,
        private ?string $completedAt = null
    ) {}

    // Getters
    public function getUserId(): int { return $this->userId; }
    public function getChapterId(): int { return $this->chapterId; }
    public function getStatus(): string { return $this->status; }
    public function getScore(): int { return $this->score; }
    public function getCompletedAt(): string { return $this->completedAt; }
}