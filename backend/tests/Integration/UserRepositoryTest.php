<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Integration;

use Matheopolis\Domain\Registration\RegistrationDetails;
use Matheopolis\Infrastructure\Persistence\Repository\UserRepository;
use Matheopolis\Tests\Support\Fixture\NarrativeFixture;
use Matheopolis\Tests\Support\Fixture\TestUserFactory;
use Matheopolis\Tests\Support\IntegrationTestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Infrastructure\Persistence\Repository\UserRepository
 */
final class UserRepositoryTest extends IntegrationTestCase
{
    private UserRepository $repository;

    /**
     * Updates the up.
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new UserRepository($this->db);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testFindByLoginMatchesUsernameOrEmail(): void
    {
        TestUserFactory::insert($this->db, 'lookup.user', 'free_user');

        self::assertNotNull($this->repository->findByLogin('lookup.user'));
        self::assertNull($this->repository->findByLogin('missing.user'));
    }

    /**
     * Verifies the expected behavior.
     */
    public function testInsertStudentAndFindByClass(): void
    {
        $teacherId = TestUserFactory::insert($this->db, 'teacher.users', 'teacher');
        $classId = NarrativeFixture::insertClass($this->db, $teacherId, 'CLS-USERS');

        $student = $this->repository->insert(new RegistrationDetails(
            'Sam',
            'Student',
            'sam.student',
            TestUserFactory::DEMO_PASSWORD_HASH,
            'student',
            null,
            $classId,
        ));

        $students = $this->repository->findStudentsByClassId($classId);

        self::assertCount(1, $students);
        self::assertSame($student->getId(), $students[0]->getId());
    }

    /**
     * Verifies the expected behavior.
     */
    public function testFindStudentsByClassIds(): void
    {
        $teacherId = TestUserFactory::insert($this->db, 'teacher.bulk', 'teacher');
        $classA = NarrativeFixture::insertClass($this->db, $teacherId, 'CLS-A');
        $classB = NarrativeFixture::insertClass($this->db, $teacherId, 'CLS-B');
        $this->repository->insert(new RegistrationDetails(
            'A',
            'One',
            'student.a',
            TestUserFactory::DEMO_PASSWORD_HASH,
            'student',
            null,
            $classA,
        ));
        $this->repository->insert(new RegistrationDetails(
            'B',
            'Two',
            'student.b',
            TestUserFactory::DEMO_PASSWORD_HASH,
            'student',
            null,
            $classB,
        ));

        $students = $this->repository->findStudentsByClassIds([$classA, $classB]);

        self::assertCount(2, $students);
    }
}
