<?php
declare(strict_types=1);

namespace Core\Middlewares;

use Core\Exception\Http\Client\CsrfException;
use Core\Interfaces\HttpInterface;
use Core\Interfaces\LoggerInterface;
use Core\Interfaces\SessionInterface;

/**
 * Middleware for Cross-Site Request Forgery (CSRF) protection.
 * Handles token generation and verification.
 */
final class CsrfMiddleware
{
    private SessionInterface $session;
    private HttpInterface $http;
    private LoggerInterface $logger;

    public function __construct(
        SessionInterface $session,
        HttpInterface $http,
        LoggerInterface $logger
    ) {
        $this->session = $session;
        $this->http = $http;
        $this->logger = $logger;
    }

    /**
     * Main middleware handler.
     * 1. Generates a token if it doesn't exist.
     * 2. Verifies the token on POST/PUT/DELETE/PATCH requests.
     * @throws CsrfException
     */
    public function handle(): void
    {
        // Generate a token if none exists
        $this->session->ensureCsrfToken();

        // Verify token on state-changing methods
        if ($this->http->isMethodAllowed('POST|PUT|DELETE|PATCH')) {
            $requestedToken = $this->http->post('csrf_token');
            if (!$this->session->verifyCsrfToken($requestedToken)) {
                $this->logger->warn("CSRF Mismatch from IP" .  $_SERVER['REMOTE_ADDR']);

                // Throw Csrf error
                throw new CsrfException();
            }
        }
    }
}