<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\PuzzleProgress;

interface ProgressRepositoryInterface
{
    /**
     * @return array<int, PuzzleProgress>
     */
    public function findByStudent(int $studentId): array;

    /**
     * @param array<int, int> $studentIds
     * @return array<int, PuzzleProgress>
     */
    public function findByStudentIds(array $studentIds): array;

    public function markSolved(int $studentId, int $puzzleId, bool $hintUnlocked): void;

    public function getMaxSolvedPuzzlePosition(int $studentId): int;
}
