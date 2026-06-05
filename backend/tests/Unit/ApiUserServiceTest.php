<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Application\Service\AcademyEmailPolicy;
use Matheopolis\Application\Service\ApiUserService;
use Matheopolis\Domain\ClassEntity;
use Matheopolis\Domain\User;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Application\Service\ApiUserService
 */
final class ApiUserServiceTest extends TestCase
{
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
        ;

        $service = new ApiUserService(
            $users,
            $this->createMock(ClassroomRepositoryInterface::class),
            new AcademyEmailPolicy(),
        );

        $service->registerTeacher('Marie', 'Curie', 'prof@ac-paris.fr', 'password123');
    }

    public function testRegisterTeacherRejectsNonAcademicEmail(): void
    {
        $service = new ApiUserService(
            $this->createMock(UserRepositoryInterface::class),
            $this->createMock(ClassroomRepositoryInterface::class),
            new AcademyEmailPolicy(),
        );

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
        $service = new ApiUserService(
            $this->createMock(UserRepositoryInterface::class),
            $this->createMock(ClassroomRepositoryInterface::class),
            new AcademyEmailPolicy(),
        );

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

        $service = new ApiUserService(
            $this->createMock(UserRepositoryInterface::class),
            $classes,
            new AcademyEmailPolicy(),
        );

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
        ;

        $service = new ApiUserService(
            $users,
            $this->createMock(ClassroomRepositoryInterface::class),
            new AcademyEmailPolicy(),
        );

        $service->registerAccount('Felix', 'Demo', 'felix@gmail.com', 'password123');
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
        ;

        $service = new ApiUserService(
            $users,
            $classes,
            new AcademyEmailPolicy(),
        );

        $service->registerStudent('Sam', 'Student', 'password123', 'CLS-OK');
    }

    public function testRegisterTeacherRejectsDuplicateEmail(): void
    {
        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findByLogin')->willReturn($this->createMock(User::class));

        $service = new ApiUserService(
            $users,
            $this->createMock(ClassroomRepositoryInterface::class),
            new AcademyEmailPolicy(),
        );

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
        ;

        $service = new ApiUserService(
            $users,
            $this->createMock(ClassroomRepositoryInterface::class),
            new AcademyEmailPolicy(),
        );

        $service->registerAccount('Marie', 'Curie', 'prof@ac-paris.fr', 'password123');
    }

    public function testRegisterTeacherRejectsShortPassword(): void
    {
        $service = new ApiUserService(
            $this->createMock(UserRepositoryInterface::class),
            $this->createMock(ClassroomRepositoryInterface::class),
            new AcademyEmailPolicy(),
        );

        try {
            $service->registerTeacher('Marie', 'Curie', 'prof@ac-paris.fr', 'short');
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

    public function testRegisterTeacherRejectsInvalidEmail(): void
    {
        $service = new ApiUserService(
            $this->createMock(UserRepositoryInterface::class),
            $this->createMock(ClassroomRepositoryInterface::class),
            new AcademyEmailPolicy(),
        );

        try {
            $service->registerTeacher('Marie', 'Curie', 'not-an-email', 'password123');
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(422, $e->status());
        }
    }

    public function testRegisterTeacherRejectsEmptyFirstName(): void
    {
        $service = new ApiUserService(
            $this->createMock(UserRepositoryInterface::class),
            $this->createMock(ClassroomRepositoryInterface::class),
            new AcademyEmailPolicy(),
        );

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
        ;

        $service = new ApiUserService(
            $users,
            $this->createMock(ClassroomRepositoryInterface::class),
            new AcademyEmailPolicy(),
        );

        $service->registerTeacher('Élodie', 'Dupont', 'prof@ac-paris.fr', 'password123');
    }
}
