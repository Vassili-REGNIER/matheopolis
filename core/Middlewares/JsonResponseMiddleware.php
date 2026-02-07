<?php
declare(strict_types=1);

namespace Core\Middlewares;

use Core\Controller;
use Core\Services\HttpService;

/**
 * Middleware responsible for sending the JSON response.
 * It handles headers, status codes, and payload encoding.
 */
final class JsonResponseMiddleware {

    /**
     * The controller instance to get data from.
     * @var Controller
     */
    private Controller $controller;

    private HttpService $httpService;

    public function __construct(Controller $controller, HttpService $httpService) {
        $this->controller = $controller;
        $this->httpService = $httpService;
    }

    /**
     * Finalizes the response: sets headers, status code, and outputs JSON.
     */
    public function handle(): never
    {
        $this->httpService->jsonResponse($this->controller->getPayload());
    }
}