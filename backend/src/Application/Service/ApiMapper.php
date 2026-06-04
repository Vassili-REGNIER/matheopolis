<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Domain\ClassEntity;
use Matheopolis\Domain\Puzzle;
use Matheopolis\Domain\PuzzleProgress;
use Matheopolis\Domain\Quiz;
use Matheopolis\Domain\QuizOption;
use Matheopolis\Domain\QuizProgress;
use Matheopolis\Domain\QuizQuestion;
use Matheopolis\Domain\User;

final class ApiMapper
{
    /**
     * @return array<string, mixed>
     */
    public static function user(User $user): array
    {
        return [
            'id' => $user->getId(),
            'firstName' => $user->getFirstname(),
            'lastName' => $user->getLastname(),
            'username' => $user->getPseudo(),
            'email' => $user->getEmail(),
            'role' => $user->getRole(),
            'classId' => $user->getClassId(),
            'createdAt' => $user->getCreatedAt(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function classEntity(ClassEntity $class): array
    {
        return [
            'id' => $class->getId(),
            'name' => $class->getName(),
            'description' => $class->getDescription(),
            'code' => $class->getCode(),
            'teacherId' => $class->getTeacherId(),
            'level' => $class->getLevel(),
            'createdAt' => $class->getCreatedAt(),
            'archivedAt' => $class->getArchivedAt(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function quizSummary(Quiz $quiz, int $questionCount, QuizProgress|array|null $progress): array
    {
        return [
            'id' => $quiz->getId(),
            'type' => 'quiz',
            'title' => $quiz->getTitle(),
            'description' => $quiz->getDescription(),
            'status' => $quiz->getStatus(),
            'creatorId' => $quiz->getCreatorId(),
            'questionCount' => $questionCount,
            'position' => $quiz->getPosition(),
            'createdAt' => $quiz->getCreatedAt(),
            'progress' => null !== $progress ? self::quizProgress($progress) : null,
        ];
    }

    /**
     * @param array<int, QuizQuestion> $questions
     *
     * @return array<string, mixed>
     */
    public static function quizPlay(Quiz $quiz, int $questionCount, array $questions): array
    {
        $mappedQuestions = [];
        foreach ($questions as $question) {
            $mappedQuestions[] = self::quizQuestionPlay($question);
        }

        return [
            'id' => $quiz->getId(),
            'type' => 'quiz',
            'title' => $quiz->getTitle(),
            'description' => $quiz->getDescription(),
            'status' => $quiz->getStatus(),
            'creatorId' => $quiz->getCreatorId(),
            'questionCount' => $questionCount,
            'createdAt' => $quiz->getCreatedAt(),
            'questions' => $mappedQuestions,
        ];
    }

    /**
     * @param array<int, QuizQuestion> $questions
     *
     * @return array<string, mixed>
     */
    public static function quizManage(Quiz $quiz, int $questionCount, array $questions): array
    {
        $mappedQuestions = [];
        foreach ($questions as $question) {
            $mappedQuestions[] = self::quizQuestionManage($question);
        }

        return [
            'id' => $quiz->getId(),
            'type' => 'quiz',
            'title' => $quiz->getTitle(),
            'description' => $quiz->getDescription(),
            'status' => $quiz->getStatus(),
            'askAdmin' => $quiz->isAskAdmin(),
            'creatorId' => $quiz->getCreatorId(),
            'questionCount' => $questionCount,
            'position' => $quiz->getPosition(),
            'createdAt' => $quiz->getCreatedAt(),
            'updatedAt' => $quiz->getUpdatedAt(),
            'questions' => $mappedQuestions,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function quizQuestionPlay(QuizQuestion $question): array
    {
        $options = [];
        foreach ($question->getOptions() as $option) {
            $options[] = self::quizOptionPlay($option);
        }

        return [
            'id' => $question->getId(),
            'label' => $question->getLabel(),
            'type' => $question->getType(),
            'orderIndex' => $question->getOrderIndex(),
            'options' => $options,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function quizQuestionManage(QuizQuestion $question): array
    {
        $options = [];
        foreach ($question->getOptions() as $option) {
            $options[] = self::quizOptionManage($option);
        }

        return [
            'id' => $question->getId(),
            'label' => $question->getLabel(),
            'type' => $question->getType(),
            'orderIndex' => $question->getOrderIndex(),
            'options' => $options,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function quizOptionPlay(QuizOption $option): array
    {
        return [
            'id' => $option->getId(),
            'label' => $option->getLabel(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function quizOptionManage(QuizOption $option): array
    {
        return [
            'id' => $option->getId(),
            'label' => $option->getLabel(),
            'isCorrect' => $option->isCorrect(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function quizProgress(QuizProgress|array $progress): array
    {
        if ($progress instanceof QuizProgress) {
            return [
                'quizId' => $progress->getQuizId(),
                'studentId' => $progress->getStudentId(),
                'status' => $progress->getStatus(),
                'attemptCount' => $progress->getAttemptCount(),
                'currentQuestionIndex' => $progress->getCurrentQuestionIndex(),
                'startedAt' => $progress->getStartedAt(),
                'completedAt' => $progress->getCompletedAt(),
                'lastScore' => $progress->getLastScore(),
                'bestScore' => $progress->getBestScore(),
            ];
        }

        return $progress;
    }

    /**
     * @param array{quiz: Quiz, attempt: array<string, mixed>, questions: array<int, array{question: QuizQuestion, selectedOptionIds: array<int, int>, isCorrect: bool}>} $correction
     *
     * @return array<string, mixed>
     */
    public static function quizCorrection(array $correction): array
    {
        $questions = [];
        foreach ($correction['questions'] as $entry) {
            $question = $entry['question'];
            $options = [];
            foreach ($question->getOptions() as $option) {
                $options[] = self::quizOptionManage($option);
            }

            $questions[] = [
                'id' => $question->getId(),
                'label' => $question->getLabel(),
                'type' => $question->getType(),
                'orderIndex' => $question->getOrderIndex(),
                'options' => $options,
                'selectedOptionIds' => $entry['selectedOptionIds'],
                'isCorrect' => $entry['isCorrect'],
            ];
        }

        $quiz = $correction['quiz'];

        return [
            'quiz' => [
                'id' => $quiz->getId(),
                'title' => $quiz->getTitle(),
                'status' => $quiz->getStatus(),
            ],
            'attempt' => $correction['attempt'],
            'questions' => $questions,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function puzzle(Puzzle $puzzle): array
    {
        return [
            'id' => $puzzle->getId(),
            'slug' => $puzzle->getSlug(),
            'title' => $puzzle->getTitle(),
            'statement' => $puzzle->getStatement(),
            'position' => $puzzle->getPosition(),
            'isActive' => $puzzle->isActive(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function progress(PuzzleProgress $progress): array
    {
        return [
            'id' => $progress->getId(),
            'studentId' => $progress->getStudentId(),
            'riddleId' => $progress->getPuzzleId(),
            'status' => $progress->getStatus(),
            'attemptCount' => $progress->getAttemptCount(),
            'startedAt' => $progress->getStartedAt(),
            'completedAt' => $progress->getCompletedAt(),
            'lastAttemptAt' => $progress->getLastAttemptAt(),
        ];
    }
}
