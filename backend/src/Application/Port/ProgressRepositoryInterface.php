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
     *
     * @return array<int, PuzzleProgress>
     */
    public function findByStudentIds(array $studentIds): array;

    public function markSolved(int $studentId, int $puzzleId, bool $hintUnlocked): void;

    public function getMaxSolvedPuzzlePosition(int $studentId): int;

    public function findByStudentAndPuzzle(int $studentId, int $puzzleId): ?PuzzleProgress;

    public function start(int $studentId, int $puzzleId, string $tokenHash, string $tokenNonce, string $tokenExpiresAt): PuzzleProgress;

    public function addAttempt(int $studentId, int $puzzleId, string $nextTokenHash, string $nextTokenNonce, string $nextTokenExpiresAt): PuzzleProgress;

    public function refreshToken(int $studentId, int $puzzleId, string $nextTokenHash, string $nextTokenNonce, string $nextTokenExpiresAt): PuzzleProgress;

    public function complete(int $studentId, int $puzzleId): PuzzleProgress;
}
