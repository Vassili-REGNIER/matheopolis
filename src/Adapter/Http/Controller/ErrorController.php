<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Adapter\Http\Exception\HttpException;
use Matheopolis\Adapter\Http\View\ErrorView;

/**
 * Renders error pages (4xx / 5xx). Kept minimal so it still works when the container fails partially.
 */
final class ErrorController extends AbstractController
{
    public function __construct(
        private readonly ErrorView $errorView,
    ) {
        $this->view = $errorView;
    }

    public function renderHttpError(HttpException $e): void
    {
        $this->renderError($e->getStatusCode());
    }

    public function serverError(): void
    {
        $this->renderError(500);
    }

    private function renderError(int $code): void
    {
        $this->errorView->setType($code);
        http_response_code($code);
        $this->errorView->render();
    }
}
