<?php
declare(strict_types=1);

namespace Src\Repository;

use Core\Repository;
use Src\Domain\User;
use Src\DTO\RegisterData;

class UserRepository extends Repository
{
    protected function getTableName(): string
    {
        return 'users';
    }

    protected function mapToEntity(array $row): User
    {
        return new User(
            (int)$row['id'],
            $row['firstname'],
            $row['lastname'],
            $row['pseudo'],
            $row['password'],
            $row['role'],
            $row['email'] ?? null
        );
    }

    /**
     * Insère un nouvel utilisateur en base de données.
     * @param RegisterData $data Les données préparées (password déjà haché)
     */
    public function create(RegisterData $data): User
    {
        $query = "INSERT INTO users (firstname, lastname, pseudo, email, password, role, class_id, created_at) 
                  VALUES (:firstname, :lastname, :pseudo, :email, :password, :role, :class_id, :created_at)";

        // On s'assure que les champs optionnels sont bien gérés (null si inexistant)
        $params = [
            'firstname'  => $data->firstname,
            'lastname'   => $data->lastname,
            'pseudo'     => $data->pseudo,
            'email'      => $data->email ?? null,      // Peut être null pour les élèves
            'password'   => $data->password,           // Déjà haché par le service
            'role'       => $data->role,
            'class_id'   => $data->class_id ?? null,   // Null pour les profs/standard
            'created_at' => date('Y-m-d H:i:s')
        ];

        $this->db->execute($query, $params);

        return new User(
            $this->db->lastInsertId(),
            $data->firstname,
            $data->lastname,
            $data->pseudo,
            $data->password,
            $data->role,
            $data->email,
            $data->classId,
            null, // No remember token
            $data->createdAt,
            $data->createdAt // Updated at
        );
    }
    public function findByLogin(string $login): ?User
    {
        // On cherche par pseudo ou email
        $query = "SELECT * FROM users WHERE pseudo = :login OR email = :login LIMIT 1";
        $row = $this->db->execute($query, ['login' => $login])->fetch();

        if (!$row) {
            return null;
        }

        return $this->mapToEntity($row);
    }

    /**
     * Stores the hash of the "Remember Me" token for a user.
     */
    public function setRememberToken(int $userId, ?string $tokenHash): void
    {
        // If the token is null, it is removed (logout)
        $query = "UPDATE users SET remember_token = :token WHERE id = :id";
        $this->db->execute($query, [
            'token' => $tokenHash,
            'id'    => $userId
        ]);
    }

    /**
     * Retrieves a user by their ID and token.
     */
    public function findByIdAndToken(int $userId, string $tokenHash): ?User
    {
        $query = "SELECT * FROM users WHERE id = :id AND remember_token = :token LIMIT 1";
        $stmt = $this->db->execute($query, [
            'id'    => $userId,
            'token' => $tokenHash
        ]);

        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

}