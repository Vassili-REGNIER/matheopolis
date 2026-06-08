<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Support;

use Matheopolis\Application\Port\AuthTokenRepositoryInterface;
use Matheopolis\Application\Port\ClassroomRepositoryInterface;
use Matheopolis\Application\Port\ConfigInterface;
use Matheopolis\Application\Port\MailerInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Application\Service\AcademyEmailPolicy;
use Matheopolis\Application\Service\ApiUserService;
use Matheopolis\Application\Service\AuthTokenService;

trait CreatesUserServices
{
    protected function createAuthTokenService(
        ?AuthTokenRepositoryInterface $tokens = null,
        ?MailerInterface $mailer = null,
    ): AuthTokenService {
        $config = $this->createMock(ConfigInterface::class);
        $config->method('getString')->willReturn('http://127.0.0.1:5173');

        return new AuthTokenService(
            $tokens ?? $this->createMock(AuthTokenRepositoryInterface::class),
            $mailer ?? $this->createMock(MailerInterface::class),
            $config,
        );
    }

    protected function createApiUserService(
        ?UserRepositoryInterface $users = null,
        ?ClassroomRepositoryInterface $classes = null,
        ?AuthTokenService $authTokens = null,
    ): ApiUserService {
        return new ApiUserService(
            $users ?? $this->createMock(UserRepositoryInterface::class),
            $classes ?? $this->createMock(ClassroomRepositoryInterface::class),
            new AcademyEmailPolicy(),
            $authTokens ?? $this->createAuthTokenService(),
        );
    }
}
