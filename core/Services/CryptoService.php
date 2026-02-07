<?php
declare(strict_types=1);

namespace Core\Services;

use Core\Interfaces\CryptoInterface;

/**
 * Cryptography Helper.
 * Handles secure password hashing, token hashing.
 */
final class CryptoService implements CryptoInterface
{
	/**
     * Hashes a high-entropy token.
     * We use SHA-256 which is fast and secure for random strings.
     * * @param string $token The raw token.
     * @return string The hashed token (hexadecimal).
     */
    public function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    /**
     * Hashes a password using the current industry standard.
     * * @param string $password The plain text password.
     * @return string The hashed password.
     */
    public function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    /**
     * Verifies a password against a stored hash.
     * * @param string $password The plain text password provided by the user.
     * @param string $hash The hash stored in the database.
     * @return bool True if the password is valid, false otherwise.
     */
    public function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }
}