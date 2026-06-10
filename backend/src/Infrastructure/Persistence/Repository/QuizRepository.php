<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Persistence\Repository;

use Matheopolis\Application\Port\QuizRepositoryInterface;
use Matheopolis\Domain\Quiz;
use Matheopolis\Domain\QuizOption;
use Matheopolis\Domain\QuizQuestion;
use Matheopolis\Infrastructure\Persistence\AbstractRepository;

final class QuizRepository extends AbstractRepository implements QuizRepositoryInterface
{
    /**
     * @return array<int, Quiz>
     */
    public function findAll(): array
    {
        $stmt = $this->db->execute('SELECT * FROM quizzes ORDER BY position ASC, id ASC');

        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = $this->mapQuiz($row);
        }

        return $items;
    }

    /**
     * @return array<int, Quiz>
     */
    public function findPublicationRequests(): array
    {
        $stmt = $this->db->execute(
            'SELECT * FROM quizzes WHERE ask_admin = 1 AND status = :status ORDER BY created_at ASC',
            ['status' => 'private'],
        );

        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = $this->mapQuiz($row);
        }

        return $items;
    }

    public function find(int $id): ?Quiz
    {
        $stmt = $this->db->execute('SELECT * FROM quizzes WHERE id = :id LIMIT 1', ['id' => $id]);
        $row = $stmt->fetch();

        return null !== $row ? $this->mapQuiz($row) : null;
    }

    public function insert(
        string $title,
        ?string $description,
        int $creatorId,
        string $status,
        array $questions = [],
    ): Quiz {
        $createdAt = $this->utcNowSql();
        $this->db->execute(
            'INSERT INTO quizzes (title, description, creator_id, status, ask_admin, position, created_at, updated_at)
             VALUES (:title, :description, :creator_id, :status, 0, 0, :created_at, :updated_at)',
            [
                'title' => $title,
                'description' => $description,
                'creator_id' => $creatorId,
                'status' => $status,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ],
        );

        $quizId = $this->db->lastInsertId();
        foreach ($questions as $question) {
            $this->insertQuestion(
                $quizId,
                $question['label'],
                $question['type'],
                $question['orderIndex'],
                $question['options'],
            );
        }

        $quiz = $this->find($quizId);
        if (null === $quiz) {
            throw new \RuntimeException('Failed to load quiz after insert.');
        }

        return $quiz;
    }

    public function update(
        int $id,
        ?string $title,
        ?string $description,
        ?string $status,
        ?bool $askAdmin,
    ): ?Quiz {
        $quiz = $this->find($id);
        if (null === $quiz) {
            return null;
        }

        $this->db->execute(
            'UPDATE quizzes
             SET title = :title,
                 description = :description,
                 status = :status,
                 ask_admin = :ask_admin,
                 updated_at = :updated_at
             WHERE id = :id',
            [
                'id' => $id,
                'title' => $title ?? $quiz->getTitle(),
                'description' => $description ?? $quiz->getDescription(),
                'status' => $status ?? $quiz->getStatus(),
                'ask_admin' => null !== $askAdmin ? ($askAdmin ? 1 : 0) : ($quiz->isAskAdmin() ? 1 : 0),
                'updated_at' => $this->utcNowSql(),
            ],
        );

        return $this->find($id);
    }

    public function delete(int $id): void
    {
        $this->db->execute('DELETE FROM quizzes WHERE id = :id', ['id' => $id]);
    }

    public function countQuestions(int $quizId): int
    {
        $stmt = $this->db->execute(
            'SELECT COUNT(*) AS total FROM quiz_questions WHERE quiz_id = :quiz_id',
            ['quiz_id' => $quizId],
        );
        $row = $stmt->fetch();

        return null !== $row ? $this->rowInt($row, 'total') : 0;
    }

    /**
     * @return array<int, QuizQuestion>
     */
    public function findQuestionsByQuizId(int $quizId, bool $withCorrectFlags = true): array
    {
        $stmt = $this->db->execute(
            'SELECT * FROM quiz_questions WHERE quiz_id = :quiz_id ORDER BY order_index ASC, id ASC',
            ['quiz_id' => $quizId],
        );

        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $questionId = $this->rowInt($row, 'id');
            $options = $this->findOptionsByQuestionId($questionId, $withCorrectFlags);
            $items[] = new QuizQuestion(
                $questionId,
                $this->rowInt($row, 'quiz_id'),
                $this->rowStr($row, 'label'),
                $this->rowInt($row, 'order_index'),
                $this->rowStr($row, 'type'),
                $options,
            );
        }

        return $items;
    }

    public function findQuestionById(int $questionId): ?QuizQuestion
    {
        $stmt = $this->db->execute('SELECT * FROM quiz_questions WHERE id = :id LIMIT 1', ['id' => $questionId]);
        $row = $stmt->fetch();
        if (null === $row) {
            return null;
        }

        $id = $this->rowInt($row, 'id');

        return new QuizQuestion(
            $id,
            $this->rowInt($row, 'quiz_id'),
            $this->rowStr($row, 'label'),
            $this->rowInt($row, 'order_index'),
            $this->rowStr($row, 'type'),
            $this->findOptionsByQuestionId($id, true),
        );
    }

    public function insertQuestion(
        int $quizId,
        string $label,
        string $type,
        int $orderIndex,
        array $options,
    ): QuizQuestion {
        $this->db->execute(
            'INSERT INTO quiz_questions (quiz_id, label, order_index, type) VALUES (:quiz_id, :label, :order_index, :type)',
            [
                'quiz_id' => $quizId,
                'label' => $label,
                'order_index' => $orderIndex,
                'type' => $type,
            ],
        );

        $questionId = $this->db->lastInsertId();
        foreach ($options as $option) {
            $this->db->execute(
                'INSERT INTO quiz_options (question_id, label, is_correct) VALUES (:question_id, :label, :is_correct)',
                [
                    'question_id' => $questionId,
                    'label' => $option['label'],
                    'is_correct' => $option['isCorrect'] ? 1 : 0,
                ],
            );
        }

        $question = $this->findQuestionById($questionId);
        if (null === $question) {
            throw new \RuntimeException('Failed to load question after insert.');
        }

        return $question;
    }

    public function updateQuestion(
        int $questionId,
        ?string $label,
        ?string $type,
        ?int $orderIndex,
        ?array $options,
    ): ?QuizQuestion {
        $existing = $this->findQuestionById($questionId);
        if (null === $existing) {
            return null;
        }

        $this->db->execute(
            'UPDATE quiz_questions SET label = :label, type = :type, order_index = :order_index WHERE id = :id',
            [
                'id' => $questionId,
                'label' => $label ?? $existing->getLabel(),
                'type' => $type ?? $existing->getType(),
                'order_index' => $orderIndex ?? $existing->getOrderIndex(),
            ],
        );

        if (null !== $options) {
            $this->db->execute('DELETE FROM quiz_options WHERE question_id = :question_id', ['question_id' => $questionId]);
            foreach ($options as $option) {
                $this->db->execute(
                    'INSERT INTO quiz_options (question_id, label, is_correct) VALUES (:question_id, :label, :is_correct)',
                    [
                        'question_id' => $questionId,
                        'label' => $option['label'],
                        'is_correct' => $option['isCorrect'] ? 1 : 0,
                    ],
                );
            }
        }

        return $this->findQuestionById($questionId);
    }

    public function deleteQuestion(int $questionId): void
    {
        $this->db->execute('DELETE FROM quiz_questions WHERE id = :id', ['id' => $questionId]);
    }

    public function normalizeQuestionOrder(int $quizId): void
    {
        $stmt = $this->db->execute(
            'SELECT id FROM quiz_questions WHERE quiz_id = :quiz_id ORDER BY order_index ASC, id ASC',
            ['quiz_id' => $quizId],
        );

        $orderIndex = 0;
        foreach ($stmt->fetchAll() as $row) {
            $this->db->execute(
                'UPDATE quiz_questions SET order_index = :order_index WHERE id = :id',
                [
                    'order_index' => $orderIndex,
                    'id' => $this->rowInt($row, 'id'),
                ],
            );
            ++$orderIndex;
        }
    }

    /**
     * @return array<int, array{classId: int, isActive: bool}>
     */
    public function findTargetClassesByQuizId(int $quizId, ?int $teacherId = null): array
    {
        if (null === $teacherId) {
            $stmt = $this->db->execute(
                'SELECT class_id, is_active FROM quiz_target_classes WHERE quiz_id = :quiz_id ORDER BY class_id ASC',
                ['quiz_id' => $quizId],
            );
        } else {
            $stmt = $this->db->execute(
                'SELECT qtc.class_id, qtc.is_active
                 FROM quiz_target_classes qtc
                 INNER JOIN classes c ON c.id = qtc.class_id
                 WHERE qtc.quiz_id = :quiz_id AND c.teacher_id = :teacher_id
                 ORDER BY qtc.class_id ASC',
                ['quiz_id' => $quizId, 'teacher_id' => $teacherId],
            );
        }

        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = [
                'classId' => $this->rowInt($row, 'class_id'),
                'isActive' => (bool) $this->rowInt($row, 'is_active'),
            ];
        }

        return $items;
    }

    public function upsertTargetClass(int $quizId, int $classId, bool $isActive): void
    {
        $this->db->execute(
            'INSERT INTO quiz_target_classes (quiz_id, class_id, is_active) VALUES (:quiz_id, :class_id, :is_active)
             ON DUPLICATE KEY UPDATE is_active = VALUES(is_active)',
            [
                'quiz_id' => $quizId,
                'class_id' => $classId,
                'is_active' => $isActive ? 1 : 0,
            ],
        );
    }

    public function deleteTargetClass(int $quizId, int $classId): void
    {
        $this->db->execute(
            'DELETE FROM quiz_target_classes WHERE quiz_id = :quiz_id AND class_id = :class_id',
            ['quiz_id' => $quizId, 'class_id' => $classId],
        );
    }

    public function findOptionById(int $optionId): ?QuizOption
    {
        $stmt = $this->db->execute('SELECT * FROM quiz_options WHERE id = :id LIMIT 1', ['id' => $optionId]);
        $row = $stmt->fetch();
        if (null === $row) {
            return null;
        }

        return new QuizOption(
            $this->rowInt($row, 'id'),
            $this->rowInt($row, 'question_id'),
            $this->rowStr($row, 'label'),
            (bool) $this->rowInt($row, 'is_correct'),
        );
    }

    protected function getTableName(): string
    {
        return 'quizzes';
    }

    /**
     * @param array<string, mixed> $row
     */
    protected function mapToEntity(array $row): object
    {
        return $this->mapQuiz($row);
    }

    /**
     * @return array<int, QuizOption>
     */
    private function findOptionsByQuestionId(int $questionId, bool $withCorrectFlags): array
    {
        $stmt = $this->db->execute(
            'SELECT * FROM quiz_options WHERE question_id = :question_id ORDER BY id ASC',
            ['question_id' => $questionId],
        );

        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = new QuizOption(
                $this->rowInt($row, 'id'),
                $this->rowInt($row, 'question_id'),
                $this->rowStr($row, 'label'),
                $withCorrectFlags && (bool) $this->rowInt($row, 'is_correct'),
            );
        }

        return $items;
    }

    /**
     * @param array<string, mixed> $row
     */
    private function mapQuiz(array $row): Quiz
    {
        return new Quiz(
            $this->rowInt($row, 'id'),
            $this->rowStr($row, 'title'),
            $this->rowStrOrNull($row, 'description'),
            $this->rowInt($row, 'creator_id'),
            $this->rowStr($row, 'status'),
            (bool) $this->rowInt($row, 'ask_admin'),
            $this->rowInt($row, 'position'),
            $this->rowStrOrNull($row, 'created_at'),
            $this->rowStrOrNull($row, 'updated_at'),
        );
    }
}
