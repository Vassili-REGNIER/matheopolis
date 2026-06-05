<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Integration;

use Matheopolis\Infrastructure\Persistence\Repository\ClassRepository;
use Matheopolis\Tests\Support\Fixture\NarrativeFixture;
use Matheopolis\Tests\Support\Fixture\TestUserFactory;
use Matheopolis\Tests\Support\IntegrationTestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Infrastructure\Persistence\Repository\ClassRepository
 */
final class ClassRepositoryTest extends IntegrationTestCase
{
    private ClassRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new ClassRepository($this->db);
    }

    public function testInsertFindByCodeAndListForTeacher(): void
    {
        $teacherId = TestUserFactory::insert($this->db, 'teacher.class', 'teacher');

        $created = $this->repository->insert('Class 6A', 'Desc', 'CLS-REPO', $teacherId, 'grade_7');

        self::assertSame('CLS-REPO', $created->getCode());
        self::assertNotNull($this->repository->findByCode('CLS-REPO'));
        self::assertCount(1, $this->repository->findByTeacher($teacherId));
    }

    public function testArchiveHidesClassFromTeacherList(): void
    {
        $teacherId = TestUserFactory::insert($this->db, 'teacher.class2', 'teacher');
        $classId = NarrativeFixture::insertClass($this->db, $teacherId, 'CLS-ARCH');

        $this->repository->archive($classId);

        self::assertNull($this->repository->findByCode('CLS-ARCH'));
        self::assertSame([], $this->repository->findByTeacher($teacherId));
    }

    public function testUpdateClassMetadata(): void
    {
        $teacherId = TestUserFactory::insert($this->db, 'teacher.upd', 'teacher');
        $created = $this->repository->insert('Old name', null, 'CLS-UPD', $teacherId, 'grade_6');

        $updated = $this->repository->update($created->getId(), 'New name', 'Desc', 'grade_8');

        self::assertNotNull($updated);
        self::assertSame('New name', $updated->getName());
        self::assertSame('grade_8', $updated->getLevel());
    }
}
