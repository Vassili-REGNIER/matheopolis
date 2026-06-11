<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

/**
 * Defines the contract for the rate limiter dependency.
 */
interface RateLimiterInterface
{
    /**
     * Hit.
     */
    public function hit(string $key, int $maxAttempts, int $windowSeconds): bool;
}
