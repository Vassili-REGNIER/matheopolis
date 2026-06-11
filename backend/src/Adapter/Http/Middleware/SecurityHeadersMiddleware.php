<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Middleware;

/**
 * Applies security headers concerns to incoming HTTP requests.
 */
final class SecurityHeadersMiddleware
{
    /**
     * Handle.
     */
    public function handle(): void
    {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Permissions-Policy: geolocation=(), camera=(), microphone=()');
        header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-ancestors 'self'");
    }
}
