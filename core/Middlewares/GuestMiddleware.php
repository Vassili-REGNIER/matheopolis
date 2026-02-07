<?php
declare(strict_types=1);

namespace Core\Middlewares;

use Core\Interfaces\AuthSessionInterface;
use Core\Services\HttpService;

/**
 * Middleware: Enforce Guest Status.
 * Restricts access to users who are NOT logged in.
 */
final class GuestMiddleware {

    private AuthSessionInterface $auth;
    private HttpService $http;

    public function __construct(AuthSessionInterface $auth, HttpService $http) {
        $this->auth = $auth;
        $this->http = $http;
    }
    public function handle(): void
    {
        // If user is ALREADY logged in, redirect them away from the login page.
        if ($this->auth->check()) {
            $this->http->redirect('');
        }
    }
}