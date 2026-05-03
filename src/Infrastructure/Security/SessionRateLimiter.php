<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Security;

use Matheopolis\Application\Port\RateLimiterInterface;
use Matheopolis\Application\Port\SessionInterface;

final class SessionRateLimiter implements RateLimiterInterface
{
    private const STORAGE_KEY = '_rate_limit';

    public function __construct(
        private readonly SessionInterface $session,
    ) {}

    public function hit(string $key, int $maxAttempts, int $windowSeconds): bool
    {
        $currentTime = time();
        $storage = $this->session->get(self::STORAGE_KEY, []);
        if (!\is_array($storage)) {
            $storage = [];
        }

        $bucket = $storage[$key] ?? ['count' => 0, 'started_at' => $currentTime];
        if (!\is_array($bucket)) {
            $bucket = ['count' => 0, 'started_at' => $currentTime];
        }

        $startedAtRaw = $bucket['started_at'] ?? $currentTime;
        $startedAt = \is_int($startedAtRaw) ? $startedAtRaw : $currentTime;
        if (($currentTime - $startedAt) >= $windowSeconds) {
            $bucket = ['count' => 0, 'started_at' => $currentTime];
        }

        $countRaw = $bucket['count'] ?? 0;
        $count = \is_int($countRaw) ? $countRaw : 0;
        $count++;
        $bucket['count'] = $count;

        $storage[$key] = $bucket;
        $this->session->set(self::STORAGE_KEY, $storage);

        return $count <= $maxAttempts;
    }
}
