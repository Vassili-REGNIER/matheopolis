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

    public function testDemoUsersFileContainsDemoAccounts(): void
    {
        $usersPath = \dirname(__DIR__, 2).'/database/seeds/demo/users.sql';
        self::assertFileExists($usersPath);

        $users = (string) file_get_contents($usersPath);
        self::assertStringContainsString("'admin'", $users);
        self::assertStringContainsString("'theo.teacher'", $users);
        self::assertStringContainsString("'sam.student1'", $users);
        self::assertStringContainsString("'felix.demo'", $users);
        self::assertStringContainsString('INSERT INTO classes', $users);
        self::assertStringNotContainsString('INSERT INTO chapters', $users);
        self::assertStringNotContainsString('INSERT INTO quizzes', $users);
    }

    public function testContentScenarioFilesContainChapterContent(): void
    {
        $contentDir = \dirname(__DIR__, 2).'/database/seeds/content';
        $scenarioPaths = [
            $contentDir.'/scenario.sql',
            $contentDir.'/scenario-base-conversion.sql',
            $contentDir.'/scenario-piano-fraction.sql',
        ];

        $scenario = '';
        foreach ($scenarioPaths as $scenarioPath) {
            self::assertFileExists($scenarioPath);
            $scenario .= "\n".((string) file_get_contents($scenarioPath));
        }

        self::assertStringContainsString('INSERT INTO `chapter_steps`', $scenario);
        self::assertStringContainsString('INSERT INTO `step_infos`', $scenario);
        self::assertStringContainsString('INSERT INTO `riddles`', $scenario);
        self::assertStringNotContainsString('UPDATE chapters SET scenario', $scenario);
    }

    public function testDatabaseSeedFilesApplyAllContentScenarioFiles(): void
    {
        $seedScriptPath = \dirname(__DIR__, 3).'/scripts/lib/db-seed-files.sh';
        self::assertFileExists($seedScriptPath);

        $seedScript = (string) file_get_contents($seedScriptPath);
        self::assertStringContainsString('"content/scenario.sql"', $seedScript);
        self::assertStringContainsString('"content/scenario-base-conversion.sql"', $seedScript);
        self::assertStringContainsString('"content/scenario-piano-fraction.sql"', $seedScript);
    }

    public function testLegacyFlatSeedFilesWereRemoved(): void
    {
        $databaseDir = \dirname(__DIR__, 2).'/database';
        self::assertFileDoesNotExist($databaseDir.'/seed.sql');
        self::assertFileDoesNotExist($databaseDir.'/users.sql');
        self::assertFileDoesNotExist($databaseDir.'/scenario.sql');
        self::assertFileDoesNotExist($databaseDir.'/quiz.sql');
        self::assertFileDoesNotExist($databaseDir.'/reset_entries.sql');
    }
}
