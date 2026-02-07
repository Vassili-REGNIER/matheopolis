<?php
declare(strict_types=1);

namespace Core;

use Core\Helpers\Flash;
use Core\Services\HttpService;

/**
 * Abstract controller class. Every controller should extend this class.
 */
abstract class Controller {

    /**
     * The view object to render.
     */
    protected $view = null;

    /**
     * Data payload for JSON responses or generic transfer.
     * @var array
     */
    protected array $payload = [];

	/** @var array Middlewares to execute BEFORE the action */
    protected $middlewaresBefore = [];

    /** @var array Middlewares to execute AFTER the action */
    protected $middlewaresAfter = [];

    /**
     * Register a middleware meant to run before the action.
     * @param object $middleware
     */
    protected function registerBeforeMiddleware($middleware) {
        $this->middlewaresBefore[] = $middleware;
    }

    /**
     * Register a middleware meant to run after the action.
     * @param object $middleware
     */
    protected function registerAfterMiddleware($middleware) {
        $this->middlewaresAfter[] = $middleware;
    }

    /**
     * Execute "Before" middlewares.
     */
    public function executeBeforeMiddlewares() {
        foreach ($this->middlewaresBefore as $middleware) {
            if (method_exists($middleware, 'handle')) {
                $middleware->handle();
            }
        }
    }

    /**
     * Execute "After" middlewares.
     */
    public function executeAfterMiddlewares() {
        foreach ($this->middlewaresAfter as $middleware) {
            if (method_exists($middleware, 'handle')) {
                $middleware->handle();
            }
        }
    }

    /**
     * Sets the data payload for the response
     * @param array $data
     */
    public function setPayload(array $data): void {
        $this->payload = $data;
    }

    /**
     * Retrieves the current payload
     * @return array
     */
    public function getPayload(): array {
        return $this->payload;
    }

    /**
     * Helper to redirect with validation errors (Flash).
     * * @param string $url The redirect URL
     * @param array $errors The error array
     */
    protected function redirectWithErrors(string $url, array $errors): void
    {
        foreach ($errors as $error) {
            Flash::set(Flash::ERROR, $error);
        }
        HttpService::redirect($url);
    }
}
