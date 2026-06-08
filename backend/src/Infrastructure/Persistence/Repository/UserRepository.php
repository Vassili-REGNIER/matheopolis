<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Repository;

use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Domain\Registration\RegistrationDetails;
use Matheopolis\Domain\User;
use Matheopolis\Infrastructure\Persistence\AbstractRepository;

final class UserRepository extends AbstractRepository implements UserRepositoryInterface
{
    public function findByLogin(string $login): ?User
    {
        $query = 'SELECT * FROM users WHERE username = :login OR email = :login LIMIT 1';
        $row = $this->db->execute($query, ['login' => $login])->fetch();

        return null !== $row ? $this->mapToEntity($row) : null;
    }

    public function find(int $id): ?User
    {
        $entity = parent::find($id);

        return $entity instanceof User ? $entity : null;
    }

    public function findByIdAndToken(int $userId, string $tokenHash): ?User
    {
        return $this->find($userId);
    }

    public function setRememberToken(int $userId, ?string $tokenHash): void
    {
        // Remember-me tokens are not persisted in the current schema.
    }

    public function insert(RegistrationDetails $details): User
    {
        $query = 'INSERT INTO users (first_name, last_name, username, email, password_hash, role, class_id, created_at)
                  VALUES (:first_name, :last_name, :username, :email, :password_hash, :role, :class_id, :created_at)';
        $now = date('Y-m-d H:i:s');
        $params = [
            'first_name' => $details->firstname,
            'last_name' => $details->lastname,
            'username' => $details->pseudo,
            'email' => $details->email,
            'password_hash' => $details->hashedPassword,
            'role' => $details->role,
            'class_id' => $details->classId,
            'created_at' => $now,
        ];
        $this->db->execute($query, $params);
        $id = $this->db->lastInsertId();

        return new User(
            $id,
            $details->firstname,
            $details->lastname,
            $details->pseudo,
            $details->hashedPassword,
            $details->role,
            $details->email,
            null,
            $details->classId,
            null,
            $now,
            $now,
        );
    }

    /**
     * @param array<int, int> $classIds
     *
     * @return array<int, User>
     */
    public function findStudentsByClassIds(array $classIds): array
    {
        if ([] === $classIds) {
            return [];
        }

        $placeholders = [];
        $params = [];
        foreach ($classIds as $index => $classId) {
            $key = 'class_'.$index;
            $placeholders[] = ':'.$key;
            $params[$key] = $classId;
        }

        $query = 'SELECT * FROM users WHERE role = :role AND class_id IN ('.implode(', ', $placeholders).') ORDER BY last_name, first_name';
        $params['role'] = 'student';
        $stmt = $this->db->execute($query, $params);

        $users = [];
        foreach ($stmt->fetchAll() as $row) {
            $users[] = $this->mapToEntity($row);
        }

        return $users;
    }

    public function resetPassword(int $userId, string $passwordHash): void
    {
        $query = 'UPDATE users SET password_hash = :password_hash WHERE id = :id';
        $this->db->execute($query, [
            'id' => $userId,
            'password_hash' => $passwordHash,
        ]);
    }

    /**
     * @return array<int, User>
     */
    public function findByRole(string $role): array
    {
        $query = 'SELECT * FROM users WHERE role = :role ORDER BY last_name, first_name';
        $stmt = $this->db->execute($query, ['role' => $role]);

        $users = [];
        foreach ($stmt->fetchAll() as $row) {
            $users[] = $this->mapToEntity($row);
        }

        return $users;
    }

    public function findByUsername(string $username): ?User
    {
        $stmt = $this->db->execute('SELECT * FROM users WHERE username = :username LIMIT 1', ['username' => $username]);
        $row = $stmt->fetch();

        return null !== $row ? $this->mapToEntity($row) : null;
    }

    /**
     * @return array<int, User>
     */
    public function findStudentsByClassId(int $classId): array
    {
        $stmt = $this->db->execute(
            'SELECT * FROM users WHERE role = :role AND class_id = :class_id ORDER BY last_name ASC, first_name ASC',
            ['role' => 'student', 'class_id' => $classId],
        );

        $users = [];
        foreach ($stmt->fetchAll() as $row) {
            $users[] = $this->mapToEntity($row);
        }

        return $users;
    }

    public function assignStudentToClass(int $userId, int $classId): void
    {
        $this->db->execute(
            'UPDATE users SET class_id = :class_id WHERE id = :id AND role = :role',
            ['id' => $userId, 'class_id' => $classId, 'role' => 'student'],
        );
    }

    public function markEmailVerified(int $userId): void
    {
        $this->db->execute(
            'UPDATE users SET email_verified_at = :verified_at WHERE id = :id',
            ['id' => $userId, 'verified_at' => date('Y-m-d H:i:s')],
        );
    }

    protected function getTableName(): string
    {
        return 'users';
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function mapToEntity(array $row): User
    {
        return new User(
            $this->rowInt($row, 'id'),
            $this->rowStr($row, 'first_name'),
            $this->rowStr($row, 'last_name'),
            $this->rowStr($row, 'username'),
            $this->rowStr($row, 'password_hash'),
            $this->rowStr($row, 'role'),
            $this->rowStrOrNull($row, 'email'),
            $this->rowStrOrNull($row, 'email_verified_at'),
            $this->rowIntOrNull($row, 'class_id'),
            null,
            $this->rowStrOrNull($row, 'created_at'),
            $this->rowStrOrNull($row, 'last_active'),
        );
    }
}
