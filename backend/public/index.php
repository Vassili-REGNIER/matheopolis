<?php

declare(strict_types=1);

if (PHP_SAPI === 'cli-server') {
    $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
    $uriString = \is_string($requestUri) ? $requestUri : '/';
    $uriRaw = parse_url($uriString, PHP_URL_PATH);
    $uri = \is_string($uriRaw) ? urldecode($uriRaw) : '/';
    if ('/' !== $uri && file_exists(__DIR__.$uri)) {
        return false;
    }
}

const PROJECT_ROOT = __DIR__.'/..';

require_once PROJECT_ROOT.'/bootstrap/autoload.php';

use Matheopolis\Application\Exception\ApiException;
use Matheopolis\Adapter\Http\Middleware\CorsMiddleware;
use Matheopolis\Adapter\Http\Middleware\MaintenanceModeMiddleware;
use Matheopolis\Adapter\Http\Middleware\SecurityHeadersMiddleware;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\LoggerInterface;
use Matheopolis\Application\Port\SessionInterface;
use Matheopolis\Infrastructure\Bootstrap\Container;
use Matheopolis\Infrastructure\Config\ConfigService;

$configService = new ConfigService(PROJECT_ROOT.'/.env');

$debugMode = $configService->getBool('APP_DEBUG');
if ($debugMode) {
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
} else {
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
}
error_reporting(E_ALL);
ini_set('log_errors', '1');

try {
    $container = new Container($configService);
    $dependenciesLoader = require_once PROJECT_ROOT.'/config/dependencies.php';
    if (!\is_callable($dependenciesLoader)) {
        throw new \RuntimeException('config/dependencies.php must return a callable.');
    }
    $dependenciesLoader($container);

    /** @var LoggerInterface $logger */
    $logger = $container->get(LoggerInterface::class);
    $reqUri = $_SERVER['REQUEST_URI'] ?? '';
    $logger->info('Request started', ['url' => \is_string($reqUri) ? $reqUri : '']);

    /** @var SecurityHeadersMiddleware $securityHeaders */
    $securityHeaders = $container->get(SecurityHeadersMiddleware::class);
    $securityHeaders->handle();

    /** @var CorsMiddleware $cors */
    $cors = $container->get(CorsMiddleware::class);
    $cors->handle();

    /** @var MaintenanceModeMiddleware $maintenanceMode */
    $maintenanceMode = $container->get(MaintenanceModeMiddleware::class);
    $maintenanceMode->handle();

    /** @var SessionInterface $session */
    $session = $container->get(SessionInterface::class);
    $session->begin();

    /** @var HttpInterface $http */
    $http = $container->get(HttpInterface::class);
    $request = $http->getRequestedPath();
    $logger->debug('Requested path', ['request' => $request]);

    $routes = require_once PROJECT_ROOT.'/config/routes.php';
    if (!\is_array($routes)) {
        throw new \RuntimeException('config/routes.php must return an array of routes.');
    }

    /** @var array<int, \Matheopolis\Adapters\Http\Router\Route> $routes */
    $args = [];
    $foundRoute = null;
    foreach ($routes as $route) {
        if ($route->isMatched($request, $args)) {
            $foundRoute = $route;
            break;
        }
    }

    if (null === $foundRoute) {
        $http->jsonResponse([
            'success' => false,
            'data' => null,
            'error' => [
                'code' => 'NOT_FOUND',
                'message' => 'Route not found.',
                'details' => [],
            ],
        ], 404);
    }

    $controllerName = 'Matheopolis\Adapter\Http\Controller\\'.$foundRoute->getController().'Controller';
    if (!class_exists($controllerName)) {
        throw new \RuntimeException("Controller class not found: {$controllerName}");
    }

    $worker = $container->get($controllerName);
    $methodName = $foundRoute->getMethod();
    if (!method_exists($worker, $methodName)) {
        throw new \RuntimeException("Method '{$methodName}' not found in ".get_class($worker));
    }

    try {
        \call_user_func_array([$worker, $methodName], $args);
    } catch (ApiException $e) {
        $http->jsonResponse([
            'success' => false,
            'data' => null,
            'error' => [
                'code' => $e->codeName(),
                'message' => $e->getMessage(),
                'details' => $e->details(),
            ],
        ], $e->status());
    }
} catch (\Throwable $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'data' => null,
        'error' => [
            'code' => 'INTERNAL_ERROR',
            'message' => $configService->getBool('APP_DEBUG') ? $e->getMessage() : 'Internal server error.',
            'details' => [],
        ],
    ]);
}
