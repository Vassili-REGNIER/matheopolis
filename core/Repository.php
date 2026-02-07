<?php
declare(strict_types=1);

namespace Core;

use Core\Database\Queryable;

abstract class Repository
{
    protected Queryable $db;

    // Injection de dépendance une seule fois pour tous les enfants
    public function __construct(Queryable $db)
    {
        $this->db = $db;
    }

    // --- Méthodes Abstraites (Les enfants DOIVENT les définir) ---

    /** Quel est le nom de la table ? (ex: 'users') */
    abstract protected function getTableName(): string;

    /** Comment transformer une ligne SQL en Objet ? */
    abstract protected function mapToEntity(array $row): object;

    // --- Méthodes Génériques (Fonctionnent pour tout le monde) ---

    public function findAll(): array
    {
        $table = $this->getTableName();
        $stmt = $this->db->execute("SELECT * FROM $table");
        $rows = $stmt->fetchAll();

        $entities = [];
        foreach ($rows as $row) {
            $entities[] = $this->mapToEntity($row);
        }
        return $entities;
    }

    public function find(int $id): ?object
    {
        $table = $this->getTableName();
        $stmt = $this->db->execute("SELECT * FROM $table WHERE id = :id LIMIT 1", ['id' => $id]);
        $row = $stmt->fetch();

        return $row ? $this->mapToEntity($row) : null;
    }

    public function delete(int $id): void
    {
        $table = $this->getTableName();
        $this->db->execute("DELETE FROM $table WHERE id = :id", ['id' => $id]);
    }
}