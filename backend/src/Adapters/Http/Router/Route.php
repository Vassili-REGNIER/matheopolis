<?php

declare(strict_types=1);

namespace Matheopolis\Adapters\Http\Router;

final class Route
{
    private string $pattern;

    public function __construct(
        private readonly string $controller,
        private readonly string $method,
        string $uri,
        private readonly string $httpMethods = 'GET',
    ) {
        $this->pattern = $this->compileRoute($uri);
    }

    public function __toString(): string
    {
        return \sprintf('%s->%s() [%s]', $this->controller, $this->method, $this->pattern);
    }

    /**
     * @param array<int, string> $args
     */
    public function isMatched(string $request, array &$args): bool
    {
        $methodRaw = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $requestMethod = strtoupper(\is_string($methodRaw) ? $methodRaw : 'GET');
        $allowedMethods = explode('|', strtoupper($this->httpMethods));
        if (!\in_array($requestMethod, $allowedMethods, true)) {
            $args = [];

            return false;
        }

        $matches = [];
        if (1 === preg_match($this->pattern, $request, $matches)) {
            array_shift($matches);
            $args = array_values($matches);

            return true;
        }

        $args = [];

        return false;
    }

    public function getController(): string
    {
        return $this->controller;
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    private function compileRoute(string $uri): string
    {
        if ('/' === $uri) {
            return '|^/?$|';
        }

        $uri = ltrim($uri, '/');
        $regex = preg_quote($uri, '|');
        $regex = preg_replace('/\\\{[a-zA-Z0-9_]+\\\}/', '([^/]+)', $regex);

        return '|^/?'.$regex.'/?$|';
    }
}
