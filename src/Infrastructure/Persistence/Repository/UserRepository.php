<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Repository;

use Matheopolis\Domain\Registration\RegistrationDetails;
use Matheopolis\Domain\Repository\UserRepositoryInterface;
use Matheopolis\Domain\User;
use Matheopolis\Infrastructure\Persistence\AbstractRepository;

final class UserRepository extends AbstractRepository implements UserRepositoryInterface
{
    public function findByLogin(string $login): ?User
    {
        $query = 'SELECT * FROM users WHERE pseudo = :login OR email = :login LIMIT 1';
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
        $query = 'SELECT * FROM users WHERE id = :id AND remember_token = :token LIMIT 1';
        $stmt = $this->db->execute($query, [
            'id' => $userId,
            'token' => $tokenHash,
        ]);
        $row = $stmt->fetch();

        return null !== $row ? $this->mapToEntity($row) : null;
    }

    public function setRememberToken(int $userId, ?string $tokenHash): void
    {
        $query = 'UPDATE users SET remember_token = :token WHERE id = :id';
        $this->db->execute($query, [
            'token' => $tokenHash,
            'id' => $userId,
        ]);
    }

    public function insert(RegistrationDetails $details): User
    {
        $query = 'INSERT INTO users (firstname, lastname, pseudo, email, password, role, class_id, created_at)
                  VALUES (:firstname, :lastname, :pseudo, :email, :password, :role, :class_id, :created_at)';
        $now = date('Y-m-d H:i:s');
        $params = [
            'firstname' => $details->firstname,
            'lastname' => $details->lastname,
            'pseudo' => $details->pseudo,
            'email' => $details->email,
            'password' => $details->hashedPassword,
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
            $details->classId,
            null,
            $now,
            $now,
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
            $this->rowStr($row, 'firstname'),
            $this->rowStr($row, 'lastname'),
            $this->rowStr($row, 'pseudo'),
            $this->rowStr($row, 'password'),
            $this->rowStr($row, 'role'),
            $this->rowStrOrNull($row, 'email'),
            $this->rowIntOrNull($row, 'class_id'),
            $this->rowStrOrNull($row, 'remember_token'),
            $this->rowStrOrNull($row, 'created_at'),
            $this->rowStrOrNull($row, 'updated_at'),
        );
    }
}
