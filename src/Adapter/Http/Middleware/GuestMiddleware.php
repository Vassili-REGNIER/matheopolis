<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Middleware;

use Matheopolis\Adapter\Http\Contract\HttpInterface;
use Matheopolis\Application\Port\AuthSessionInterface;

final class GuestMiddleware
{
    public function __construct(
        private readonly AuthSessionInterface $auth,
        private readonly HttpInterface $http,
    ) {}

    public function handle(): void
    {
        if ($this->auth->check()) {
            $this->http->redirect('');
        }
    }
}
