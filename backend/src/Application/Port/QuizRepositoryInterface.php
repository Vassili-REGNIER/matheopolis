<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\Quiz;
use Matheopolis\Domain\QuizOption;
use Matheopolis\Domain\QuizQuestion;

/**
 * Defines the contract for the quiz repository dependency.
 */
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

    /**
     * Finds matching records for the requested criteria.
     */
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

    /**
     * Updates the requested resource.
     */
    public function update(
        int $id,
        ?string $title,
        ?string $description,
        ?string $status,
        ?bool $askAdmin,
    ): ?Quiz;

    /**
     * Deletes the requested resource.
     */
    public function delete(int $id): void;

    /**
     * Count questions.
     */
    public function countQuestions(int $quizId): int;

    /**
     * @return array<int, QuizQuestion>
     */
    public function findQuestionsByQuizId(int $quizId, bool $withCorrectFlags = true): array;

    /**
     * Finds matching records for the requested criteria.
     */
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

    /**
     * Deletes the requested resource.
     */
    public function deleteQuestion(int $questionId): void;

    /**
     * Normalize question order.
     */
    public function normalizeQuestionOrder(int $quizId): void;

    /**
     * @return array<int, array{classId: int, isActive: bool}>
     */
    public function findTargetClassesByQuizId(int $quizId, ?int $teacherId = null): array;

    /**
     * Upsert target class.
     */
    public function upsertTargetClass(int $quizId, int $classId, bool $isActive): void;

    /**
     * Deletes the requested resource.
     */
    public function deleteTargetClass(int $quizId, int $classId): void;

    /**
     * Finds matching records for the requested criteria.
     */
    public function findOptionById(int $optionId): ?QuizOption;
}
