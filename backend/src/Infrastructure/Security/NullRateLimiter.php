<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Security;

use Matheopolis\Application\Port\RateLimiterInterface;

/**
 * No-op rate limiter for automated tests (APP_ENV=test).
 */
final class NullRateLimiter implements RateLimiterInterface
{
    /**
     * Hit.
     */
    public function hit(string $key, int $maxAttempts, int $windowSeconds): bool
    {
        return true;
    }
}
