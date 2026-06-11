<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\SessionInterface;

/**
 * Base HTTP controller with middleware hooks and optional JSON payload.
 */
abstract class AbstractController
{
    protected mixed $view = null;

    /** @var array<string, mixed> */
    protected array $payload = [];

    /** @var array<int, object> */
    protected array $middlewaresBefore = [];

    /** @var array<int, object> */
    protected array $middlewaresAfter = [];

    /**
     * Execute before middlewares.
     */
    public function executeBeforeMiddlewares(): void
    {
        foreach ($this->middlewaresBefore as $middleware) {
            if (method_exists($middleware, 'handle')) {
                $middleware->handle();
            }
        }
    }

    /**
     * Execute after middlewares.
     */
    public function executeAfterMiddlewares(): void
    {
        foreach ($this->middlewaresAfter as $middleware) {
            if (method_exists($middleware, 'handle')) {
                $middleware->handle();
            }
        }
    }

    /**
     * @param array<string, mixed> $data
     */
    public function setPayload(array $data): void
    {
        $this->payload = $data;
    }

    /**
     * @return array<string, mixed>
     */
    public function getPayload(): array
    {
        return $this->payload;
    }

    /**
     * Registers the requested user account.
     */
    protected function registerBeforeMiddleware(object $middleware): void
    {
        $this->middlewaresBefore[] = $middleware;
    }

    /**
     * Registers the requested user account.
     */
    protected function registerAfterMiddleware(object $middleware): void
    {
        $this->middlewaresAfter[] = $middleware;
    }

    /**
     * @param array<string, string> $errors
     */
    protected function redirectWithErrors(HttpInterface $http, SessionInterface $session, string $path, array $errors): void
    {
        foreach ($errors as $error) {
            $session->setFlash(SessionInterface::FLASH_ERROR, $error);
        }
        $http->redirect($path);
    }
}
