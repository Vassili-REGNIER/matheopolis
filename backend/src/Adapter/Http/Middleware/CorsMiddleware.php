<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Middleware;

use Matheopolis\Application\Port\ConfigInterface;

final class CorsMiddleware
{
    public function __construct(
        private readonly ConfigInterface $config,
    ) {}

    public function handle(): void
    {
        $allowedOrigin = $this->config->getString('APP_FRONTEND_ORIGIN');
        if ('' === $allowedOrigin) {
            return;
        }

        $originRaw = $_SERVER['HTTP_ORIGIN'] ?? '';
        $origin = \is_string($originRaw) ? $originRaw : '';

        if ($origin !== $allowedOrigin) {
            return;
        }

        header('Vary: Origin');
        header('Access-Control-Allow-Origin: '.$allowedOrigin);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, Authorization');

        $methodRaw = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $method = strtoupper(\is_string($methodRaw) ? $methodRaw : 'GET');
        if ('OPTIONS' === $method) {
            http_response_code(204);

            exit;
        }
    }
}
