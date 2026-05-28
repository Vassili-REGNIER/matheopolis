<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Integration;

use PHPUnit\Framework\TestCase;

final class DatabaseScriptsTest extends TestCase
{
    public function testSchemaFileContainsCoreTables(): void
    {
        $schemaPath = dirname(__DIR__, 2).'/database/schema.sql';
        self::assertFileExists($schemaPath);

        $schema = (string) file_get_contents($schemaPath);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS users', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS classes', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS puzzles', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS puzzle_progress', $schema);
        self::assertStringContainsString("status ENUM('not_started', 'in_progress', 'completed')", $schema);
    }

    public function testMigrationFilesExist(): void
    {
        $migrationDir = dirname(__DIR__, 2).'/database/migrations';
        self::assertFileExists($migrationDir.'/001_create_core_tables.sql');
        self::assertFileExists($migrationDir.'/002_create_puzzle_tables.sql');
        self::assertFileExists($migrationDir.'/003_create_progress_tables.sql');
        self::assertFileExists($migrationDir.'/004_create_rate_limits_table.sql');
    }
}
