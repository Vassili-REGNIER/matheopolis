<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Domain\Chapter;
use Matheopolis\Domain\ChapterProgress;
use Matheopolis\Domain\ClassEntity;
use Matheopolis\Domain\Quiz;
use Matheopolis\Domain\QuizOption;
use Matheopolis\Domain\QuizProgress;
use Matheopolis\Domain\QuizQuestion;
use Matheopolis\Domain\Riddle;
use Matheopolis\Domain\RiddleProgress;
use Matheopolis\Domain\User;

final class ApiMapper
{
    /**
     * @return array<string, mixed>
     */
    public static function user(User $user, ?ClassEntity $class = null): array
    {
        return [
            'id' => $user->getId(),
            'firstName' => $user->getFirstname(),
            'lastName' => $user->getLastname(),
            'username' => $user->getPseudo(),
            'email' => $user->getEmail(),
            'emailVerified' => $user->isEmailVerified(),
            'role' => $user->getRole(),
            'classId' => $user->getClassId(),
            'className' => null !== $class ? $class->getName() : null,
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
     * @param null|array<string, mixed>|QuizProgress $progress
     *
     * @return array<string, mixed>
     */
    public static function quizSummary(Quiz $quiz, int $questionCount, array|QuizProgress|null $progress): array
    {
        return [
            'id' => $quiz->getId(),
            'type' => 'quiz',
            'title' => $quiz->getTitle(),
            'description' => $quiz->getDescription(),
            'status' => $quiz->getStatus(),
            'creatorId' => $quiz->getCreatorId(),
            'askAdmin' => $quiz->isAskAdmin(),
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
     * @param array<string, mixed>|QuizProgress $progress
     *
     * @return array<string, mixed>
     */
    public static function quizProgress(array|QuizProgress $progress): array
    {
        if ($progress instanceof QuizProgress) {
            return [
                'quizId' => $progress->getQuizId(),
                'userId' => $progress->getUserId(),
                'status' => $progress->getStatus(),
                'attemptCount' => $progress->getAttemptCount(),
                'currentQuestionIndex' => $progress->getCurrentQuestionIndex(),
                'startedAt' => $progress->getStartedAt(),
                'completedAt' => $progress->getCompletedAt(),
                'score' => $progress->getScore(),
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
     * @param null|array<string, mixed> $progress
     *
     * @return array<string, mixed>
     */
    public static function chapterSummary(Chapter $chapter, ?array $progress): array
    {
        return [
            'id' => $chapter->getId(),
            'type' => 'narrative',
            'slug' => $chapter->getSlug(),
            'title' => $chapter->getTitle(),
            'statement' => $chapter->getStatement(),
            'position' => $chapter->getPosition(),
            'progress' => $progress,
        ];
    }

    /**
     * @param array{steps: array<int, array<string, mixed>>} $scenario
     * @param null|array<string, mixed>                      $progress
     *
     * @return array<string, mixed>
     */
    public static function chapterDetail(Chapter $chapter, array $scenario, ?array $progress): array
    {
        return [
            'id' => $chapter->getId(),
            'type' => 'narrative',
            'slug' => $chapter->getSlug(),
            'title' => $chapter->getTitle(),
            'statement' => $chapter->getStatement(),
            'position' => $chapter->getPosition(),
            'scenario' => $scenario,
            'progress' => $progress,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function chapterProgress(ChapterProgress $progress): array
    {
        return [
            'chapterId' => $progress->getChapterId(),
            'userId' => $progress->getUserId(),
            'status' => $progress->getStatus(),
            'currentStepIndex' => $progress->getCurrentStepIndex(),
            'score' => $progress->getScore(),
            'startedAt' => $progress->getStartedAt(),
            'completedAt' => $progress->getCompletedAt(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function virtualChapterProgress(int $userId, int $chapterId): array
    {
        return [
            'chapterId' => $chapterId,
            'userId' => $userId,
            'status' => 'not_started',
            'currentStepIndex' => 0,
            'score' => null,
            'startedAt' => null,
            'completedAt' => null,
        ];
    }

    /**
     * @param array<string, mixed> $playStep
     *
     * @return array<string, mixed>
     */
    public static function riddleDetail(Riddle $riddle, array $playStep): array
    {
        return [
            'id' => $riddle->getId(),
            'chapterId' => $riddle->getChapterId(),
            'slug' => $riddle->getSlug(),
            'gameId' => $riddle->getGameId(),
            'mode' => $riddle->getMode(),
            'title' => $riddle->getTitle(),
            'play' => $playStep,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function riddleProgress(RiddleProgress $progress): array
    {
        return [
            'riddleId' => $progress->getRiddleId(),
            'userId' => $progress->getUserId(),
            'status' => $progress->getStatus(),
            'currentQuestionIndex' => $progress->getCurrentQuestionIndex(),
            'attemptCount' => $progress->getAttemptCount(),
            'score' => $progress->getScore(),
            'startedAt' => $progress->getStartedAt(),
            'completedAt' => $progress->getCompletedAt(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function virtualRiddleProgress(int $userId, int $riddleId): array
    {
        return [
            'riddleId' => $riddleId,
            'userId' => $userId,
            'status' => 'not_started',
            'currentQuestionIndex' => 0,
            'attemptCount' => 0,
            'score' => null,
            'startedAt' => null,
            'completedAt' => null,
        ];
    }
}
