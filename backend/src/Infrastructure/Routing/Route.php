<?php

declare(strict_types=1);

namespace Matheopolis\Infrastructure\Routing;

/**
 * Maps a URL pattern to a controller name and action method.
 */
final class Route
{
    private string $pattern;

    public function __construct(
        private readonly string $controller,
        private readonly string $method,
        string $uri,
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

    public function getPattern(): string
    {
        return $this->pattern;
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
