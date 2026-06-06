<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\Quiz;
use Matheopolis\Domain\QuizOption;
use Matheopolis\Domain\QuizQuestion;

interface QuizRepositoryInterface
{
    /**
     * @return array<int, Quiz>
     */
    public function findAll(): array;

    /**
     * @return array<int, Quiz>
     */
    public function findPublicationRequests(): array;

    public function find(int $id): ?Quiz;

    /**
     * @param array<int, array{label: string, type: string, orderIndex: int, options: array<int, array{label: string, isCorrect: bool}>}> $questions
     */
    public function insert(
        string $title,
        ?string $description,
        int $creatorId,
        string $status,
        array $questions = [],
    ): Quiz;

    public function update(
        int $id,
        ?string $title,
        ?string $description,
        ?string $status,
        ?bool $askAdmin,
    ): ?Quiz;

    public function delete(int $id): void;

    public function countQuestions(int $quizId): int;

    /**
     * @return array<int, QuizQuestion>
     */
    public function findQuestionsByQuizId(int $quizId, bool $withCorrectFlags = true): array;

    public function findQuestionById(int $questionId): ?QuizQuestion;

    /**
     * @param array<int, array{label: string, isCorrect: bool}> $options
     */
    public function insertQuestion(
        int $quizId,
        string $label,
        string $type,
        int $orderIndex,
        array $options,
    ): QuizQuestion;

    /**
     * @param null|array<int, array{label: string, isCorrect: bool}> $options
     */
    public function updateQuestion(
        int $questionId,
        ?string $label,
        ?string $type,
        ?int $orderIndex,
        ?array $options,
    ): ?QuizQuestion;

    public function deleteQuestion(int $questionId): void;

    public function normalizeQuestionOrder(int $quizId): void;

    /**
     * @return array<int, array{classId: int, isActive: bool}>
     */
    public function findTargetClassesByQuizId(int $quizId, ?int $teacherId = null): array;

    public function upsertTargetClass(int $quizId, int $classId, bool $isActive): void;

    public function deleteTargetClass(int $quizId, int $classId): void;

    public function findOptionById(int $optionId): ?QuizOption;
}
