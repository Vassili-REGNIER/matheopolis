<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Api;

use Matheopolis\Tests\Support\ApiTestCase;
use Matheopolis\Tests\Support\Fixture\NarrativeFixture;
use Matheopolis\Tests\Support\Fixture\TestUserFactory;
use Matheopolis\Tests\Support\TestDatabase;

/**
 * @internal
 *
 * @coversNothing
 */
final class UsersProfileApiTest extends ApiTestCase
{
    /**
     * Verifies the expected behavior.
     */
    public function testUserCanReadOwnProfile(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        $userId = TestUserFactory::insert($db, 'profile.self', 'free_user');
        $this->api->login('profile.self');

        $response = $this->api->get('/api/users/'.$userId);

        self::assertSame(200, $response['status']);
        self::assertSame('profile.self', $response['json']['data']['user']['username'] ?? null);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testTeacherCanReadStudentInOwnClass(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        $teacherId = TestUserFactory::insert($db, 'profile.teacher', 'teacher');
        $classId = NarrativeFixture::insertClass($db, $teacherId);
        $studentId = TestUserFactory::insert($db, 'profile.student', 'student', $classId);

        $this->api->login('profile.teacher');
        $response = $this->api->get('/api/users/'.$studentId);

        self::assertSame(200, $response['status']);
        self::assertSame('student', $response['json']['data']['user']['role'] ?? null);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testTeacherCannotReadStudentFromAnotherClass(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        $teacherA = TestUserFactory::insert($db, 'teacher.a', 'teacher');
        $teacherB = TestUserFactory::insert($db, 'teacher.b', 'teacher');
        $classB = NarrativeFixture::insertClass($db, $teacherB, 'CLS-B');
        $studentB = TestUserFactory::insert($db, 'student.b', 'student', $classB);
        NarrativeFixture::insertClass($db, $teacherA, 'CLS-A');

        $this->api->login('teacher.a');
        $response = $this->api->get('/api/users/'.$studentB);

        self::assertSame(403, $response['status']);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testUserCannotReadAnotherProfile(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        TestUserFactory::insert($db, 'profile.a', 'free_user');
        $otherId = TestUserFactory::insert($db, 'profile.b', 'free_user');

        $this->api->login('profile.a');
        $response = $this->api->get('/api/users/'.$otherId);

        self::assertSame(403, $response['status']);
    }
}
