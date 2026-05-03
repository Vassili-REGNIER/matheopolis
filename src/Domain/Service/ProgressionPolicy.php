<?php

declare(strict_types=1);

namespace Matheopolis\Domain\Service;

final class ProgressionPolicy
{
    public function canAccessPuzzle(int $puzzlePosition, int $maxSolvedPosition): bool
    {
        return $puzzlePosition <= ($maxSolvedPosition + 1);
    }

    public function hintCanBeUnlocked(bool $isSolved): bool
    {
        return !$isSolved;
    }
}
