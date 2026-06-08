<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Unit;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\RateLimiterInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Application\Service\ApiAuthService;
use Matheopolis\Domain\User;
use Matheopolis\Tests\Support\CreatesUserServices;
use Matheopolis\Tests\Support\Fixture\TestUserFactory;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @covers \Matheopolis\Application\Service\ApiAuthService
 */
final class ApiAuthServiceTest extends TestCase
{
    use CreatesUserServices;

    public function testLoginRejectsInvalidPassword(): void
    {
        $user = new User(
            1,
            'Jean',
            'Dupont',
            'login.user',
            TestUserFactory::DEMO_PASSWORD_HASH,
            'student',
            null,
            null,
            null,
            null,
            '2026-01-01 00:00:00',
        );

        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findByLogin')->willReturn($user);

        $rateLimiter = $this->createMock(RateLimiterInterface::class);
        $rateLimiter->method('hit')->willReturn(true);

        $service = new ApiAuthService(
            $users,
            $this->createMock(AuthSessionInterface::class),
            $rateLimiter,
            $this->createApiUserService(),
        );

        try {
            $service->login('login.user', 'wrong-password');
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(401, $e->status());
        }
    }

    public function testLoginRateLimitedAfterTooManyAttempts(): void
    {
        $rateLimiter = $this->createMock(RateLimiterInterface::class);
        $rateLimiter->method('hit')->willReturn(false);

        $service = new ApiAuthService(
            $this->createMock(UserRepositoryInterface::class),
            $this->createMock(AuthSessionInterface::class),
            $rateLimiter,
            $this->createApiUserService(),
        );

        try {
            $service->login('user', 'password');
            self::fail('Expected ApiException');
        } catch (ApiException $e) {
            self::assertSame(429, $e->status());
        }
    }

    public function testLoginSucceedsAndStartsSession(): void
    {
        $user = new User(
            2,
            'Jean',
            'Dupont',
            'good.user',
            TestUserFactory::DEMO_PASSWORD_HASH,
            'teacher',
            null,
            null,
            null,
            null,
            '2026-01-01 00:00:00',
        );

        $users = $this->createMock(UserRepositoryInterface::class);
        $users->method('findByLogin')->willReturn($user);

        $auth = $this->createMock(AuthSessionInterface::class);
        $auth->expects(self::once())->method('login')->with(2);

        $rateLimiter = $this->createMock(RateLimiterInterface::class);
        $rateLimiter->method('hit')->willReturn(true);

        $service = new ApiAuthService($users, $auth, $rateLimiter, $this->createApiUserService());
        $loggedIn = $service->login('good.user', 'password');

        self::assertSame(2, $loggedIn->getId());
    }

    public function testLogoutClearsSession(): void
    {
        $auth = $this->createMock(AuthSessionInterface::class);
        $auth->expects(self::once())->method('logout');

        $service = new ApiAuthService(
            $this->createMock(UserRepositoryInterface::class),
            $auth,
            $this->createMock(RateLimiterInterface::class),
            $this->createApiUserService(),
        );

        $service->logout();
    }
}
