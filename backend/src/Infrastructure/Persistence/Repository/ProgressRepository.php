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
        $stmt = $this->db->execute('SELECT * FROM riddle_progressions WHERE student_id = :student_id ORDER BY riddle_id ASC', [
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
     *
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
            'SELECT * FROM riddle_progressions WHERE student_id IN ('.implode(', ', $placeholders).')',
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
        $this->complete($studentId, $puzzleId);
    }

    public function getMaxSolvedPuzzlePosition(int $studentId): int
    {
        $stmt = $this->db->execute(
            'SELECT MAX(r.position) AS max_position
             FROM riddle_progressions rp
             INNER JOIN riddles r ON r.id = rp.riddle_id
             WHERE rp.student_id = :student_id AND rp.status = :status',
            ['student_id' => $studentId, 'status' => 'completed'],
        );
        $row = $stmt->fetch();
        if (null === $row) {
            return 0;
        }

        return $this->rowInt($row, 'max_position', 0);
    }

    public function findByStudentAndPuzzle(int $studentId, int $puzzleId): ?PuzzleProgress
    {
        $stmt = $this->db->execute(
            'SELECT * FROM riddle_progressions WHERE student_id = :student_id AND riddle_id = :riddle_id LIMIT 1',
            ['student_id' => $studentId, 'riddle_id' => $puzzleId],
        );
        $row = $stmt->fetch();

        return null !== $row ? $this->mapToEntity($row) : null;
    }

    public function start(int $studentId, int $puzzleId, string $tokenHash, string $tokenNonce, string $tokenExpiresAt): PuzzleProgress
    {
        $now = date('Y-m-d H:i:s');
        $this->db->execute(
            'INSERT INTO riddle_progressions (student_id, riddle_id, status, attempt_count, started_at, last_attempt_at, completed_at, play_token_hash, token_nonce, token_expires_at)
             VALUES (:student_id, :riddle_id, :status, 0, :started_at, NULL, NULL, :play_token_hash, :token_nonce, :token_expires_at)',
            [
                'student_id' => $studentId,
                'riddle_id' => $puzzleId,
                'status' => 'in_progress',
                'started_at' => $now,
                'play_token_hash' => $tokenHash,
                'token_nonce' => $tokenNonce,
                'token_expires_at' => $tokenExpiresAt,
            ],
        );

        $created = $this->findByStudentAndPuzzle($studentId, $puzzleId);
        if (null === $created) {
            throw new \RuntimeException('Failed to create riddle progress.');
        }

        return $created;
    }

    public function addAttempt(int $studentId, int $puzzleId, string $nextTokenHash, string $nextTokenNonce, string $nextTokenExpiresAt): PuzzleProgress
    {
        $now = date('Y-m-d H:i:s');
        $this->db->execute(
            'UPDATE riddle_progressions
             SET status = :status,
                 attempt_count = attempt_count + 1,
                 last_attempt_at = :last_attempt_at,
                 play_token_hash = :play_token_hash,
                 token_nonce = :token_nonce,
                 token_expires_at = :token_expires_at
             WHERE student_id = :student_id AND riddle_id = :riddle_id',
            [
                'status' => 'in_progress',
                'last_attempt_at' => $now,
                'play_token_hash' => $nextTokenHash,
                'token_nonce' => $nextTokenNonce,
                'token_expires_at' => $nextTokenExpiresAt,
                'student_id' => $studentId,
                'riddle_id' => $puzzleId,
            ],
        );

        $updated = $this->findByStudentAndPuzzle($studentId, $puzzleId);
        if (null === $updated) {
            throw new \RuntimeException('Failed to update riddle progress.');
        }

        return $updated;
    }

    public function refreshToken(int $studentId, int $puzzleId, string $nextTokenHash, string $nextTokenNonce, string $nextTokenExpiresAt): PuzzleProgress
    {
        $this->db->execute(
            'UPDATE riddle_progressions
             SET play_token_hash = :play_token_hash,
                 token_nonce = :token_nonce,
                 token_expires_at = :token_expires_at
             WHERE student_id = :student_id AND riddle_id = :riddle_id',
            [
                'play_token_hash' => $nextTokenHash,
                'token_nonce' => $nextTokenNonce,
                'token_expires_at' => $nextTokenExpiresAt,
                'student_id' => $studentId,
                'riddle_id' => $puzzleId,
            ],
        );

        $updated = $this->findByStudentAndPuzzle($studentId, $puzzleId);
        if (null === $updated) {
            throw new \RuntimeException('Failed to refresh riddle token.');
        }

        return $updated;
    }

    public function complete(int $studentId, int $puzzleId): PuzzleProgress
    {
        $now = date('Y-m-d H:i:s');
        $this->db->execute(
            'UPDATE riddle_progressions
             SET status = :status,
                 completed_at = :completed_at,
                 play_token_hash = NULL,
                 token_nonce = NULL,
                 token_expires_at = NULL
             WHERE student_id = :student_id AND riddle_id = :riddle_id',
            [
                'status' => 'completed',
                'completed_at' => $now,
                'student_id' => $studentId,
                'riddle_id' => $puzzleId,
            ],
        );

        $updated = $this->findByStudentAndPuzzle($studentId, $puzzleId);
        if (null === $updated) {
            throw new \RuntimeException('Failed to complete riddle progress.');
        }

        return $updated;
    }

    protected function getTableName(): string
    {
        return 'riddle_progressions';
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function mapToEntity(array $row): PuzzleProgress
    {
        return new PuzzleProgress(
            $this->rowInt($row, 'id'),
            $this->rowInt($row, 'student_id'),
            $this->rowInt($row, 'riddle_id'),
            $this->rowStr($row, 'status', 'in_progress'),
            $this->rowInt($row, 'attempt_count', 0),
            $this->rowStrOrNull($row, 'started_at'),
            $this->rowStrOrNull($row, 'completed_at'),
            $this->rowStrOrNull($row, 'last_attempt_at'),
            $this->rowStrOrNull($row, 'play_token_hash'),
            $this->rowStrOrNull($row, 'token_expires_at'),
            $this->rowStrOrNull($row, 'token_nonce'),
        );
    }
}
