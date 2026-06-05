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
final class ClassesApiTest extends ApiTestCase
{
    public function testStudentCannotListClasses(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        TestUserFactory::insert($db, 'student.classes', 'student');

        $this->api->login('student.classes');
        $response = $this->api->get('/api/classes');

        self::assertSame(403, $response['status']);
    }

    public function testTeacherUpdatesAndArchivesClass(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        TestUserFactory::insert($db, 'teacher.patch', 'teacher');
        $this->api->login('teacher.patch');

        $create = $this->api->post('/api/classes', [
            'name' => 'Before patch',
            'level' => 'grade_7',
        ], true);
        $classId = $create['json']['data']['class']['id'] ?? null;

        $patch = $this->api->patch('/api/classes/'.$classId, [
            'name' => 'After patch',
            'description' => 'Updated',
        ], true);
        self::assertSame(200, $patch['status']);
        self::assertSame('After patch', $patch['json']['data']['class']['name'] ?? null);

        $delete = $this->api->delete('/api/classes/'.$classId, true);
        self::assertSame(204, $delete['status']);

        $list = $this->api->get('/api/classes');
        $ids = array_column($list['json']['data']['items'] ?? [], 'id');
        self::assertNotContains($classId, $ids);
    }

    public function testTeacherViewsClassDetails(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        $teacherId = TestUserFactory::insert($db, 'teacher.details', 'teacher');
        $classId = NarrativeFixture::insertClass($db, $teacherId, 'CLS-DET');
        TestUserFactory::insert($db, 'student.details', 'student', $classId);

        $this->api->login('teacher.details');
        $response = $this->api->get('/api/classes/'.$classId);

        self::assertSame(200, $response['status']);
        self::assertSame('CLS-DET', $response['json']['data']['class']['code'] ?? null);
        self::assertCount(1, $response['json']['data']['students'] ?? []);
    }

    public function testTeacherCreatesAndListsClass(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        TestUserFactory::insert($db, 'teacher.classes', 'teacher');
        $this->api->login('teacher.classes');

        $create = $this->api->post('/api/classes', [
            'name' => 'Class API',
            'description' => 'Test class',
            'level' => 'grade_6',
        ], true);

        self::assertSame(201, $create['status']);
        $classId = $create['json']['data']['class']['id'] ?? null;

        $list = $this->api->get('/api/classes');
        $ids = array_column($list['json']['data']['items'] ?? [], 'id');

        self::assertContains($classId, $ids);
    }

    public function testTeacherListsStudentsInClass(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        $teacherId = TestUserFactory::insert($db, 'teacher.students', 'teacher');
        $classId = NarrativeFixture::insertClass($db, $teacherId, 'CLS-STU');
        TestUserFactory::insert($db, 'student.list', 'student', $classId);

        $this->api->login('teacher.students');
        $response = $this->api->get('/api/classes/'.$classId.'/students');

        self::assertSame(200, $response['status']);
        self::assertCount(1, $response['json']['data']['items'] ?? []);
    }

    public function testTeacherViewsStudentsProgressAndCsvExport(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        $teacherId = TestUserFactory::insert($db, 'teacher.progress', 'teacher');
        $classId = NarrativeFixture::insertClass($db, $teacherId, 'CLS-PROG');
        TestUserFactory::insert($db, 'student.progress', 'student', $classId);
        $narrative = NarrativeFixture::insertChallengeRiddle($db, 'prog-chapter', 'prog-riddle');

        $this->api->login('student.progress');
        $this->api->post('/api/riddles/'.$narrative['riddleId'].'/start', [], true);
        $this->api->post('/api/riddles/'.$narrative['riddleId'].'/responses', [
            'questionIndex' => 0,
            'answer' => 'ans0',
        ], true);

        $this->api->login('teacher.progress');

        $progress = $this->api->get('/api/classes/'.$classId.'/students/progress');
        self::assertSame(200, $progress['status']);
        self::assertNotEmpty($progress['json']['data']['items'] ?? []);

        $export = $this->api->get('/api/classes/'.$classId.'/students/progress/export');
        self::assertSame(200, $export['status']);
        self::assertStringContainsString('firstName', $export['body']);
    }
}
