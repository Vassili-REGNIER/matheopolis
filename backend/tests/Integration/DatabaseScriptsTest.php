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
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `chapter_steps`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `step_infos`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `step_dialogues`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `dialogue_lines`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `chapter_progressions`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `chapter_target_classes`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `riddles`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `riddle_questions`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `riddle_progressions`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `riddle_responses`', $schema);
        self::assertStringNotContainsString('`scenario`', $schema);
        self::assertStringNotContainsString('used_nonces', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `quizzes`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `quiz_questions`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `quiz_options`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `quiz_progressions`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `quiz_responses`', $schema);
        self::assertStringContainsString('CREATE TABLE IF NOT EXISTS `quiz_target_classes`', $schema);
    }

    public function testSeedFileContainsDemoAccounts(): void
    {
        $seedPath = \dirname(__DIR__, 2).'/database/seed.sql';
        self::assertFileExists($seedPath);

        $seed = (string) file_get_contents($seedPath);
        self::assertStringContainsString("'admin'", $seed);
        self::assertStringContainsString("'theo.teacher'", $seed);
        self::assertStringContainsString("'sam.student1'", $seed);
        self::assertStringContainsString("'felix.demo'", $seed);
        self::assertStringContainsString('INSERT INTO chapter_steps', $seed);
        self::assertStringContainsString('INSERT INTO step_infos', $seed);
        self::assertStringContainsString('INSERT INTO riddles', $seed);
        self::assertStringNotContainsString('UPDATE chapters SET scenario', $seed);
    }
}
