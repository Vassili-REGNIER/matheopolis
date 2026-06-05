<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Service\ApiMapper;
use Matheopolis\Domain\Chapter;
use Matheopolis\Domain\ChapterProgress;
use Matheopolis\Domain\ClassEntity;
use Matheopolis\Domain\Quiz;
use Matheopolis\Domain\QuizOption;
use Matheopolis\Domain\QuizProgress;
use Matheopolis\Domain\QuizQuestion;
use Matheopolis\Domain\Riddle;
use Matheopolis\Domain\RiddleProgress;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Application\Service\ApiMapper
 */
final class ApiMapperTest extends TestCase
{
    public function testVirtualChapterProgressUsesNotStarted(): void
    {
        $progress = ApiMapper::virtualChapterProgress(9, 3);

        self::assertSame('not_started', $progress['status']);
        self::assertSame(9, $progress['userId']);
        self::assertSame(3, $progress['chapterId']);
    }

    public function testChapterSummaryShape(): void
    {
        $chapter = new Chapter(1, 'slug', 'Title', 'Statement', 2);
        $summary = ApiMapper::chapterSummary($chapter, null);

        self::assertSame('narrative', $summary['type']);
        self::assertNull($summary['progress']);
    }

    public function testRiddleProgressMapping(): void
    {
        $entity = new RiddleProgress(1, 4, 7, 'in_progress', 2, 3, '2026-01-01 00:00:00', null, '2026-01-02 00:00:00');
        $mapped = ApiMapper::riddleProgress($entity);

        self::assertSame(7, $mapped['riddleId']);
        self::assertSame(2, $mapped['currentQuestionIndex']);
    }

    public function testChapterProgressMapping(): void
    {
        $entity = new ChapterProgress(1, 2, 3, 'completed', '2026-01-01 00:00:00', '2026-01-02 00:00:00');
        $mapped = ApiMapper::chapterProgress($entity);

        self::assertSame('completed', $mapped['status']);
        self::assertSame(3, $mapped['chapterId']);
    }

    public function testClassEntityMapping(): void
    {
        $class = new ClassEntity(4, '6A', 'Desc', 'CLS-6A', 2, 'grade_6', '2026-01-01 00:00:00');
        $mapped = ApiMapper::classEntity($class);

        self::assertSame('CLS-6A', $mapped['code']);
        self::assertSame('grade_6', $mapped['level']);
    }

    public function testQuizSummaryWithoutProgress(): void
    {
        $quiz = new Quiz(8, 'Quiz title', null, 2, 'public', false, 1);
        $summary = ApiMapper::quizSummary($quiz, 5, null);

        self::assertSame('quiz', $summary['type']);
        self::assertNull($summary['progress']);
        self::assertSame(5, $summary['questionCount']);
    }

    public function testQuizQuestionManageIncludesCorrectFlags(): void
    {
        $question = new QuizQuestion(3, 1, 'Label', 0, 'radio', [
            new QuizOption(30, 3, 'A', true),
            new QuizOption(31, 3, 'B', false),
        ]);
        $mapped = ApiMapper::quizQuestionManage($question);

        self::assertTrue($mapped['options'][0]['isCorrect']);
        self::assertFalse($mapped['options'][1]['isCorrect']);
    }

    public function testQuizPlayAndCorrectionMappings(): void
    {
        $quiz = new Quiz(1, 'Quiz', 'Desc', 2, 'public', false, 0);
        $question = new QuizQuestion(3, 1, 'Label', 0, 'radio', [
            new QuizOption(30, 3, 'A', true),
            new QuizOption(31, 3, 'B', false),
        ]);
        $play = ApiMapper::quizPlay($quiz, 1, [$question]);
        self::assertArrayNotHasKey('isCorrect', $play['questions'][0]['options'][0]);

        $correction = ApiMapper::quizCorrection([
            'quiz' => $quiz,
            'attempt' => ['number' => 1, 'score' => 1, 'total' => 1, 'completedAt' => '2026-01-02'],
            'questions' => [
                ['question' => $question, 'selectedOptionIds' => [30], 'isCorrect' => true],
            ],
        ]);
        self::assertTrue($correction['questions'][0]['isCorrect']);
    }

    public function testQuizProgressFromEntityAndArray(): void
    {
        $entity = new QuizProgress(1, 2, 3, 'in_progress', 1, 0, null, null, '2026-01-01', null);
        $fromEntity = ApiMapper::quizProgress($entity);
        $fromArray = ApiMapper::quizProgress(['quizId' => 3, 'status' => 'not_started']);

        self::assertSame(3, $fromEntity['quizId']);
        self::assertSame('not_started', $fromArray['status']);
    }

    public function testQuizManageMapping(): void
    {
        $quiz = new Quiz(2, 'Managed', 'D', 3, 'private', true, 0, '2026-01-01', '2026-01-02');
        $question = new QuizQuestion(4, 2, 'Q', 0, 'radio', [
            new QuizOption(40, 4, 'X', true),
            new QuizOption(41, 4, 'Y', false),
        ]);
        $mapped = ApiMapper::quizManage($quiz, 1, [$question]);

        self::assertTrue($mapped['askAdmin']);
        self::assertSame('2026-01-02', $mapped['updatedAt']);
    }

    public function testChapterDetailAndRiddleMappings(): void
    {
        $chapter = new Chapter(1, 'slug', 'Title', 'Statement', 2);
        $progress = ApiMapper::chapterProgress(new ChapterProgress(1, 2, 1, 'in_progress', '2026-01-01', null));
        $detail = ApiMapper::chapterDetail($chapter, ['steps' => []], $progress);
        self::assertSame('Statement', $detail['statement']);

        $riddle = new Riddle(2, 1, 1, 'slug', 'Game', 'challenge', 'T', 'I', null, 'Done', null);
        $mappedRiddle = ApiMapper::riddleDetail($riddle, ['type' => 'riddle', 'riddleId' => 2]);
        self::assertSame('challenge', $mappedRiddle['mode']);

        $virtual = ApiMapper::virtualRiddleProgress(4, 7);
        self::assertSame('not_started', $virtual['status']);
    }
}
