<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ChapterProgressRepositoryInterface;
use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\QuizProgressRepositoryInterface;
use Matheopolis\Application\Port\QuizRepositoryInterface;
use Matheopolis\Application\Port\RiddleProgressRepositoryInterface;
use Matheopolis\Application\Port\RiddleRepositoryInterface;
use Matheopolis\Application\Port\ScenarioRepositoryInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Application\Service\ApiClassService;
use Matheopolis\Application\Service\ApiUserService;
use Matheopolis\Application\Service\ChapterAccessResolver;
use Matheopolis\Application\Service\PasswordGenerator;
use Matheopolis\Application\Service\QuizAccessResolver;
use Matheopolis\Domain\Chapter;
use Matheopolis\Domain\ChapterProgress;
use Matheopolis\Domain\ClassEntity;
use Matheopolis\Domain\Quiz;
use Matheopolis\Domain\QuizProgress;
use Matheopolis\Domain\Riddle;
use Matheopolis\Domain\User;
use Matheopolis\Tests\Support\CreatesUserServices;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Application\Service\ApiClassService
 */
final class ApiClassServiceTest extends TestCase
{
    use CreatesUserServices;

    /**
     * Verifies the expected behavior.
     */
    public function testCreateInsertsClassWithGeneratedCode(): void
    {
        $classes = $this->createMock(ClassroomRepositoryInterface::class);
        $classes->expects(self::once())
            ->method('insert')
            ->willReturn(new ClassEntity(1, '6A', 'Desc', 'CLS-GEN', 9, 'grade_6'))
        ;

        $service = $this->service($classes);
        $created = $service->create('6A', 'Desc', 'grade_6', 9);
        self::assertSame('CLS-GEN', $created->getCode());
    }

