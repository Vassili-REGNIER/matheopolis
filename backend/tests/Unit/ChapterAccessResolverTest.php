<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Port\ChapterRepositoryInterface;
use Matheopolis\Application\Service\ChapterAccessResolver;
use Matheopolis\Domain\Chapter;
use Matheopolis\Domain\User;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Application\Service\ChapterAccessResolver
 */
final class ChapterAccessResolverTest extends TestCase
{
    public function testGuestCanAccessAnyChapter(): void
    {
        $resolver = $this->resolver([]);
        $chapter = $this->chapter(1);

        self::assertTrue($resolver->canAccess(null, $chapter));
    }

    public function testStudentBlockedWhenClassRestricted(): void
    {
        $chapter = $this->chapter(3);
        $student = $this->user(4, 'student', 1);
        $resolver = $this->resolver([
            ['classId' => 1, 'isActive' => false],
        ]);

        self::assertFalse($resolver->canAccess($student, $chapter));
    }

    public function testFreeUserCanAccessChapter(): void
    {
        $resolver = $this->resolver([]);
        $freeUser = $this->user(5, 'free_user', null);

        self::assertTrue($resolver->canAccess($freeUser, $this->chapter(1)));
    }

    /**
     * @param array<int, array{classId: int, isActive: bool}> $targetClasses
     */
    private function resolver(array $targetClasses): ChapterAccessResolver
    {
        $repo = $this->createMock(ChapterRepositoryInterface::class);
        $repo->method('findTargetClassesByChapterId')->willReturn($targetClasses);

        return new ChapterAccessResolver($repo);
    }

    private function chapter(int $id): Chapter
    {
        return new Chapter($id, 'slug-'.$id, 'Title', null, 1);
    }

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
            $classId,
            null,
            '2026-01-01 00:00:00',
        );
    }
}
