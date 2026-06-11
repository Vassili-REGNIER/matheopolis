<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Service\ChapterAccessResolver;
use Matheopolis\Domain\Chapter;
use Matheopolis\Domain\ClassEntity;
use Matheopolis\Domain\User;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Application\Service\ChapterAccessResolver
 */
final class ChapterAccessResolverTest extends TestCase
{
    /**
     * Verifies the expected behavior.
     */
    public function testGuestCanAccessAnyChapter(): void
    {
        $resolver = $this->resolver([]);
        $chapter = $this->chapter(1);

        self::assertTrue($resolver->canAccess(null, $chapter));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testStudentBlockedWhenClassRestricted(): void
    {
        $chapter = $this->chapter(3);
        $student = $this->user(4, 'student', 1);
        $resolver = $this->resolver([
            ['classId' => 1, 'isActive' => false],
        ]);

        self::assertFalse($resolver->canAccess($student, $chapter));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testFreeUserCanAccessChapter(): void
    {
        $resolver = $this->resolver([]);
        $freeUser = $this->user(5, 'free_user', null);

        self::assertTrue($resolver->canAccess($freeUser, $this->chapter(1)));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testTeacherCanRestrictOwnClass(): void
    {
        $resolver = $this->resolver([], 2);
        $teacher = $this->user(2, 'teacher', null);

        self::assertTrue($resolver->canSetTargetClass($teacher, $this->chapter(1), 7, false));
        self::assertTrue($resolver->canRemoveTargetClass($teacher, 7));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testTeacherCannotRestrictAnotherTeachersClass(): void
    {
        $resolver = $this->resolver([], 8);
        $teacher = $this->user(2, 'teacher', null);

        self::assertFalse($resolver->canSetTargetClass($teacher, $this->chapter(1), 7, false));
        self::assertFalse($resolver->canRemoveTargetClass($teacher, 7));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testAdminCanRestrictAnyClass(): void
    {
        $resolver = $this->resolver([], 8);
        $admin = $this->user(1, 'admin', null);

        self::assertTrue($resolver->canSetTargetClass($admin, $this->chapter(1), 7, false));
        self::assertTrue($resolver->canRemoveTargetClass($admin, 7));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testChapterTargetClassGrantIsRejected(): void
    {
        $resolver = $this->resolver([], 2);
        $teacher = $this->user(2, 'teacher', null);

        self::assertFalse($resolver->canSetTargetClass($teacher, $this->chapter(1), 7, true));
    }

    /**
     * @param array<int, array{classId: int, isActive: bool}> $targetClasses
     */
    private function resolver(array $targetClasses, int $classTeacherId = 2): ChapterAccessResolver
    {
        $repo = $this->createMock(ChapterRepositoryInterface::class);
        $repo->method('findTargetClassesByChapterId')->willReturn($targetClasses);

        $classes = $this->createMock(ClassroomRepositoryInterface::class);
        $classes->method('find')->willReturn(new ClassEntity(
            7,
            'Class 6A',
            null,
            'CLS-CH',
            $classTeacherId,
            'grade_6',
        ));

        return new ChapterAccessResolver($repo, $classes);
    }

    /**
     * Chapter.
     */
    private function chapter(int $id): Chapter
    {
        return new Chapter($id, 'slug-'.$id, 'Title', null, 1);
    }

    /**
     * User.
     */
    private function user(int $id, string $role, ?int $classId): User
    {
        return new User(
            $id,
            'First',
            'Last',
            'user'.$id,
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
