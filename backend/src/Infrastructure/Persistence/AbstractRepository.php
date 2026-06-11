<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence;

use Matheopolis\Infrastructure\Persistence\Database\Queryable;

/**
 * Persists and retrieves abstract records.
 */
abstract class AbstractRepository
{
    /**
     * Creates a new AbstractRepository instance.
     */
    public function __construct(
        protected readonly Queryable $db,
    ) {}

    /**
     * @return array<int, object>
     */
    public function findAll(): array
    {
        $table = $this->getTableName();
        $stmt = $this->db->execute("SELECT * FROM {$table}");
        $rows = $stmt->fetchAll();

        $entities = [];
        foreach ($rows as $row) {
            $entities[] = $this->mapToEntity($row);
        }

        return $entities;
    }

    /**
     * Finds matching records for the requested criteria.
     */
    public function find(int $id): ?object
    {
        $table = $this->getTableName();
        $stmt = $this->db->execute("SELECT * FROM {$table} WHERE id = :id LIMIT 1", ['id' => $id]);
        $row = $stmt->fetch();

        return null !== $row ? $this->mapToEntity($row) : null;
    }

    /**
     * Deletes the requested resource.
     */
    public function delete(int $id): void
    {
        $table = $this->getTableName();
        $this->db->execute("DELETE FROM {$table} WHERE id = :id", ['id' => $id]);
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function rowInt(array $row, string $key, int $default = 0): int
    {
        $v = $row[$key] ?? null;
        if (\is_int($v)) {
            return $v;
        }
        if (\is_string($v) && is_numeric($v)) {
            return (int) $v;
        }
        if (\is_float($v)) {
            return (int) $v;
        }

        return $default;
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function rowStr(array $row, string $key, string $default = ''): string
    {
        $v = $row[$key] ?? null;
        if (\is_string($v)) {
            return $v;
        }
        if (\is_scalar($v)) {
            return (string) $v;
        }

        return $default;
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function rowStrOrNull(array $row, string $key): ?string
    {
        if (!\array_key_exists($key, $row)) {
            return null;
        }
        $v = $row[$key];
        if (null === $v) {
            return null;
        }
        if (\is_string($v)) {
            return $v;
        }
        if (\is_scalar($v)) {
            return (string) $v;
        }

        return null;
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function rowIntOrNull(array $row, string $key): ?int
    {
        if (!\array_key_exists($key, $row)) {
            return null;
        }
        $v = $row[$key];
        if (\is_int($v)) {
            return $v;
        }
        if (\is_string($v) && is_numeric($v)) {
            return (int) $v;
        }
        if (\is_float($v)) {
            return (int) $v;
        }

        return null;
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function rowBool(array $row, string $key, bool $default = false): bool
    {
        if (!\array_key_exists($key, $row)) {
            return $default;
        }
        $v = $row[$key];
        if (\is_bool($v)) {
            return $v;
        }
        if (\is_int($v)) {
            return 0 !== $v;
        }
        if (\is_string($v)) {
            return '1' === $v || 'true' === strtolower($v);
        }

        return $default;
    }

    /**
     * Utc now sql.
     */
    protected function utcNowSql(): string
    {
        return gmdate('Y-m-d H:i:s');
    }

    /**
     * Returns the table name.
     */
    abstract protected function getTableName(): string;

    /**
     * @param array<string, mixed> $row
     */
    abstract protected function mapToEntity(array $row): object;
}
