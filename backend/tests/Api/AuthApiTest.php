<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Api;

use Matheopolis\Tests\Support\ApiTestCase;
use Matheopolis\Tests\Support\Fixture\TestUserFactory;
use Matheopolis\Tests\Support\TestDatabase;

/**
 * @internal
 */
final class AuthApiTest extends ApiTestCase
{
    public function testLoginRejectsWrongPassword(): void
    {
        TestUserFactory::insert(TestDatabase::getInstance()->queryable(), 'bad.login', 'student');

        $response = $this->api->post('/api/auth/login', [
            'identifier' => 'bad.login',
            'password' => 'not-the-password',
        ]);

        self::assertSame(401, $response['status']);
        self::assertSame('INVALID_CREDENTIALS', $response['json']['error']['code'] ?? null);
    }

    public function testLoginReturnsCsrfToken(): void
    {
        TestUserFactory::insert(TestDatabase::getInstance()->queryable(), 'login.user', 'student');

        $this->api->login('login.user');

        $me = $this->api->get('/api/auth/me');
        self::assertSame(200, $me['status']);
        self::assertSame('login.user', $me['json']['data']['user']['username'] ?? null);
    }

    public function testLogoutInvalidatesSession(): void
    {
        TestUserFactory::insert(TestDatabase::getInstance()->queryable(), 'logout.user', 'student');
        $this->api->login('logout.user');

        $logout = $this->api->post('/api/auth/logout', [], true);
        self::assertSame(204, $logout['status']);

        $me = $this->api->get('/api/auth/me');
        self::assertSame(401, $me['status']);
    }

    public function testLoginRateLimitDisabledInTestEnvironment(): void
    {
        TestUserFactory::insert(TestDatabase::getInstance()->queryable(), 'rate.user', 'student');

        for ($i = 0; $i < 6; ++$i) {
            $response = $this->api->post('/api/auth/login', [
                'identifier' => 'rate.user',
                'password' => 'wrong-password',
            ]);
            self::assertNotSame(429, $response['status'], 'Rate limit must be off when APP_ENV=test');
        }
    }
}
