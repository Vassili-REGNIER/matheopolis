<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Repository;

use Matheopolis\Application\Port\ProgressRepositoryInterface;
use Matheopolis\Domain\PuzzleProgress;
use Matheopolis\Infrastructure\Persistence\AbstractRepository;

final class ProgressRepository extends AbstractRepository implements ProgressRepositoryInterface
{
    /**
     * @return array<int, PuzzleProgress>
     */
    public function findByStudent(int $studentId): array
    {
        $stmt = $this->db->execute('SELECT * FROM puzzle_progress WHERE student_id = :student_id ORDER BY puzzle_id ASC', [
            'student_id' => $studentId,
        ]);

        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = $this->mapToEntity($row);
        }

        return $items;
    }

    /**
     * @param array<int, int> $studentIds
     * @return array<int, PuzzleProgress>
     */
    public function findByStudentIds(array $studentIds): array
    {
        if ([] === $studentIds) {
            return [];
        }

        $placeholders = [];
        $params = [];
        foreach ($studentIds as $index => $studentId) {
            $key = 'student_'.$index;
            $params[$key] = $studentId;
            $placeholders[] = ':'.$key;
        }

        $stmt = $this->db->execute(
            'SELECT * FROM puzzle_progress WHERE student_id IN ('.implode(', ', $placeholders).')',
            $params,
        );

        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = $this->mapToEntity($row);
        }

        return $items;
    }

    public function markSolved(int $studentId, int $puzzleId, bool $hintUnlocked): void
    {
        $query = 'INSERT INTO puzzle_progress (student_id, puzzle_id, is_solved, hint_unlocked, solved_at)
            VALUES (:student_id, :puzzle_id, 1, :hint_unlocked, :solved_at)
            ON DUPLICATE KEY UPDATE is_solved = 1, hint_unlocked = :hint_unlocked_update, solved_at = :solved_at_update';

        $now = date('Y-m-d H:i:s');
        $this->db->execute($query, [
            'student_id' => $studentId,
            'puzzle_id' => $puzzleId,
            'hint_unlocked' => $hintUnlocked ? 1 : 0,
            'solved_at' => $now,
            'hint_unlocked_update' => $hintUnlocked ? 1 : 0,
            'solved_at_update' => $now,
        ]);
    }

    public function getMaxSolvedPuzzlePosition(int $studentId): int
    {
        $stmt = $this->db->execute(
            'SELECT MAX(p.position) AS max_position
             FROM puzzle_progress pp
             INNER JOIN puzzles p ON p.id = pp.puzzle_id
             WHERE pp.student_id = :student_id AND pp.is_solved = 1',
            ['student_id' => $studentId],
        );
        $row = $stmt->fetch();
        if (null === $row) {
            return 0;
        }

        return $this->rowInt($row, 'max_position', 0);
    }

    protected function getTableName(): string
    {
        return 'puzzle_progress';
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function mapToEntity(array $row): PuzzleProgress
    {
        return new PuzzleProgress(
            $this->rowInt($row, 'id'),
            $this->rowInt($row, 'student_id'),
            $this->rowInt($row, 'puzzle_id'),
            $this->rowBool($row, 'is_solved'),
            $this->rowBool($row, 'hint_unlocked'),
            $this->rowStrOrNull($row, 'solved_at'),
        );
    }
}
