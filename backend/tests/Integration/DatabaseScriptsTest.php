<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Integration;

use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @coversNothing
 */
final class DatabaseScriptsTest extends TestCase
{
    public function testSchemaFileContainsCoreTables(): void
    {
        $schemaPath = \dirname(__DIR__, 2).'/database/schema.sql';
        self::assertFileExists($schemaPath);

        $schema = (string) file_get_contents($schemaPath);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `users`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `classes`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `chapters`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `riddles`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `riddle_progressions`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `used_nonces`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `quizzes`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `quiz_questions`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `quiz_options`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `quiz_target_classes`', $schema);
        self::assertStringContainsString("status ENUM('not_started', 'in_progress', 'completed')", $schema);
    }
}