    /**
     * Verifies the expected behavior.
     */
    public function testNormalizeLevelAcceptsGradeSix(): void
    {
        self::assertSame('grade_6', $this->service()->normalizeLevel('grade_6'));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testNormalizeLevelRejectsUnknownValue(): void
    {
        try {
            $this->service()->normalizeLevel('invalid');
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

    /**
     * Verifies the expected behavior.
     */
    public function testAssertClassReadableDeniedForOtherTeacher(): void
    {
        $class = new ClassEntity(1, '6A', null, 'CLS-X', 99, 'grade_6');
        $teacher = $this->user(2, 'teacher');

        try {
            $this->service()->assertClassReadable($class, $teacher);
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(403, $e->status());
        }
    }

    /**
     * Verifies the expected behavior.
     */
    public function testClassProgressSummaryEmptyWhenNoStudents(): void
    {
        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findStudentsByClassId')->willReturn([]);

        self::assertSame([], $this->service(users: $users)->classProgressSummary(99));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testExportProgressCsvContainsOverviewHeaderAndStudentRow(): void
    {
        $classes = $this->createMock(ClassroomRepositoryInterface::class);
        $classes->method('find')->with(1)->willReturn(new ClassEntity(1, '6e A', null, 'CLS-1', 9, 'grade_6'));

        $student = $this->user(10, 'student', 1);
        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findStudentsByClassId')->willReturn([$student]);

        $chapters = $this->createMock(ChapterRepositoryInterface::class);
        $chapters->method('findAll')->willReturn([new Chapter(1, 'slug', 'Chapter 1', null, 0)]);

        $chapterProgress = $this->createMock(ChapterProgressRepositoryInterface::class);
        $chapterProgress->method('findLatestByUserIds')->willReturn([]);

        $export = $this->service(classes: $classes, users: $users, chapters: $chapters, chapterProgress: $chapterProgress)
            ->exportProgressCsv(1)
        ;

        self::assertStringContainsString('Nom;Prénom;Pseudo', $export['content']);
        self::assertStringContainsString('Nom du chapitre', $export['content']);
        self::assertStringContainsString('Meilleur score', $export['content']);
        self::assertStringContainsString('Score maximal faisable', $export['content']);
        self::assertStringContainsString('Progression totale', $export['content']);
        self::assertStringContainsString('Chapter 1', $export['content']);
        self::assertStringContainsString('Non commencé', $export['content']);
        self::assertStringContainsString(';0;100', $export['content']);
        self::assertStringContainsString('student.test', $export['content']);
        self::assertSame('Chapitres-6e-A.csv', $export['filename']);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testExportChapterProgressCsvUsesRiddleColumnsAndSemicolonDelimiter(): void
    {
        $classes = $this->createMock(ClassroomRepositoryInterface::class);
        $classes->method('find')->with(1)->willReturn(new ClassEntity(1, '6e A', null, 'CLS-1', 9, 'grade_6'));

        $student = $this->user(10, 'student', 1);
        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findStudentsByClassId')->willReturn([$student]);

        $chapters = $this->createMock(ChapterRepositoryInterface::class);
        $chapters->method('find')->with(3)->willReturn(new Chapter(3, 'slug', 'Chapter 3', null, 0));

        $riddle = new Riddle(7, 1, 3, 'riddle-slug', 'TestGame', 'challenge', 'Riddle A', 'Do it', null, 'Done', null);
        $riddles = $this->createMock(RiddleRepositoryInterface::class);
        $riddles->method('findChallengeByChapterId')->with(3)->willReturn([$riddle]);

        $riddleProgress = $this->createMock(RiddleProgressRepositoryInterface::class);
        $riddleProgress->method('findLatestByUserIdsAndRiddleIds')->willReturn([]);
        $riddleProgress->method('findBestScoresByUserIdsAndRiddleIds')->willReturn([]);

        $export = $this->service(
            classes: $classes,
            users: $users,
            chapters: $chapters,
            riddles: $riddles,
            riddleProgress: $riddleProgress
        )
            ->exportProgressCsv(1, 'chapter', 3)
        ;

        self::assertStringContainsString('Nom de l\'énigme', $export['content']);
        self::assertStringContainsString('Nombre de tentatives', $export['content']);
        self::assertStringContainsString('Riddle A', $export['content']);
        self::assertStringContainsString('Non commencé', $export['content']);
        self::assertStringContainsString(';0;100;0', $export['content']);
        self::assertStringContainsString(';', $export['content']);
        self::assertSame('Detail-Chapitre-6e-A-Chapter-3.csv', $export['filename']);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testExportQuizProgressCsvUsesQuizColumns(): void
    {
        $classes = $this->createMock(ClassroomRepositoryInterface::class);
        $classes->method('find')->with(1)->willReturn(new ClassEntity(1, '6e A', null, 'CLS-1', 9, 'grade_6'));

        $student = $this->user(10, 'student', 1);
        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findStudentsByClassId')->willReturn([$student]);

        $quizzes = $this->createMock(QuizRepositoryInterface::class);
        $quizzes->method('findAll')->willReturn([
            new Quiz(4, 'Quiz A', null, 1, 'public', false, 0),
        ]);
        $quizzes->method('countQuestions')->with(4)->willReturn(3);

        $quizProgress = $this->createMock(QuizProgressRepositoryInterface::class);
        $quizProgress->method('findLatestByUserIdsAndQuizIds')->willReturn([]);
        $quizProgress->method('findBestScoresByUserIdsAndQuizIds')->willReturn([]);
        $quizProgress->method('findAttemptCountsByUserIdsAndQuizIds')->willReturn([]);

        $export = $this->service(classes: $classes, users: $users, quizzes: $quizzes, quizProgress: $quizProgress)
            ->exportProgressCsv(1, 'quiz')
        ;

        self::assertStringContainsString('Nom du quiz', $export['content']);
        self::assertStringContainsString('Visibilité', $export['content']);
        self::assertStringContainsString('Meilleure tentative', $export['content']);
        self::assertStringContainsString('Nombre de questions', $export['content']);
        self::assertStringContainsString('Nombre de tentatives', $export['content']);
        self::assertStringContainsString('Quiz A', $export['content']);
        self::assertStringContainsString('Public', $export['content']);
        self::assertStringContainsString('Non commencé', $export['content']);
        self::assertStringContainsString(';0;3;0', $export['content']);
        self::assertSame('Quiz-6e-A.csv', $export['filename']);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testExportPublicQuizDetailCsvUsesSummaryColumnsOnly(): void
    {
        $classes = $this->createMock(ClassroomRepositoryInterface::class);
        $classes->method('find')->with(1)->willReturn(new ClassEntity(1, '6e A', null, 'CLS-1', 9, 'grade_6'));

        $student = $this->user(10, 'student', 1);
        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findStudentsByClassId')->willReturn([$student]);

        $quiz = new Quiz(4, 'Quiz A', null, 9, 'public', false, 0);
        $quizzes = $this->createMock(QuizRepositoryInterface::class);
        $quizzes->method('find')->with(4)->willReturn($quiz);
        $quizzes->method('countQuestions')->with(4)->willReturn(1);

        $quizProgress = $this->createMock(QuizProgressRepositoryInterface::class);
        $quizProgress->method('findLatestByUserIdsAndQuizIds')->willReturn([]);
        $quizProgress->method('findBestProgressByUserIdsAndQuizId')->willReturn([]);

        $export = $this->service(classes: $classes, users: $users, quizzes: $quizzes, quizProgress: $quizProgress)
            ->exportProgressCsv(1, 'quiz_public_detail', null, 4)
        ;

        self::assertStringNotContainsString('"Nom du quiz"', $export['content']);
        self::assertStringNotContainsString('Visibilité', $export['content']);
        self::assertStringNotContainsString('Question;', $export['content']);
        self::assertStringNotContainsString('Résultat', $export['content']);
        self::assertStringContainsString('Nom;Prénom;Pseudo;Progression;"Meilleure tentative";"Nombre de questions";"Nombre de tentatives"', $export['content']);
        self::assertStringContainsString(';"Non commencé";0;1;0', $export['content']);
        self::assertSame('Detail-Quiz-Public-6e-A-Quiz-A.csv', $export['filename']);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testCreateRejectsEmptyName(): void
    {
        try {
            $this->service()->create('   ', null, 'grade_6', 1);
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

    /**
     * Verifies the expected behavior.
     */
    public function testCreateRejectsLongDescription(): void
    {
        try {
            $this->service()->create('6A', str_repeat('x', 1001), 'grade_6', 1);
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

    /**
     * Verifies the expected behavior.
     */
    public function testAssertClassReadableAllowedForAdmin(): void
    {
        $class = new ClassEntity(1, '6A', null, 'CLS-X', 99, 'grade_6');
        $this->service()->assertClassReadable($class, $this->user(1, 'admin'));
        self::assertTrue(true);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testAssertClassReadableAllowedForOwnerTeacher(): void
    {
        $class = new ClassEntity(1, '6A', null, 'CLS-X', 2, 'grade_6');
        $this->service()->assertClassReadable($class, $this->user(2, 'teacher'));
        self::assertTrue(true);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testClassProgressSummaryAggregatesStudentStats(): void
    {
        $student = $this->user(10, 'student', 1);

        $classes = $this->createMock(ClassroomRepositoryInterface::class);
        $classes->method('find')->with(1)->willReturn(new ClassEntity(1, '6e A', null, 'CLS-1', 9, 'grade_6'));

        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findStudentsByClassId')->willReturn([$student]);

        $chapter = new Chapter(3, 'chapter', 'Chapter', null, 0);
        $chapters = $this->createMock(ChapterRepositoryInterface::class);
        $chapters->method('findAll')->willReturn([$chapter]);
        $chapters->method('findTargetClassesByChapterId')->with(3)->willReturn([]);

        $chapterProgress = $this->createMock(ChapterProgressRepositoryInterface::class);
        $chapterProgress->method('findLatestByUserIds')->willReturn([
            new ChapterProgress(1, 10, 3, 'in_progress', 2, null, '2026-01-03 00:00:00', null),
        ]);

        $scenarios = $this->createMock(ScenarioRepositoryInterface::class);
        $scenarios->method('buildPlayScenario')->with(3)->willReturn([
            'steps' => [[], [], [], []],
        ]);

        $quiz = new Quiz(4, 'Quiz', null, 9, 'public', false, 0);
        $quizzes = $this->createMock(QuizRepositoryInterface::class);
        $quizzes->method('findAll')->willReturn([$quiz]);
        $quizzes->method('findTargetClassesByQuizId')->with(4)->willReturn([]);
        $quizzes->method('countQuestions')->with(4)->willReturn(2);

        $quizProgress = $this->createMock(QuizProgressRepositoryInterface::class);
        $quizProgress->method('findLatestByUserIdsAndQuizIds')->willReturn([
            new QuizProgress(2, 10, 4, 'completed', 1, 2, 1, '2026-01-04 00:00:00', '2026-01-05 00:00:00'),
        ]);

        $summary = $this->service(
            classes: $classes,
            users: $users,
            chapterProgress: $chapterProgress,
            chapters: $chapters,
            quizzes: $quizzes,
            quizProgress: $quizProgress,
            scenarios: $scenarios,
        )->classProgressSummary(1);

        self::assertCount(1, $summary);
        self::assertSame(1, $summary[0]['startedChapters']);
        self::assertSame(0, $summary[0]['completedChapters']);
        self::assertSame(1, $summary[0]['startedQuizzes']);
        self::assertSame(1, $summary[0]['completedQuizzes']);
        self::assertSame(2, $summary[0]['totalItems']);
        self::assertSame(75.0, $summary[0]['completionRate']);
        self::assertSame('2026-01-05T00:00:00Z', $summary[0]['lastActivityAt']);
        self::assertSame(50, $summary[0]['chapterProgress'][0]['percent']);
        self::assertSame('2026-01-03T00:00:00Z', $summary[0]['chapterProgress'][0]['startedAt']);
        self::assertSame(100, $summary[0]['quizProgress'][0]['percent']);
        self::assertSame('2026-01-05T00:00:00Z', $summary[0]['quizProgress'][0]['completedAt']);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testListForTeacherDelegatesToRepository(): void
    {
        $expected = [new ClassEntity(1, '6A', null, 'CLS-1', 9, 'grade_6')];
        $classes = $this->createMock(ClassroomRepositoryInterface::class);
        $classes->expects(self::once())->method('findByTeacher')->with(9)->willReturn($expected);

        self::assertSame($expected, $this->service(classes: $classes)->listForTeacher(9));
    }

    /**
     * Service.
     */
    private function service(
        ?ClassroomRepositoryInterface $classes = null,
        ?UserRepositoryInterface $users = null,
        ?RiddleProgressRepositoryInterface $riddleProgress = null,
        ?ChapterProgressRepositoryInterface $chapterProgress = null,
        ?ChapterRepositoryInterface $chapters = null,
        ?RiddleRepositoryInterface $riddles = null,
        ?QuizRepositoryInterface $quizzes = null,
        ?QuizProgressRepositoryInterface $quizProgress = null,
        ?ScenarioRepositoryInterface $scenarios = null,
        ?ApiUserService $userService = null,
    ): ApiClassService {
        $classRepository = $classes ?? $this->createMock(ClassroomRepositoryInterface::class);
        $chapterRepository = $chapters ?? $this->createMock(ChapterRepositoryInterface::class);
        $quizRepository = $quizzes ?? $this->createMock(QuizRepositoryInterface::class);

        return new ApiClassService(
            $classRepository,
            $users ?? $this->createMock(UserRepositoryInterface::class),
            $riddleProgress ?? $this->createMock(RiddleProgressRepositoryInterface::class),
            $chapterProgress ?? $this->createMock(ChapterProgressRepositoryInterface::class),
            $chapterRepository,
            $riddles ?? $this->createMock(RiddleRepositoryInterface::class),
            $quizRepository,
            $quizProgress ?? $this->createMock(QuizProgressRepositoryInterface::class),
            new ChapterAccessResolver($chapterRepository, $classRepository),
            new QuizAccessResolver($quizRepository, $classRepository),
            $scenarios ?? $this->createMock(ScenarioRepositoryInterface::class),
            new PasswordGenerator(),
            $userService ?? $this->createApiUserService(),
        );
    }

    /**
     * User.
     */
    private function user(int $id, string $role, ?int $classId = null): User
    {
        return new User(
            $id,
            'Jean',
            'Dupont',
            'student.test',
            'hash',
            $role,
            null,
            null,
            $classId,
            null,
            '2026-01-01 00:00:00',
        );
    }
}
