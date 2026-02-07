<?php
declare(strict_types=1);

// Ce bloc ne s'exécute QUE si tu utilises le serveur interne (Local)
if (php_sapi_name() === 'cli-server') {
    $uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
    if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
        return false;
    }
}

const PROJECT_ROOT = __DIR__ . '/..';
require_once PROJECT_ROOT . '/vendor/autoload.php';

use Core\Container;
use Core\Exception\Http\Client\NotFoundException;
use Core\Exception\Http\HttpException;
use Core\Interfaces\HttpInterface;
use Core\Interfaces\LoggerInterface;
use Core\Interfaces\SessionInterface;
use Core\Services\ConfigService;
use Src\Controllers\ErrorController;

$configService = new ConfigService(PROJECT_ROOT . '/.env');


// Debug mode configuration
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
    // Init container
    $container = new Container($configService);
    $dependenciesLoader = require_once PROJECT_ROOT . '/config/dependencies.php';
    $dependenciesLoader($container);

    try {

        // Info log
        $logger = $container->get(LoggerInterface::class);
        $logger->info("Request started", ['url' => $_SERVER['REQUEST_URI']]);

        // Start session
        $session = $container->get(SessionInterface::class);
        $session->begin();

        // Request processing
        $http = $container->get(HttpInterface::class);
        $request = $http->getRequestedPath();
        $logger->debug("Requested path", ["request" => $request]);

        // Route detection
        $routes = require_once PROJECT_ROOT . '/config/routes.php';
        $args = $foundRoute = null;
        foreach ($routes as $route) {
            if ($route->isMatched($request, $args)) {
                $foundRoute = $route;
                $logger->debug("FoundRoute", ["foundRoute" => (string)$foundRoute]);
                break;
            }
        }

        if (!$foundRoute) {
            throw new NotFoundException();
        }

        // Controller class instantiation
        $controllerName = "Src\\Controllers\\" . $foundRoute->getController() . 'Controller';
        $worker = $container->get($controllerName);

        // Execute "before" middlewares
        if (method_exists($worker, 'executeBeforeMiddlewares')) {
            $worker->executeBeforeMiddlewares();
        }

        // Check if method exists in controller
        $methodName = $foundRoute->getMethod();
        if (!method_exists($worker, $methodName)) {
            throw new Exception("Method '$methodName' not found in " . get_class($worker));
        }

        // Execute controller action
        $arguments = is_array($args) ? $args : [];
        $worker->$methodName(...$arguments);

        // Execute "after" middlewares
        if (method_exists($worker, 'executeAfterMiddlewares')) {
            $worker->executeAfterMiddlewares();
        }

    } catch (HttpException $e) {
        // Handles known user errors
        $logger = $container->get(LoggerInterface::class);
        $logger->warn('HTTP Error: ' . $e->getMessage(), ["exception" => $e]);

        $container->get(ErrorController::class)->renderHttpError($e);

    } catch (Throwable $e) {
        // Handle internal errors
        $logger = $container->get(LoggerInterface::class);
        $logger->error('Critical uncaught error: ' . $e->getMessage(), [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]);

        // Displays the raw error in debug mode
        if ($configService->getBool('APP_DEBUG')) {
            echo "<pre>" . $e . "</pre>";
            exit;
        }

        // Displays an error page in production
        $container->get(ErrorController::class)->serverError();
    }
} catch (Throwable $e) {
    // Container broken. Last resort: display a plain text message.
    http_response_code(500);
    echo "<pre>" . $e . "</pre>";
    echo "<h1>Erreur Serveur</h1>";
    echo "<p>Une erreur interne est survenue et la page d'erreur n'a pas pu être chargée.</p>";
}