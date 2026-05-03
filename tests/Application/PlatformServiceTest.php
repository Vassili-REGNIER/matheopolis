<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Application;

use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\CryptoInterface;
use Matheopolis\Application\Port\ProgressRepositoryInterface;
use Matheopolis\Application\Port\PuzzleRepositoryInterface;
use Matheopolis\Application\Port\TeacherCodeRepositoryInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Application\Service\PlatformService;
use Matheopolis\Domain\ClassEntity;
use Matheopolis\Domain\Exception\AuthException;
use Matheopolis\Domain\Puzzle;
use Matheopolis\Domain\PuzzleProgress;
use Matheopolis\Domain\Registration\RegistrationDetails;
use Matheopolis\Domain\Service\ProgressionPolicy;
use Matheopolis\Domain\TeacherCode;
use Matheopolis\Domain\User;
use PHPUnit\Framework\TestCase;

final class PlatformServiceTest extends TestCase
{
    public function testTeacherCannotResetStudentFromAnotherTeacherClass(): void
    {
        $users = new InMemoryUserRepository();
        $classes = new InMemoryClassroomRepository();
        $teacherCodes = new InMemoryTeacherCodeRepository();
        $puzzles = new InMemoryPuzzleRepository();
        $progress = new InMemoryProgressRepository();
        $crypto = new FakeCrypto();
        $auth = new FakeAuthSession();

        $teacher = new User(1, 'T', 'One', 'teacher1', 'hash', 'teacher', 't@x.test');
        $student = new User(2, 'S', 'One', 'student1', 'hash', 'student', 's@x.test', 99);
        $users->add($teacher);
        $users->add($student);
        $classes->add(new ClassEntity(50, 'A', 'A1', 1));

        $service = new PlatformService(
            $users,
            $classes,
            $teacherCodes,
            $puzzles,
            $progress,
            $crypto,
            $auth,
            new ProgressionPolicy(),
        );

        $this->expectException(AuthException::class);
        $service->resetStudentPassword($teacher, 2, 'NewPass1234');
    }

    public function testStudentCannotSolveLockedPuzzle(): void
    {
        $users = new InMemoryUserRepository();
        $classes = new InMemoryClassroomRepository();
        $teacherCodes = new InMemoryTeacherCodeRepository();
        $puzzles = new InMemoryPuzzleRepository();
        $progress = new InMemoryProgressRepository();
        $crypto = new FakeCrypto();
        $auth = new FakeAuthSession();

        $student = new User(2, 'S', 'One', 'student1', 'hash', 'student');
        $users->add($student);
        $puzzles->add(new Puzzle(10, 'p1', 'Puzzle 1', 'Statement', 3, true));
        $progress->maxSolvedByStudent[2] = 1;

        $service = new PlatformService(
            $users,
            $classes,
            $teacherCodes,
            $puzzles,
            $progress,
            $crypto,
            $auth,
            new ProgressionPolicy(),
        );

        $this->expectException(AuthException::class);
        $service->solvePuzzle($student, 10);
    }
}

final class InMemoryUserRepository implements UserRepositoryInterface
{
    /** @var array<int, User> */
    private array $users = [];

    public function add(User $user): void
    {
        $this->users[$user->getId()] = $user;
    }

    public function findByLogin(string $login): ?User
    {
        foreach ($this->users as $user) {
            if ($user->getPseudo() === $login || $user->getEmail() === $login) {
                return $user;
            }
        }

        return null;
    }

    public function find(int $id): ?User
    {
        return $this->users[$id] ?? null;
    }

    public function findByIdAndToken(int $userId, string $tokenHash): ?User
    {
        return $this->users[$userId] ?? null;
    }

    public function setRememberToken(int $userId, ?string $tokenHash): void {}

    public function insert(RegistrationDetails $details): User
    {
        $id = \count($this->users) + 1;
        $user = new User($id, $details->firstname, $details->lastname, $details->pseudo, $details->hashedPassword, $details->role, $details->email, $details->classId);
        $this->users[$id] = $user;

        return $user;
    }

    public function findStudentsByClassIds(array $classIds): array
    {
        return array_values(array_filter(
            $this->users,
            static fn (User $user): bool => 'student' === $user->getRole() && null !== $user->getClassId() && \in_array($user->getClassId(), $classIds, true),
        ));
    }

    public function resetPassword(int $userId, string $passwordHash): void {}

