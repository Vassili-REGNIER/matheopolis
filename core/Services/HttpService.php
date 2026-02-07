<?php
declare(strict_types=1);

namespace Core\Services;

use Core\Interfaces\ConfigInterface;
use Core\Interfaces\HttpInterface;

/**
 * Helper class for handling HTTP protocol related operations and redirects.
 */
final class HttpService implements HttpInterface
{
    private ConfigInterface $config;

    public function __construct(ConfigInterface $config) {
        $this->config = $config;
    }

    /**
     * Generates an absolute URL based on the application base path.
     * * @param string $path The relative path (e.g., '/login').
     * @return string The full absolute URL.
     */
    public function generateLink(string $path): string {
        return $this->config->getString("APP_PATH") . $path;
    }

    /**
     * Redirects to a page within the application.
     * * @param string $path Relative path (e.g., 'login', 'dashboard').
     */
    final public function redirect(string $path): never
    {
        if (ob_get_length()) {
            ob_clean();
        }

        $url = $this->generateLink($path);
        
        header('Location: ' . $url);
        exit;
    }

    /**
     * Retrieves a value from the $_POST array
     */
    public function post(string $key, $default = null): mixed
    {
        $value = $_POST[$key] ?? $default;
        
        if (is_string($value)) {
            return trim($value);
        }
        return $value;
    }

    /**
     * Retrieves a value from the $_GET array
     */
    public function get(string $key, $default = null): mixed
    {
        $value = $_GET[$key] ?? $default;
        if (is_string($value)) {
            return trim($value);
        }
        return $value;
    }

    /**
     * Private helper to get method safely
     */
    private function getRequestMethod(): string {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    /**
     * Checks if the current HTTP method is allowed.
     * Returns TRUE if allowed, FALSE otherwise.
     * * @param string $allowedMethods Accepted formats: 'GET', 'GET|HEAD', 'GET|POST'...
     * @return bool
     */
    public final function isMethodAllowed(string $allowedMethods = 'GET'): bool {
        $allowedMethods = explode('|', strtoupper($allowedMethods));
        $currentMethod = $this->getRequestMethod();

        return in_array($currentMethod, $allowedMethods);
    }

    /**
     * Detects if the request is using HTTPS.
     * @return bool
     */
    public final function isHttps(): bool {
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
            return true;
        }
        if (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443) {
            return true;
        }
        return false;
    }

    /**
     * Normalizes and returns the requested URI path.
     * @return string
     */
    final public function getRequestedPath(): string {
        $request = $_SERVER['REQUEST_URI'] ?? '/';

        if (($pos = strpos($request, '?')) !== false) {
            $request = substr($request, 0, $pos);
        }

        $basePathLength = strlen($this->config->getString('APP_PATH'));

        if ($basePathLength > 0 && substr($request, 0, $basePathLength) === $this->config->getString('APP_PATH')) {
            $request = substr($request, $basePathLength);
        }

        return $request;
    }

    /**
     * Sends a JSON response
     * @param array $data
     * @param int $status
     * @return never
     */
    public function jsonResponse(array $data, int $status = 200): never {
        ob_clean();
        header('Content-Type: application/json');
        http_response_code($status);
        echo json_encode($data);
        exit;
    }
}