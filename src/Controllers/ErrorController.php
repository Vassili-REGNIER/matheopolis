<?php
declare(strict_types=1);

namespace Src\Controllers;

use Core\Controller;
use Core\Exception\Http\HttpException;
use Core\Interfaces\AuthSessionInterface;
use Src\Views\ErrorView;

/**
 * ErrorController
 * Handles the display of error pages (4xx and 5xx).
 * Does not depend on the Container/Service layer to ensure reliability during crashes.
 */
class ErrorController extends Controller
{
    public function __construct(ErrorView $errorView)
    {
        $this->view = $errorView;
    }

    /**
     * Primary entry point for handled HTTP errors (4xx).
     */
    public function renderHttpError(HttpException $e): void
    {
        $code = $e->getStatusCode();
        $this->renderError($code);
    }

    /**
     * Error 500: Internal Server Error
     */
    public function serverError(): void
    {
        $this->renderError(500);
    }

    /**
     * Internal helper to handle errors.
     * @param int $code HTTP Status Code
     */
    private function renderError(int $code): void
    {
        // Sets the type in the view
        $this->view->setType($code);
        // Sets the actual HTTP header
        http_response_code($code);
        // Displays the page
        $this->view->render();
    }
}