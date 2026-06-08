<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Domain\ClassEntity;
use Matheopolis\Domain\User;
use Matheopolis\Tests\Support\CreatesUserServices;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Application\Service\ApiUserService
 */
final class ApiUserServiceTest extends TestCase
{
    use CreatesUserServices;

    public function testRegisterTeacherCreatesAccountWithAcademicEmail(): void
    {
        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findByLogin')->willReturn(null);
        $users->method('findByUsername')->willReturn(null);
        $users->expects(self::once())
            ->method('insert')
            ->with(self::callback(static function ($details): bool {
                return 'teacher' === $details->role && 'prof@ac-paris.fr' === $details->email;
            }))
            ->willReturn($this->insertedUser())
        ;

        $this->createApiUserService($users)->registerTeacher('Marie', 'Curie', 'prof@ac-paris.fr', 'password123');
    }

    public function testRegisterTeacherRejectsNonAcademicEmail(): void
    {
        $service = $this->createApiUserService();

        try {
            $service->registerTeacher('Marie', 'Curie', 'marie@gmail.com', 'password123');
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
            self::assertSame('INVALID_TEACHER_EMAIL_DOMAIN', $e->codeName());
        }
    }

    public function testRegisterStudentRequiresClassCode(): void
    {
        $service = $this->createApiUserService();

        try {
            $service->registerStudent('Sam', 'Student', 'password123', '');
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

    public function testRegisterStudentRejectsUnknownClassCode(): void
    {
        $classes = $this->createMock(ClassroomRepositoryInterface::class);
        $classes->method('findByCode')->willReturn(null);

        $service = $this->createApiUserService(classes: $classes);

        try {
            $service->registerStudent('Sam', 'Student', 'password123', 'UNKNOWN');
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

    public function testRegisterAccountAssignsFreeUserForPersonalEmail(): void
    {
        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findByLogin')->willReturn(null);
        $users->method('findByUsername')->willReturn(null);
        $users->expects(self::once())
            ->method('insert')
            ->with(self::callback(static function ($details): bool {
                return 'free_user' === $details->role;
            }))
            ->willReturn($this->insertedUser())
        ;

        $this->createApiUserService($users)->registerAccount('Felix', 'Demo', 'felix@gmail.com', 'password123');
    }

    public function testRegisterStudentUsesClassFromCode(): void
    {
        $class = new ClassEntity(3, '6A', null, 'CLS-OK', 2, 'grade_6');
        $classes = $this->createMock(ClassroomRepositoryInterface::class);
        $classes->method('findByCode')->with('CLS-OK')->willReturn($class);

        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findByUsername')->willReturn(null);
        $users->expects(self::once())
            ->method('insert')
            ->with(self::callback(static function ($details): bool {
                return 'student' === $details->role && 3 === $details->classId;
            }))
            ->willReturn($this->insertedUser(role: 'student'))
        ;

        $this->createApiUserService($users, $classes)->registerStudent('Sam', 'Student', 'password123', 'CLS-OK');
    }

    public function testRegisterTeacherRejectsDuplicateEmail(): void
    {
        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findByLogin')->willReturn($this->createMock(User::class));

        $service = $this->createApiUserService($users);

        try {
            $service->registerTeacher('Marie', 'Curie', 'prof@ac-paris.fr', 'password123');
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(409, $e->status());
        }
    }

    public function testRegisterAccountAssignsTeacherForAcademicEmail(): void
    {
        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findByLogin')->willReturn(null);
        $users->method('findByUsername')->willReturn(null);
        $users->expects(self::once())
            ->method('insert')
            ->with(self::callback(static function ($details): bool {
                return 'teacher' === $details->role;
            }))
            ->willReturn($this->insertedUser())
        ;

        $this->createApiUserService($users)->registerAccount('Marie', 'Curie', 'prof@ac-paris.fr', 'password123');
    }

    public function testRegisterTeacherRejectsShortPassword(): void
    {
        $service = $this->createApiUserService();

        try {
            $service->registerTeacher('Marie', 'Curie', 'prof@ac-paris.fr', 'short');
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

    public function testRegisterTeacherRejectsInvalidEmail(): void
    {
        $service = $this->createApiUserService();

        try {
            $service->registerTeacher('Marie', 'Curie', 'not-an-email', 'password123');
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

    public function testRegisterTeacherRejectsEmptyFirstName(): void
    {
        $service = $this->createApiUserService();

        try {
            $service->registerTeacher('   ', 'Curie', 'prof@ac-paris.fr', 'password123');
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

    public function testRegisterTeacherGeneratesUsernameAfterCollision(): void
    {
        $existing = $this->createMock(User::class);

        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findByLogin')->willReturn(null);
        $users->method('findByUsername')
            ->willReturnOnConsecutiveCalls($existing, null)
        ;
        $users->expects(self::once())
            ->method('insert')
            ->with(self::callback(static function ($details): bool {
                return str_ends_with($details->pseudo, '2');
            }))
            ->willReturn($this->insertedUser())
        ;

        $this->createApiUserService($users)->registerTeacher('Élodie', 'Dupont', 'prof@ac-paris.fr', 'password123');
    }

    private function insertedUser(int $id = 42, string $role = 'teacher'): User
    {
        return new User(
            $id,
            'Marie',
            'Curie',
            'marie.curie',
            'hash',
            $role,
            'prof@ac-paris.fr',
            null,
            null,
            null,
            '2026-01-01 00:00:00',
        );
    }
}
