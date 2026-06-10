<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ChapterProgressRepositoryInterface;
use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Application\Service\ApiClassService;
use Matheopolis\Application\Service\ApiUserService;
use Matheopolis\Application\Service\PasswordGenerator;
use Matheopolis\Domain\Chapter;
use Matheopolis\Domain\ChapterProgress;
use Matheopolis\Domain\ClassEntity;
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

    public function testNormalizeLevelAcceptsGradeSix(): void
    {
        self::assertSame('grade_6', $this->service()->normalizeLevel('grade_6'));
    }

    public function testNormalizeLevelRejectsUnknownValue(): void
    {
        try {
            $this->service()->normalizeLevel('invalid');
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

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

    public function testClassProgressSummaryEmptyWhenNoStudents(): void
    {
        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findStudentsByClassId')->willReturn([]);

        self::assertSame([], $this->service(users: $users)->classProgressSummary(99));
    }

    public function testExportProgressCsvContainsOverviewHeaderAndStudentRow(): void
    {
        $student = $this->user(10, 'student', 1);
        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findStudentsByClassId')->willReturn([$student]);

        $chapters = $this->createMock(ChapterRepositoryInterface::class);
        $chapters->method('findAll')->willReturn([new Chapter(1, 'slug', 'Chapter 1', null, 0)]);

        $chapterProgress = $this->createMock(ChapterProgressRepositoryInterface::class);
        $chapterProgress->method('findLatestByUserIds')->willReturn([]);

        $export = $this->service(users: $users, chapters: $chapters, chapterProgress: $chapterProgress)
            ->exportProgressCsv(1)
        ;

        self::assertStringContainsString('nom', $export['content']);
        self::assertStringContainsString('student.test', $export['content']);
        self::assertSame('class-1-progress-overview.csv', $export['filename']);
    }

    public function testCreateRejectsEmptyName(): void
    {
        try {
            $this->service()->create('   ', null, 'grade_6', 1);
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

    public function testCreateRejectsLongDescription(): void
    {
        try {
            $this->service()->create('6A', str_repeat('x', 1001), 'grade_6', 1);
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

    public function testAssertClassReadableAllowedForAdmin(): void
    {
        $class = new ClassEntity(1, '6A', null, 'CLS-X', 99, 'grade_6');
        $this->service()->assertClassReadable($class, $this->user(1, 'admin'));
        self::assertTrue(true);
    }

    public function testAssertClassReadableAllowedForOwnerTeacher(): void
    {
        $class = new ClassEntity(1, '6A', null, 'CLS-X', 2, 'grade_6');
        $this->service()->assertClassReadable($class, $this->user(2, 'teacher'));
        self::assertTrue(true);
    }

    public function testClassProgressSummaryAggregatesStudentStats(): void
    {
        $student = $this->user(10, 'student', 1);
        $completed = new ChapterProgress(1, 10, 5, 'completed', 1, 2, 6, '2026-01-01 00:00:00', '2026-01-02 00:00:00');
        $inProgress = new ChapterProgress(2, 10, 6, 'in_progress', 0, 0, null, '2026-01-04 00:00:00', null);

        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findStudentsByClassId')->willReturn([$student]);

        $chapterProgress = $this->createMock(ChapterProgressRepositoryInterface::class);
        $chapterProgress->method('findLatestByUserIds')->willReturn([$completed, $inProgress]);

        $summary = $this->service(users: $users, chapterProgress: $chapterProgress)->classProgressSummary(1);

        self::assertCount(1, $summary);
        self::assertSame(2, $summary[0]['startedChapters']);
        self::assertSame(1, $summary[0]['completedChapters']);
        self::assertSame(50.0, $summary[0]['completionRate']);
        self::assertSame('2026-01-04 00:00:00', $summary[0]['lastActivityAt']);
    }

    public function testListForTeacherDelegatesToRepository(): void
    {
        $expected = [new ClassEntity(1, '6A', null, 'CLS-1', 9, 'grade_6')];
        $classes = $this->createMock(ClassroomRepositoryInterface::class);
        $classes->expects(self::once())->method('findByTeacher')->with(9)->willReturn($expected);

        self::assertSame($expected, $this->service(classes: $classes)->listForTeacher(9));
    }

    private function service(
        ?ClassroomRepositoryInterface $classes = null,
        ?UserRepositoryInterface $users = null,
        ?ChapterProgressRepositoryInterface $chapterProgress = null,
        ?ChapterRepositoryInterface $chapters = null,
        ?ApiUserService $userService = null,
    ): ApiClassService {
        return new ApiClassService(
            $classes ?? $this->createMock(ClassroomRepositoryInterface::class),
            $users ?? $this->createMock(UserRepositoryInterface::class),
            $chapterProgress ?? $this->createMock(ChapterProgressRepositoryInterface::class),
            $chapters ?? $this->createMock(ChapterRepositoryInterface::class),
            new PasswordGenerator(),
            $userService ?? $this->createApiUserService(),
        );
    }

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
