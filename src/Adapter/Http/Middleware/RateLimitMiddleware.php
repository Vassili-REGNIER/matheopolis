<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Middleware;

use Matheopolis\Adapter\Http\Exception\Client\TooManyRequestsException;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\LoggerInterface;
use Matheopolis\Application\Port\RateLimiterInterface;

final class RateLimitMiddleware
{
    public function __construct(
        private readonly RateLimiterInterface $rateLimiter,
        private readonly HttpInterface $http,
        private readonly LoggerInterface $logger,
    ) {}

    public function handle(): void
    {
        if (!$this->http->isMethodAllowed('POST')) {
            return;
        }

        $path = $this->http->getRequestedPath();
        if (!\in_array($path, ['/action/login', '/action/register', '/action/join'], true)) {
            return;
        }

        $ipRaw = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $ip = \is_string($ipRaw) ? $ipRaw : 'unknown';
        $key = sprintf('auth:%s:%s', $path, $ip);

        if (!$this->rateLimiter->hit($key, 20, 300)) {
            $this->logger->warn('Rate limit reached', ['path' => $path, 'ip' => $ip]);

            throw new TooManyRequestsException();
        }
    }
}
