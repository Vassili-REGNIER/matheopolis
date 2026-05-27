<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Middleware;

use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\HttpInterface;

final class AuthMiddleware
{
    public function __construct(
        private readonly AuthSessionInterface $auth,
        private readonly HttpInterface $http,
    ) {}

    public function handle(): void
    {
        if (!$this->auth->check()) {
            $this->http->redirect('auth/login');
        }
    }
}
