<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Crypto;

use Matheopolis\Application\Port\CryptoInterface;

final class CryptoService implements CryptoInterface
{
    public function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    public function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    public function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }
}
