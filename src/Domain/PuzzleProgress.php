<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

final readonly class PuzzleProgress
{
    public function __construct(
        private int $id,
        private int $studentId,
        private int $puzzleId,
        private bool $isSolved,
        private bool $hintUnlocked,
        private ?string $solvedAt = null,
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

    public function isSolved(): bool
    {
        return $this->isSolved;
    }

    public function isHintUnlocked(): bool
    {
        return $this->hintUnlocked;
    }

    public function getSolvedAt(): ?string
    {
        return $this->solvedAt;
    }
}
