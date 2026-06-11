<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\SessionInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Domain\User;

/**
 * Handles HTTP requests for API base endpoints.
 */
abstract class ApiBaseController extends AbstractController
{
    /**
     * Creates a new ApiBaseController instance.
     */
    public function __construct(
        protected readonly HttpInterface $http,
        protected readonly AuthSessionInterface $auth,
        protected readonly SessionInterface $session,
        protected readonly UserRepositoryInterface $users,
    ) {}

    /**
     * @return array<string, mixed>
     */
    protected function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if (!\is_string($raw) || '' === trim($raw)) {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (!\is_array($decoded)) {
            throw new ApiException(400, 'INVALID_JSON', 'Invalid JSON payload.');
        }

        $clean = [];
        foreach ($decoded as $key => $value) {
            if (\is_string($key)) {
                $clean[$key] = $value;
            }
        }

        return $clean;
    }

    /**
     * @param array<string, mixed> $data
     */
    protected function success(array $data, int $status = 200): never
    {
        $this->http->jsonResponse([
            'success' => true,
            'data' => $data,
            'error' => null,
        ], $status);
    }

    /**
     * @param array<string, mixed> $details
     */
    protected function fail(int $status, string $code, string $message, array $details = []): never
    {
        $this->http->jsonResponse([
            'success' => false,
            'data' => null,
            'error' => [
                'code' => $code,
                'message' => $message,
                'details' => $details,
            ],
        ], $status);
    }

    /**
     * Ensures that the current request satisfies the required condition.
     */
    protected function ensureMethod(string $allowedMethods): void
    {
        if (!$this->http->isMethodAllowed($allowedMethods)) {
            throw new ApiException(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
        }
    }

    /**
     * Current user.
     */
    protected function currentUser(): User
    {
        $user = $this->optionalUser();
        if (null === $user) {
            throw new ApiException(401, 'AUTH_REQUIRED', 'Authentication required.');
        }

        return $user;
    }

    /**
     * Optional user.
     */
    protected function optionalUser(): ?User
    {
        $userId = $this->auth->id();
        if (null === $userId) {
            return null;
        }

        return $this->users->find($userId);
    }

    /**
     * Ensures that the current request satisfies the required condition.
     */
    protected function ensureRole(User $user, string ...$roles): void
    {
        if (\in_array($user->getRole(), $roles, true)) {
            return;
        }

        throw new ApiException(403, 'ACCESS_DENIED', 'Access denied.');
    }

    /**
     * Ensures that the current request satisfies the required condition.
     */
    protected function ensureCsrfForMutation(): void
    {
        if (!$this->http->isMethodAllowed('POST|PUT|PATCH|DELETE')) {
            return;
        }

        $headerTokenRaw = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
        $headerToken = \is_string($headerTokenRaw) ? trim($headerTokenRaw) : null;
        if (!$this->session->verifyCsrfToken($headerToken)) {
            throw new ApiException(403, 'INVALID_CSRF', 'Invalid CSRF token.');
        }
    }
}
