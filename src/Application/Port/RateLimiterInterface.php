<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

interface RateLimiterInterface
{
    public function hit(string $key, int $maxAttempts, int $windowSeconds): bool;
}
