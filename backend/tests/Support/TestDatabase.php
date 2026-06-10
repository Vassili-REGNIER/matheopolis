<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Support;

use Matheopolis\Infrastructure\Persistence\Database\PDOAdapter;
use Matheopolis\Infrastructure\Persistence\Database\Queryable;

final class TestDatabase
{
    private static ?self $instance = null;

    private readonly PDOAdapter $db;

    private bool $schemaReady = false;

    private function __construct()
    {
        $host = getenv('DB_HOST') ?: '127.0.0.1';
        $port = (int) (getenv('DB_PORT') ?: 3306);
        $name = getenv('DB_NAME') ?: 'matheopolis_test';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') ?: 'root';

        $dsn = \sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $host, $port, $name);
        $this->db = new PDOAdapter($dsn, $user, $pass);
    }

    public static function isConfigured(): bool
    {
        return '' !== (getenv('DB_NAME') ?: '');
    }

    public static function isReachable(): bool
    {
        if (!self::isConfigured()) {
            return false;
        }

        try {
            self::getInstance()->db->execute('SELECT 1');

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    public static function getInstance(): self
    {
        if (null === self::$instance) {
            self::$instance = new self();
            self::$instance->ensureSchema();
        }

        return self::$instance;
    }

    public function queryable(): Queryable
    {
        return $this->db;
    }

    public function reset(): void
    {
        if (!$this->schemaAlreadyApplied()) {
            $this->schemaReady = false;
        }
        $this->ensureSchema();
        $this->db->execute('SET FOREIGN_KEY_CHECKS = 0');
        foreach ($this->tableNames() as $table) {
            $this->db->execute('TRUNCATE TABLE `'.$table.'`');
        }
        $this->db->execute('SET FOREIGN_KEY_CHECKS = 1');
    }

    public function ensureSchema(): void
    {
        if ($this->schemaReady) {
            return;
        }

        if ($this->schemaAlreadyApplied()) {
            $this->schemaReady = true;

            return;
        }

        $schemaPath = \dirname(__DIR__, 2).'/database/schema.sql';
        if (!is_readable($schemaPath)) {
            throw new \RuntimeException('schema.sql not found for tests.');
        }

        $sql = (string) file_get_contents($schemaPath);
        $this->db->execute('SET FOREIGN_KEY_CHECKS = 0');
        foreach ($this->splitSqlStatements($sql) as $statement) {
            if ('' !== $statement) {
                $this->db->execute($statement);
            }
        }
        $this->db->execute('SET FOREIGN_KEY_CHECKS = 1');
        $this->schemaReady = true;
    }

    private function schemaAlreadyApplied(): bool
    {
        foreach (['users', 'chapters', 'quizzes', 'riddle_questions', 'quiz_responses'] as $table) {
            try {
                $stmt = $this->db->execute(
                    'SELECT 1 FROM information_schema.tables
                     WHERE table_schema = DATABASE() AND table_name = :table LIMIT 1',
                    ['table' => $table],
                );
                if (null === $stmt->fetch()) {
                    return false;
                }
            } catch (\Throwable) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return list<string>
     */
    private function tableNames(): array
    {
        return [
            'riddle_questions',
            'riddles',
            'dialogue_lines',
            'step_dialogues',
            'step_infos',
            'chapter_steps',
            'chapter_progressions',
            'chapter_target_classes',
            'chapters',
            'quiz_responses',
            'quiz_progressions',
            'quiz_options',
            'quiz_questions',
            'quiz_target_classes',
            'quizzes',
            'users',
            'classes',
        ];
    }

    /**
     * @return list<string>
     */
    private function splitSqlStatements(string $sql): array
    {
        $lines = explode("\n", $sql);
        $buffer = [];
        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ('' === $trimmed || str_starts_with($trimmed, '--')) {
                continue;
            }
            $buffer[] = $line;
        }

        $parts = preg_split('/;\s*(?:\n|$)/', implode("\n", $buffer));
        if (false === $parts) {
            return [];
        }

        $statements = [];
        foreach ($parts as $part) {
            $trimmed = trim($part);
            if ('' !== $trimmed) {
                $statements[] = $trimmed;
            }
        }

        return $statements;
    }
}
