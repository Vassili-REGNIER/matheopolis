<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Middleware;

use Matheopolis\Adapter\Http\Contract\HttpInterface;
use Matheopolis\Adapter\Http\Controller\AbstractController;

/**
 * Sends JSON from the controller payload (after action).
 */
final class JsonResponseMiddleware
{
    public function __construct(
        private readonly AbstractController $controller,
        private readonly HttpInterface $http,
    ) {}

    public function handle(): never
    {
        $this->http->jsonResponse($this->controller->getPayload());
    }
}
