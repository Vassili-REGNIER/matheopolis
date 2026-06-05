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
final class UsersApiTest extends ApiTestCase
{
    public function testRegisterFreeAccount(): void
    {
        $response = $this->api->post('/api/users', [
            'firstName' => 'Felix',
            'lastName' => 'Demo',
            'email' => 'felix.demo.'.uniqid('', true).'@gmail.com',
            'password' => 'password123',
        ]);

        self::assertSame(201, $response['status']);
        self::assertSame('free_user', $response['json']['data']['user']['role'] ?? null);
    }

    public function testRegisterTeacherRequiresAcademicEmail(): void
    {
        $response = $this->api->post('/api/users/teachers', [
            'firstName' => 'Theo',
            'lastName' => 'Teacher',
            'email' => 'theo.bad@gmail.com',
            'password' => 'password123',
        ]);

        self::assertSame(422, $response['status']);
        self::assertSame('INVALID_TEACHER_EMAIL_DOMAIN', $response['json']['error']['code'] ?? null);
    }

    public function testRegisterTeacherWithAcademicEmail(): void
    {
        $email = 'teacher.'.uniqid('', true).'@ac-paris.fr';
        $response = $this->api->post('/api/users/teachers', [
            'firstName' => 'Theo',
            'lastName' => 'Teacher',
            'email' => $email,
            'password' => 'password123',
        ]);

        self::assertSame(201, $response['status']);
        self::assertSame('teacher', $response['json']['data']['user']['role'] ?? null);
    }

    public function testRegisterStudentWithClassCode(): void
    {
        $db = TestDatabase::getInstance()->queryable();
        $teacherId = TestUserFactory::insert($db, 'teacher.reg', 'teacher');
        $classId = NarrativeFixture::insertClass($db, $teacherId, 'CLS-REG');
        $codeRow = $db->execute('SELECT code FROM classes WHERE id = :id LIMIT 1', ['id' => $classId])->fetch();
        $code = (string) $codeRow['code'];

        $response = $this->api->post('/api/users/students', [
            'firstName' => 'Sam',
            'lastName' => 'Student',
            'password' => 'password123',
            'classCode' => $code,
        ]);

        self::assertSame(201, $response['status']);
        self::assertSame('student', $response['json']['data']['user']['role'] ?? null);
        self::assertSame($classId, $response['json']['data']['user']['classId'] ?? null);
    }

    public function testRegisterRejectsDuplicateEmail(): void
    {
        $email = 'dup.'.uniqid('', true).'@gmail.com';
        $first = $this->api->post('/api/users', [
            'firstName' => 'First',
            'lastName' => 'User',
            'email' => $email,
            'password' => 'password123',
        ]);
        self::assertSame(201, $first['status']);

        $second = $this->api->post('/api/users', [
            'firstName' => 'Other',
            'lastName' => 'User',
            'email' => $email,
            'password' => 'password123',
        ]);
        self::assertSame(409, $second['status']);
    }

    public function testRegisterRejectsShortPassword(): void
    {
        $response = $this->api->post('/api/users', [
            'firstName' => 'Bad',
            'lastName' => 'Password',
            'email' => 'bad.'.uniqid('', true).'@gmail.com',
            'password' => 'short',
        ]);

        self::assertSame(422, $response['status']);
    }
}
