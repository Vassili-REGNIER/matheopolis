<?php
namespace Core\Interfaces;

interface CryptoInterface {
    public function hashToken(string $token): string;
    public function hashPassword(string $password): string;
    public function verifyPassword(string $password, string $hash): bool;
}