<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Middleware;

use Matheopolis\Adapter\Http\Exception\Client\CsrfException;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\LoggerInterface;
use Matheopolis\Application\Port\SessionInterface;

final class CsrfMiddleware
{
    public function __construct(
        private readonly SessionInterface $session,
        private readonly HttpInterface $http,
        private readonly LoggerInterface $logger,
    ) {}

    public function handle(): void
    {
        $this->session->ensureCsrfToken();

        if ($this->http->isMethodAllowed('POST|PUT|DELETE|PATCH')) {
            $requestedToken = $this->http->post('csrf_token');
            if (!$this->session->verifyCsrfToken(\is_string($requestedToken) ? $requestedToken : null)) {
                $remote = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
                $this->logger->warn('CSRF mismatch from IP '.(\is_string($remote) ? $remote : 'unknown'));

                throw new CsrfException();
            }
        }
    }
}
