<?php
declare(strict_types=1);

namespace Core\Middlewares;

use Core\Interfaces\AuthSessionInterface;
use Core\Interfaces\HttpInterface;

/**
 * Middleware to handle user authentication checks.
 */
final class AuthMiddleware {

    private AuthSessionInterface $auth;
    private HttpInterface $http;

    public function __construct(
        AuthSessionInterface $auth,
        HttpInterface $http,
    ) {
        $this->auth = $auth;
        $this->http = $http;
    }

    /**
     * Handle the incoming request.
     * * @return void
     */
    public function handle(): void
    {
        if (!$this->auth->check()) {
            $this->http->redirect('auth/login');
        }
    }
}