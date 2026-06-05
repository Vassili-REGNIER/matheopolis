<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\RiddleProgressRepositoryInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Application\Service\ApiClassService;
use Matheopolis\Domain\ClassEntity;
use Matheopolis\Domain\RiddleProgress;
use Matheopolis\Domain\User;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Application\Service\ApiClassService
 */
final class ApiClassServiceTest extends TestCase
{
    public function testCreateInsertsClassWithGeneratedCode(): void
    {
        $classes = $this->createMock(ClassroomRepositoryInterface::class);
        $classes->expects(self::once())
            ->method('insert')
            ->willReturn(new ClassEntity(1, '6A', 'Desc', 'CLS-GEN', 9, 'grade_6'));

        $service = new ApiClassService(
            $classes,
            $this->createMock(UserRepositoryInterface::class),
            $this->createMock(RiddleProgressRepositoryInterface::class),
        );

        $created = $service->create('6A', 'Desc', 'grade_6', 9);
        self::assertSame('CLS-GEN', $created->getCode());
    }

    public function testNormalizeLevelAcceptsGradeSix(): void
    {
        $service = new ApiClassService(
            $this->createMock(ClassroomRepositoryInterface::class),
            $this->createMock(UserRepositoryInterface::class),
            $this->createMock(RiddleProgressRepositoryInterface::class),
        );

        self::assertSame('grade_6', $service->normalizeLevel('grade_6'));
    }

    public function testNormalizeLevelRejectsUnknownValue(): void
    {
        $service = new ApiClassService(
            $this->createMock(ClassroomRepositoryInterface::class),
            $this->createMock(UserRepositoryInterface::class),
            $this->createMock(RiddleProgressRepositoryInterface::class),
        );

        try {
            $service->normalizeLevel('invalid');
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

    public function testAssertClassReadableDeniedForOtherTeacher(): void
    {
        $class = new ClassEntity(1, '6A', null, 'CLS-X', 99, 'grade_6');
        $teacher = $this->user(2, 'teacher');

        $service = new ApiClassService(
            $this->createMock(ClassroomRepositoryInterface::class),
            $this->createMock(UserRepositoryInterface::class),
            $this->createMock(RiddleProgressRepositoryInterface::class),
        );

        try {
            $service->assertClassReadable($class, $teacher);
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(403, $e->status());
        }
    }

    public function testClassProgressSummaryEmptyWhenNoStudents(): void
    {
        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findStudentsByClassId')->willReturn([]);

        $service = new ApiClassService(
            $this->createMock(ClassroomRepositoryInterface::class),
            $users,
            $this->createMock(RiddleProgressRepositoryInterface::class),
        );

        self::assertSame([], $service->classProgressSummary(99));
    }

    public function testExportProgressCsvContainsHeaderAndStudentRow(): void
    {
        $student = $this->user(10, 'student', 1);
        $progress = new RiddleProgress(1, 10, 5, 'completed', 1, 2, '2026-01-01 00:00:00', '2026-01-02 00:00:00', '2026-01-03 00:00:00');

        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findStudentsByClassId')->willReturn([$student]);

        $riddleProgress = $this->createMock(RiddleProgressRepositoryInterface::class);
        $riddleProgress->method('findByUserIds')->willReturn([$progress]);

        $service = new ApiClassService(
            $this->createMock(ClassroomRepositoryInterface::class),
            $users,
            $riddleProgress,
        );

        $export = $service->exportProgressCsv(1);

        self::assertStringContainsString('firstName', $export['content']);
        self::assertStringContainsString('student.test', $export['content']);
        self::assertSame('class-1-students-progress.csv', $export['filename']);
    }

    public function testCreateRejectsEmptyName(): void
    {
        $service = new ApiClassService(
            $this->createMock(ClassroomRepositoryInterface::class),
            $this->createMock(UserRepositoryInterface::class),
            $this->createMock(RiddleProgressRepositoryInterface::class),
        );

        try {
            $service->create('   ', null, 'grade_6', 1);
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

    public function testCreateRejectsLongDescription(): void
    {
        $service = new ApiClassService(
            $this->createMock(ClassroomRepositoryInterface::class),
            $this->createMock(UserRepositoryInterface::class),
            $this->createMock(RiddleProgressRepositoryInterface::class),
        );

        try {
            $service->create('6A', str_repeat('x', 1001), 'grade_6', 1);
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

    public function testAssertClassReadableAllowedForAdmin(): void
    {
        $class = new ClassEntity(1, '6A', null, 'CLS-X', 99, 'grade_6');
        $admin = $this->user(1, 'admin');

        $service = new ApiClassService(
            $this->createMock(ClassroomRepositoryInterface::class),
            $this->createMock(UserRepositoryInterface::class),
            $this->createMock(RiddleProgressRepositoryInterface::class),
        );

        $service->assertClassReadable($class, $admin);
        self::assertTrue(true);
    }

    public function testAssertClassReadableAllowedForOwnerTeacher(): void
    {
        $class = new ClassEntity(1, '6A', null, 'CLS-X', 2, 'grade_6');
        $teacher = $this->user(2, 'teacher');

        $service = new ApiClassService(
            $this->createMock(ClassroomRepositoryInterface::class),
            $this->createMock(UserRepositoryInterface::class),
            $this->createMock(RiddleProgressRepositoryInterface::class),
        );

        $service->assertClassReadable($class, $teacher);
        self::assertTrue(true);
    }

    public function testClassProgressSummaryAggregatesStudentStats(): void
    {
        $student = $this->user(10, 'student', 1);
        $completed = new RiddleProgress(1, 10, 5, 'completed', 1, 2, '2026-01-01 00:00:00', '2026-01-02 00:00:00', '2026-01-03 00:00:00');
        $inProgress = new RiddleProgress(2, 10, 6, 'in_progress', 0, 0, '2026-01-04 00:00:00', null, '2026-01-04 00:00:00');

        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findStudentsByClassId')->willReturn([$student]);

        $riddleProgress = $this->createMock(RiddleProgressRepositoryInterface::class);
        $riddleProgress->method('findByUserIds')->willReturn([$completed, $inProgress]);

        $service = new ApiClassService(
            $this->createMock(ClassroomRepositoryInterface::class),
            $users,
            $riddleProgress,
        );

        $summary = $service->classProgressSummary(1);

        self::assertCount(1, $summary);
        self::assertSame(2, $summary[0]['startedRiddles']);
        self::assertSame(1, $summary[0]['completedRiddles']);
        self::assertSame(50.0, $summary[0]['completionRate']);
        self::assertSame('2026-01-04 00:00:00', $summary[0]['lastActivityAt']);
    }

    public function testListForTeacherDelegatesToRepository(): void
    {
        $expected = [new ClassEntity(1, '6A', null, 'CLS-1', 9, 'grade_6')];
        $classes = $this->createMock(ClassroomRepositoryInterface::class);
        $classes->expects(self::once())->method('findByTeacher')->with(9)->willReturn($expected);

        $service = new ApiClassService(
            $classes,
            $this->createMock(UserRepositoryInterface::class),
            $this->createMock(RiddleProgressRepositoryInterface::class),
        );

        self::assertSame($expected, $service->listForTeacher(9));
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
            $classId,
            null,
            '2026-01-01 00:00:00',
        );
    }
}
