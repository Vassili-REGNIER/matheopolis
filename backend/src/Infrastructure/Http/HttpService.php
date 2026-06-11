<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Http;

use Matheopolis\Application\Port\ConfigInterface;
use Matheopolis\Application\Port\HttpInterface;

/**
 * HTTP helpers: redirects, query path, links, JSON responses.
 */
final class HttpService implements HttpInterface
{
    /**
     * Creates a new HttpService instance.
     */
    public function __construct(
        private readonly ConfigInterface $config,
    ) {}

    /**
     * Generate link.
     */
    public function generateLink(string $path): string
    {
        return $this->config->getString('APP_PATH').$path;
    }

    /**
     * Redirect.
     */
    public function redirect(string $path): never
    {
        $obLen = ob_get_length();
        if (false !== $obLen && $obLen > 0) {
            ob_clean();
        }

        $url = $this->generateLink($path);
        header('Location: '.$url);

        exit;
    }

    /**
     * Post.
     */
    public function post(string $key, mixed $default = null): mixed
    {
        $value = $_POST[$key] ?? $default;
        if (\is_string($value)) {
            return trim($value);
        }

        return $value;
    }

    /**
     * Returns the .
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $value = $_GET[$key] ?? $default;
        if (\is_string($value)) {
            return trim($value);
        }

        return $value;
    }

    /**
     * Checks whether the method allowed condition is met.
     */
    public function isMethodAllowed(string $allowedMethods = 'GET'): bool
    {
        $allowed = explode('|', strtoupper($allowedMethods));

        return \in_array($this->getRequestMethod(), $allowed, true);
    }

    /**
     * Checks whether the https condition is met.
     */
    public function isHttps(): bool
    {
        $https = $_SERVER['HTTPS'] ?? '';
        if (\is_string($https) && '' !== $https && 'off' !== strtolower($https)) {
            return true;
        }

        $port = $_SERVER['SERVER_PORT'] ?? null;
        if (\is_string($port) || \is_int($port)) {
            return 443 === (int) $port;
        }

        return false;
    }

    /**
     * Returns the requested path.
     */
    public function getRequestedPath(): string
    {
        $requestRaw = $_SERVER['REQUEST_URI'] ?? '/';
        $request = \is_string($requestRaw) ? $requestRaw : '/';
        if (($pos = strpos($request, '?')) !== false) {
            $request = substr($request, 0, $pos);
        }

        $base = $this->config->getString('APP_PATH');
        $baseLength = \strlen($base);
        if ($baseLength > 0 && str_starts_with($request, $base)) {
            $request = substr($request, $baseLength);
        }

        return $request;
    }

    /**
     * @param array<string, mixed> $data
     */
    public function jsonResponse(array $data, int $status = 200): never
    {
        if (ob_get_level() > 0) {
            ob_clean();
        }
        if (!headers_sent()) {
            header('Content-Type: application/json');
            http_response_code($status);
        }
        echo json_encode($data);

        exit;
    }

    /**
     * File response.
     */
    public function fileResponse(string $content, string $contentType, string $filename, int $status = 200): never
    {
        if (ob_get_level() > 0) {
            ob_clean();
        }
        if (!headers_sent()) {
            header('Content-Type: '.$contentType);
            header('Content-Disposition: attachment; filename="'.$filename.'"');
            http_response_code($status);
        }
        echo $content;

        exit;
    }

    /**
     * Returns the request method.
     */
    private function getRequestMethod(): string
    {
        $m = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        return strtoupper(\is_string($m) ? $m : 'GET');
    }
}
