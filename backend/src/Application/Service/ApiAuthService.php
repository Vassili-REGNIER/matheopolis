<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\RateLimiterInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Domain\User;

final class ApiAuthService
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly AuthSessionInterface $auth,
        private readonly RateLimiterInterface $rateLimiter,
    ) {}

    public function login(string $identifier, string $password): User
    {
        $key = 'login:'.strtolower(trim($identifier));
        if (!$this->rateLimiter->hit($key, 5, 300)) {
            throw new ApiException(429, 'RATE_LIMITED', 'Too many login attempts.');
        }

        $user = $this->users->findByLogin(trim($identifier));
        if (null === $user || !password_verify($password, $user->getPassword())) {
            throw new ApiException(401, 'INVALID_CREDENTIALS', 'Invalid credentials.');
        }

        $this->auth->login($user->getId());

        return $user;
    }

    public function logout(): void
    {
        $this->auth->logout();
    }
}
