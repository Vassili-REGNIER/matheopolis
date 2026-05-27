<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\CookieInterface;
use Matheopolis\Application\Port\CryptoInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;

final class AuthenticationService
{
    private const REMEMBER_COOKIE = 'REMEMBER_ME';

    private const REMEMBER_MINUTES = 43200;

    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly CryptoInterface $crypto,
        private readonly AuthSessionInterface $auth,
        private readonly CookieInterface $cookie,
    ) {}

    public function attemptLogin(string $login, string $password, bool $remember = false): bool
    {
        $user = $this->users->findByLogin($login);
        if (null === $user) {
            return false;
        }

        if (!$this->crypto->verifyPassword($password, $user->getPassword())) {
            return false;
        }

        $this->auth->login($user->getId());

        if ($remember) {
            $this->rememberUser($user->getId());
        }

        return true;
    }

    public function tryAutoLogin(): bool
    {
        if (!$this->cookie->has(self::REMEMBER_COOKIE)) {
            return false;
        }

        $raw = $this->cookie->get(self::REMEMBER_COOKIE);
        if (!\is_string($raw) || '' === $raw) {
            return false;
        }

        $parts = explode(':', $raw, 2);
        if (2 !== \count($parts)) {
            return false;
        }

        [$userIdRaw, $plainToken] = $parts;
        if (!is_numeric($userIdRaw)) {
            return false;
        }

        $userId = (int) $userIdRaw;
        $tokenHash = $this->crypto->hashToken($plainToken);
        $user = $this->users->findByIdAndToken($userId, $tokenHash);
        if (null === $user) {
            $this->cookie->remove(self::REMEMBER_COOKIE);

            return false;
        }

        $this->auth->login($user->getId());

        return true;
    }

    public function logout(): void
    {
        $id = $this->auth->id();
        if (null !== $id) {
            $this->users->setRememberToken($id, null);
        }

        $this->auth->logout();
        $this->cookie->remove(self::REMEMBER_COOKIE);
    }

    private function rememberUser(int $userId): void
    {
        $plain = bin2hex(random_bytes(32));
        $hash = $this->crypto->hashToken($plain);
        $this->users->setRememberToken($userId, $hash);

        $value = $userId.':'.$plain;
        $this->cookie->set(
            self::REMEMBER_COOKIE,
            $value,
            self::REMEMBER_MINUTES,
        );
    }
}
