<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Support\Fixture;

use Matheopolis\Infrastructure\Persistence\Database\Queryable;

final class TestUserFactory
{
    /** Bcrypt hash for the plaintext password `password`. */
    public const DEMO_PASSWORD_HASH = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

    public static function insert(
        Queryable $db,
        string $username,
        string $role,
        ?int $classId = null,
        string $passwordHash = self::DEMO_PASSWORD_HASH,
    ): int {
        $db->execute(
            'INSERT INTO users (first_name, last_name, username, email, password_hash, role, class_id, created_at)
             VALUES (:first_name, :last_name, :username, NULL, :password_hash, :role, :class_id, :created_at)',
            [
                'first_name' => 'Test',
                'last_name' => 'User',
                'username' => $username,
                'password_hash' => $passwordHash,
                'role' => $role,
                'class_id' => $classId,
                'created_at' => '2026-01-01 00:00:00',
            ],
        );

        $row = $db->execute('SELECT id FROM users WHERE username = :username LIMIT 1', ['username' => $username])->fetch();
        if (null === $row) {
            throw new \RuntimeException('Failed to insert test user.');
        }

        return (int) $row['id'];
    }
}
