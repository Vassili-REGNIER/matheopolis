<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

final readonly class ChapterProgress
{
    public function __construct(
        private int $id,
        private int $userId,
        private int $chapterId,
        private string $status,
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

    public function getChapterId(): int
    {
        return $this->chapterId;
    }

    public function getStatus(): string
    {
        return $this->status;
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
