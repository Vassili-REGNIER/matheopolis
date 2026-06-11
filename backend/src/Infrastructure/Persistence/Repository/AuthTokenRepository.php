<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Repository;

use Matheopolis\Application\Port\AuthTokenRepositoryInterface;
use Matheopolis\Infrastructure\Persistence\AbstractRepository;

/**
 * Persists and retrieves auth token records.
 */
final class AuthTokenRepository extends AbstractRepository implements AuthTokenRepositoryInterface
{
    /**
     * Creates the requested resource.
     */
    public function create(int $userId, string $tokenHash, string $type, string $expiresAt): void
    {
        $this->db->execute(
            'INSERT INTO auth_tokens (user_id, token_hash, type, expires_at, created_at)
             VALUES (:user_id, :token_hash, :type, :expires_at, :created_at)',
            [
                'user_id' => $userId,
                'token_hash' => $tokenHash,
                'type' => $type,
                'expires_at' => $expiresAt,
                'created_at' => $this->utcNowSql(),
            ],
        );
    }

    /**
     * Finds matching records for the requested criteria.
     */
    public function findValidUserIdByTokenHash(string $tokenHash, string $type): ?int
    {
        $stmt = $this->db->execute(
            'SELECT user_id FROM auth_tokens
             WHERE token_hash = :token_hash AND type = :type AND expires_at > :now
             LIMIT 1',
            [
                'token_hash' => $tokenHash,
                'type' => $type,
                'now' => $this->utcNowSql(),
            ],
        );
        $row = $stmt->fetch();
        if (null === $row) {
            return null;
        }

        return $this->rowInt($row, 'user_id');
    }

    /**
     * Deletes the requested resource.
     */
    public function deleteByUserAndType(int $userId, string $type): void
    {
        $this->db->execute(
            'DELETE FROM auth_tokens WHERE user_id = :user_id AND type = :type',
            ['user_id' => $userId, 'type' => $type],
        );
    }

    /**
     * Deletes the requested resource.
     */
    public function deleteByTokenHash(string $tokenHash): void
    {
        $this->db->execute(
            'DELETE FROM auth_tokens WHERE token_hash = :token_hash',
            ['token_hash' => $tokenHash],
        );
    }

    /**
     * Returns the table name.
     */
    protected function getTableName(): string
    {
        return 'auth_tokens';
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function mapToEntity(array $row): object
    {
        return (object) $row;
    }
}
