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

use Matheopolis\Adapter\Http\Controller\ErrorController;
use Matheopolis\Adapter\Http\Exception\Client\NotFoundException;
use Matheopolis\Adapter\Http\Exception\HttpException;
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

    try {
        /** @var \Matheopolis\Application\Port\LoggerInterface $logger */
        $logger = $container->get(LoggerInterface::class);
        $reqUri = $_SERVER['REQUEST_URI'] ?? '';
        $logger->info('Request started', ['url' => \is_string($reqUri) ? $reqUri : '']);

        /** @var SecurityHeadersMiddleware $securityHeaders */
        $securityHeaders = $container->get(SecurityHeadersMiddleware::class);
        $securityHeaders->handle();

        /** @var MaintenanceModeMiddleware $maintenanceMode */
        $maintenanceMode = $container->get(MaintenanceModeMiddleware::class);
        $maintenanceMode->handle();

        /** @var \Matheopolis\Application\Port\SessionInterface $session */
        $session = $container->get(SessionInterface::class);
        $session->begin();

        /** @var \Matheopolis\Application\Port\HttpInterface $http */
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
                $logger->debug('FoundRoute', ['foundRoute' => (string) $route]);

                break;
            }
        }

        if (null === $foundRoute) {
            throw new NotFoundException();
        }

        $controllerBase = $foundRoute->getController();
        $controllerName = 'Matheopolis\Adapter\Http\Controller\\'.$controllerBase.'Controller';
        if (!class_exists($controllerName)) {
            throw new \RuntimeException("Controller class not found: {$controllerName}");
        }
        $worker = $container->get($controllerName);

        if (method_exists($worker, 'executeBeforeMiddlewares')) {
            $worker->executeBeforeMiddlewares();
        }

        $methodName = $foundRoute->getMethod();
        if (!method_exists($worker, $methodName)) {
            throw new \RuntimeException("Method '{$methodName}' not found in ".get_class($worker));
        }

        $arguments = $args;

        /** @var callable $callback */
        $callback = [$worker, $methodName];
        \call_user_func_array($callback, $arguments);

        if (method_exists($worker, 'executeAfterMiddlewares')) {
            $worker->executeAfterMiddlewares();
        }
    } catch (HttpException $e) {
        /** @var \Matheopolis\Application\Port\LoggerInterface $logger */
        $logger = $container->get(LoggerInterface::class);
        $logger->warn('HTTP Error: '.$e->getMessage(), ['exception' => $e]);

        /** @var \Matheopolis\Adapter\Http\Controller\ErrorController $errorController */
        $errorController = $container->get(ErrorController::class);
        $errorController->renderHttpError($e);
    } catch (\Throwable $e) {
        /** @var \Matheopolis\Application\Port\LoggerInterface $logger */
        $logger = $container->get(LoggerInterface::class);
        $logger->error('Critical uncaught error: '.$e->getMessage(), [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ]);

        if ($configService->getBool('APP_DEBUG')) {
            echo '<pre>'.$e.'</pre>';

            exit;
        }

        /** @var \Matheopolis\Adapter\Http\Controller\ErrorController $errorController */
        $errorController = $container->get(ErrorController::class);
        $errorController->serverError();
    }
} catch (\Throwable $e) {
    http_response_code(500);
    if ($configService->getBool('APP_DEBUG')) {
        echo '<pre>'.$e.'</pre>';
    }
    echo '<h1>Server error</h1>';
    echo '<p>An internal error occurred and the error page could not be loaded.</p>';
}