    public function findByRole(string $role): array
    {
        return array_values(array_filter(
            $this->users,
            static fn (User $user): bool => $user->getRole() === $role,
        ));
    }
}

final class InMemoryClassroomRepository implements ClassroomRepositoryInterface
{
    /** @var array<int, ClassEntity> */
    private array $classes = [];

    public function add(ClassEntity $classEntity): void
    {
        $this->classes[$classEntity->getId()] = $classEntity;
    }

    public function findByCode(string $code): ?ClassEntity
    {
        foreach ($this->classes as $classEntity) {
            if ($classEntity->getCode() === $code) {
                return $classEntity;
            }
        }

        return null;
    }

    public function findByTeacher(int $teacherId): array
    {
        return array_values(array_filter(
            $this->classes,
            static fn (ClassEntity $classEntity): bool => $classEntity->getTeacherId() === $teacherId,
        ));
    }

    public function find(int $id): ?ClassEntity
    {
        return $this->classes[$id] ?? null;
    }

    public function insert(string $name, string $code, int $teacherId): ClassEntity
    {
        $classEntity = new ClassEntity(\count($this->classes) + 1, $name, $code, $teacherId);
        $this->classes[$classEntity->getId()] = $classEntity;

        return $classEntity;
    }
}

final class InMemoryTeacherCodeRepository implements TeacherCodeRepositoryInterface
{
    /** @var array<int, TeacherCode> */
    private array $codes = [];

    public function findByCode(string $code): ?TeacherCode
    {
        foreach ($this->codes as $teacherCode) {
            if ($teacherCode->getCode() === $code) {
                return $teacherCode;
            }
        }

        return null;
    }

    public function markAsUsed(int $codeId, int $userId): void {}

    public function create(string $code): TeacherCode
    {
        $teacherCode = new TeacherCode(\count($this->codes) + 1, $code, false, null);
        $this->codes[$teacherCode->getId()] = $teacherCode;

        return $teacherCode;
    }

    public function findAllCodes(): array
    {
        return array_values($this->codes);
    }
}

final class InMemoryPuzzleRepository implements PuzzleRepositoryInterface
{
    /** @var array<int, Puzzle> */
    private array $puzzles = [];

    public function add(Puzzle $puzzle): void
    {
        $this->puzzles[$puzzle->getId()] = $puzzle;
    }

    public function findAll(): array
    {
        return array_values($this->puzzles);
    }

    public function find(int $id): ?Puzzle
    {
        return $this->puzzles[$id] ?? null;
    }

    public function findBySlug(string $slug): ?Puzzle
    {
        foreach ($this->puzzles as $puzzle) {
            if ($puzzle->getSlug() === $slug) {
                return $puzzle;
            }
        }

        return null;
    }

    public function insert(string $slug, string $title, string $statement, int $position, bool $isActive): Puzzle
    {
        $puzzle = new Puzzle(\count($this->puzzles) + 1, $slug, $title, $statement, $position, $isActive);
        $this->puzzles[$puzzle->getId()] = $puzzle;

        return $puzzle;
    }

    public function update(int $id, string $title, string $statement, int $position, bool $isActive): void {}
}

final class InMemoryProgressRepository implements ProgressRepositoryInterface
{
    /** @var array<int, int> */
    public array $maxSolvedByStudent = [];

    public function findByStudent(int $studentId): array
    {
        return [];
    }

    public function findByStudentIds(array $studentIds): array
    {
        return [];
    }

    public function markSolved(int $studentId, int $puzzleId, bool $hintUnlocked): void
    {
        $this->maxSolvedByStudent[$studentId] = max($this->maxSolvedByStudent[$studentId] ?? 0, $puzzleId);
    }

    public function getMaxSolvedPuzzlePosition(int $studentId): int
    {
        return $this->maxSolvedByStudent[$studentId] ?? 0;
    }
}

final class FakeCrypto implements CryptoInterface
{
    public function hashPassword(string $password): string
    {
        return 'hash-'.$password;
    }

    public function verifyPassword(string $password, string $hashedPassword): bool
    {
        return 'hash-'.$password === $hashedPassword;
    }

    public function hashToken(string $token): string
    {
        return 'token-'.$token;
    }
}

final class FakeAuthSession implements AuthSessionInterface
{
    public function check(): bool
    {
        return true;
    }

    public function id(): ?int
    {
        return 1;
    }

    public function login(int $id): void {}

    public function logout(): void {}
}
