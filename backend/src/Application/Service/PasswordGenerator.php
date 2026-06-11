<?php

declare(strict_types=1);

namespace Matheopolis\Application\Service;

/**
 * Represents the password generator component.
 */
final class PasswordGenerator
{
    private const CHARSET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    /**
     * Generate.
     */
    public function generate(int $length = 12): string
    {
        if ($length < 8) {
            throw new \InvalidArgumentException('Generated password length must be at least 8.');
        }

        $maxIndex = \strlen(self::CHARSET) - 1;
        $password = '';
        for ($i = 0; $i < $length; ++$i) {
            $password .= self::CHARSET[random_int(0, $maxIndex)];
        }

        return $password;
    }
}
