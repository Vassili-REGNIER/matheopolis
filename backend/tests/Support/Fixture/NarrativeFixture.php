<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Support\Fixture;

use Matheopolis\Infrastructure\Persistence\Database\Queryable;

/**
 * Inserts minimal narrative content for tests (no dependency on seed.sql).
 *
 * @return array{
 *   chapterId: int,
 *   stepId: int,
 *   riddleId: int,
 *   questionIds: array<int, int>
 * }
 */
final class NarrativeFixture
{
    public static function insertChallengeRiddle(
        Queryable $db,
        string $slug = 'test-chapter',
        string $riddleSlug = 'test-challenge',
    ): array {
        $db->execute(
            'INSERT INTO chapters (slug, title, statement, position, created_at)
             VALUES (:slug, :title, NULL, 1, :created_at)',
            [
                'slug' => $slug,
                'title' => 'Test chapter',
                'created_at' => '2026-01-01 00:00:00',
            ],
        );
        $chapterRow = $db->execute('SELECT id FROM chapters WHERE slug = :slug LIMIT 1', ['slug' => $slug])->fetch();
        $chapterId = (int) $chapterRow['id'];

        $db->execute(
            'INSERT INTO chapter_steps (chapter_id, order_index, type) VALUES (:chapter_id, 0, :type)',
            ['chapter_id' => $chapterId, 'type' => 'riddle'],
        );
        $stepRow = $db->execute(
            'SELECT id FROM chapter_steps WHERE chapter_id = :chapter_id AND order_index = 0 LIMIT 1',
            ['chapter_id' => $chapterId],
        )->fetch();
        $stepId = (int) $stepRow['id'];

        $db->execute(
            'INSERT INTO riddles (step_id, slug, game_id, mode, title, instruction, intro_text, completion_message, created_at)
             VALUES (:step_id, :slug, :game_id, :mode, :title, :instruction, NULL, :completion_message, :created_at)',
            [
                'step_id' => $stepId,
                'slug' => $riddleSlug,
                'game_id' => 'TestGame',
                'mode' => 'challenge',
                'title' => 'Test riddle',
                'instruction' => 'Answer.',
                'completion_message' => 'Done.',
                'created_at' => '2026-01-01 00:00:00',
            ],
        );
        $riddleRow = $db->execute('SELECT id FROM riddles WHERE slug = :slug LIMIT 1', ['slug' => $riddleSlug])->fetch();
        $riddleId = (int) $riddleRow['id'];

        $questionIds = [];
        foreach (['A1', 'A2'] as $index => $prompt) {
            $db->execute(
                'INSERT INTO riddle_questions (riddle_id, order_index, prompt, answer, hint, difficulty)
                 VALUES (:riddle_id, :order_index, :prompt, :answer, NULL, 1)',
                [
                    'riddle_id' => $riddleId,
                    'order_index' => $index,
                    'prompt' => $prompt,
                    'answer' => 'ans'.$index,
                ],
            );
            $qRow = $db->execute(
                'SELECT id FROM riddle_questions WHERE riddle_id = :riddle_id AND order_index = :order_index LIMIT 1',
                ['riddle_id' => $riddleId, 'order_index' => $index],
            )->fetch();
            $questionIds[] = (int) $qRow['id'];
        }

        return [
            'chapterId' => $chapterId,
            'stepId' => $stepId,
            'riddleId' => $riddleId,
            'questionIds' => $questionIds,
        ];
    }

    /**
     * @return array{
     *   chapterId: int,
     *   stepId: int,
     *   riddleId: int,
     *   questionIds: array<int, int>
     * }
     */
    public static function insertPracticeRiddle(
        Queryable $db,
        string $slug = 'practice-chapter',
        string $riddleSlug = 'test-practice',
    ): array {
        $db->execute(
            'INSERT INTO chapters (slug, title, statement, position, created_at)
             VALUES (:slug, :title, NULL, 2, :created_at)',
            [
                'slug' => $slug,
                'title' => 'Practice chapter',
                'created_at' => '2026-01-01 00:00:00',
            ],
        );
        $chapterRow = $db->execute('SELECT id FROM chapters WHERE slug = :slug LIMIT 1', ['slug' => $slug])->fetch();
        $chapterId = (int) $chapterRow['id'];

        $db->execute(
            'INSERT INTO chapter_steps (chapter_id, order_index, type) VALUES (:chapter_id, 0, :type)',
            ['chapter_id' => $chapterId, 'type' => 'riddle'],
        );
        $stepRow = $db->execute(
            'SELECT id FROM chapter_steps WHERE chapter_id = :chapter_id AND order_index = 0 LIMIT 1',
            ['chapter_id' => $chapterId],
        )->fetch();
        $stepId = (int) $stepRow['id'];

        $db->execute(
            'INSERT INTO riddles (step_id, slug, game_id, mode, title, instruction, intro_text, completion_message, created_at)
             VALUES (:step_id, :slug, :game_id, :mode, :title, :instruction, NULL, :completion_message, :created_at)',
            [
                'step_id' => $stepId,
                'slug' => $riddleSlug,
                'game_id' => 'TestGame',
                'mode' => 'practice',
                'title' => 'Practice riddle',
                'instruction' => 'Practice only.',
                'completion_message' => 'Done.',
                'created_at' => '2026-01-01 00:00:00',
            ],
        );
        $riddleRow = $db->execute('SELECT id FROM riddles WHERE slug = :slug LIMIT 1', ['slug' => $riddleSlug])->fetch();
        $riddleId = (int) $riddleRow['id'];

        $db->execute(
            'INSERT INTO riddle_questions (riddle_id, order_index, prompt, answer, hint, difficulty)
             VALUES (:riddle_id, 0, :prompt, :answer, NULL, 1)',
            [
                'riddle_id' => $riddleId,
                'prompt' => 'Practice Q',
                'answer' => 'practice-ans',
            ],
        );
        $qRow = $db->execute(
            'SELECT id FROM riddle_questions WHERE riddle_id = :riddle_id AND order_index = 0 LIMIT 1',
            ['riddle_id' => $riddleId],
        )->fetch();

        return [
            'chapterId' => $chapterId,
            'stepId' => $stepId,
            'riddleId' => $riddleId,
            'questionIds' => [(int) $qRow['id']],
        ];
    }

    public static function restrictChapterForClass(Queryable $db, int $chapterId, int $classId): void
    {
        $db->execute(
            'INSERT INTO chapter_target_classes (chapter_id, class_id, is_active) VALUES (:chapter_id, :class_id, 0)',
            ['chapter_id' => $chapterId, 'class_id' => $classId],
        );
    }

    public static function insertClass(Queryable $db, int $teacherId, string $code = 'CLS-TEST'): int
    {
        $db->execute(
            'INSERT INTO classes (name, description, level, code, teacher_id, created_at)
             VALUES (:name, NULL, :level, :code, :teacher_id, :created_at)',
            [
                'name' => 'Test class',
                'level' => 'grade_6',
                'code' => $code,
                'teacher_id' => $teacherId,
                'created_at' => '2026-01-01 00:00:00',
            ],
        );
        $row = $db->execute('SELECT id FROM classes WHERE code = :code LIMIT 1', ['code' => $code])->fetch();

        return (int) $row['id'];
    }
}
