<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Support\Fixture;

use Matheopolis\Infrastructure\Persistence\Database\Queryable;

/**
 * Inserts minimal quiz content for tests (no dependency on demo data SQL).
 *
 * @return array{
 *   quizId: int,
 *   questionIds: array<int, int>,
 *   correctOptionIds: array<int, int>
 * }
 */
final class QuizFixture
{
    /**
     * @param list<array{label: string, options: list<array{label: string, isCorrect: bool}>}> $questions
     *
     * @return array{
     *   quizId: int,
     *   questionIds: array<int, int>,
     *   correctOptionIds: array<int, int>
     * }
     */
    public static function insertQuiz(
        Queryable $db,
        int $creatorId,
        string $status = 'public',
        array $questions = [],
    ): array {
        if ([] === $questions) {
            $questions = [
                [
                    'label' => 'Q1',
                    'options' => [
                        ['label' => 'Wrong', 'isCorrect' => false],
                        ['label' => 'Right', 'isCorrect' => true],
                    ],
                ],
                [
                    'label' => 'Q2',
                    'options' => [
                        ['label' => 'Also right', 'isCorrect' => true],
                        ['label' => 'Nope', 'isCorrect' => false],
                    ],
                ],
            ];
        }

        $db->execute(
            'INSERT INTO quizzes (title, description, creator_id, status, ask_admin, position, created_at)
             VALUES (:title, NULL, :creator_id, :status, 0, 0, :created_at)',
            [
                'title' => 'Test quiz',
                'creator_id' => $creatorId,
                'status' => $status,
                'created_at' => '2026-01-01 00:00:00',
            ],
        );
        $quizRow = $db->execute('SELECT id FROM quizzes ORDER BY id DESC LIMIT 1')->fetch();
        $quizId = (int) $quizRow['id'];

        $questionIds = [];
        $correctOptionIds = [];

        foreach ($questions as $index => $question) {
            $db->execute(
                'INSERT INTO quiz_questions (quiz_id, label, order_index, type)
                 VALUES (:quiz_id, :label, :order_index, :type)',
                [
                    'quiz_id' => $quizId,
                    'label' => $question['label'],
                    'order_index' => $index,
                    'type' => 'radio',
                ],
            );
            $qRow = $db->execute(
                'SELECT id FROM quiz_questions WHERE quiz_id = :quiz_id AND order_index = :order_index LIMIT 1',
                ['quiz_id' => $quizId, 'order_index' => $index],
            )->fetch();
            $questionId = (int) $qRow['id'];
            $questionIds[] = $questionId;

            foreach ($question['options'] as $option) {
                $db->execute(
                    'INSERT INTO quiz_options (question_id, label, is_correct)
                     VALUES (:question_id, :label, :is_correct)',
                    [
                        'question_id' => $questionId,
                        'label' => $option['label'],
                        'is_correct' => $option['isCorrect'] ? 1 : 0,
                    ],
                );
                if ($option['isCorrect']) {
                    $optRow = $db->execute(
                        'SELECT id FROM quiz_options WHERE question_id = :question_id AND is_correct = 1 LIMIT 1',
                        ['question_id' => $questionId],
                    )->fetch();
                    $correctOptionIds[] = (int) $optRow['id'];
                }
            }
        }

        return [
            'quizId' => $quizId,
            'questionIds' => $questionIds,
            'correctOptionIds' => $correctOptionIds,
        ];
    }

    public static function restrictQuizForClass(Queryable $db, int $quizId, int $classId): void
    {
        $db->execute(
            'INSERT INTO quiz_target_classes (quiz_id, class_id, is_active) VALUES (:quiz_id, :class_id, 0)',
            ['quiz_id' => $quizId, 'class_id' => $classId],
        );
    }

    public static function grantQuizForClass(Queryable $db, int $quizId, int $classId): void
    {
        $db->execute(
            'INSERT INTO quiz_target_classes (quiz_id, class_id, is_active) VALUES (:quiz_id, :class_id, 1)',
            ['quiz_id' => $quizId, 'class_id' => $classId],
        );
    }
}
