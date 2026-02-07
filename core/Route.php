<?php
declare(strict_types=1);

namespace Core;

/**
 * Class Route
 *
 * Represents a route definition within the application.
 * It maps a URL pattern to a specific controller and method.
 */
final class Route
{
    /**
     * The name of the controller class (e.g., "Task").
     * @var string
     */
    private string $controller;

    /**
     * The name of the method to call within the controller (e.g., "update").
     * @var string
     */
    private string $method;

    /**
     * The compiled regular expression pattern derived from the URI.
     * @var string
     */
    private string $pattern;

    /**
     * Route constructor.
     *
     * @param string $controller The name of the controller.
     * @param string $method     The method to execute.
     * @param string $uri        The URI path (e.g., "/tasks/{id}" or "*").
     */
    public function __construct(string $controller, string $method, string $uri)
    {
        $this->controller = $controller;
        $this->method = $method;
        $this->pattern = $this->compileRoute($uri);
    }

    /**
     * Converts a modern URI string into a PCRE regular expression.
     *
     * Examples:
     * - "/tasks/edit/{id}" => "|^/?tasks/edit/([^/]+)/?$|"
     * - "*"                => "|^/?.*$|"
     *
     * @param string $uri The readable URI path.
     * @return string The compiled regex pattern.
     */
    private function compileRoute(string $uri): string 
    {
        // Special case: Root path
        if ($uri === '/') {
            return '|^/?$|';
        }

		// Normal cases : 
        // 1. Remove leading slash to normalize
        $uri = ltrim($uri, '/');

        // 2. Escape special regex characters (delimiter will be '|')
        $regex = preg_quote($uri, '|');

        // 3. Replace dynamic parameters {name} with a capture group ([^/]+)
        // Note: preg_quote escapes '{' as '\{', so we target that.
        $regex = preg_replace('/\\\{[a-zA-Z0-9_]+\\\}/', '([^/]+)', $regex);

        // 4. Build final regex: Start anchor (^), Pattern, Optional trailing slash, End anchor ($)
        return '|^/?' . $regex . '/?$|';
    }

    /**
     * Checks if the current request URI matches this route.
     *
     * @param string $request The requested URI path.
     * @param array|null $args Reference to an array that will be populated with captured parameters.
     * @return bool True if the route matches, false otherwise.
     */
    public function isMatched(string $request, ?array &$args = null): bool
    {
        $matches = [];
        
        // Use a strict check. If 1, it matches. If 0 or false, it does not.
        if (preg_match($this->pattern, $request, $matches) === 1) {
            // Remove the full string match (index 0) to keep only captures
            array_shift($matches);
            
            // Assign to the referenced variable only on success
            $args = array_values($matches);
            return true;
        }

        // Reset args to ensure no garbage data remains if reused
        $args = [];
        return false;
    }

    /**
     * Gets the controller name.
     *
     * @return string
     */
    public function getController(): string 
    { 
        return $this->controller; 
    }

    /**
     * Gets the method name.
     *
     * @return string
     */
    public function getMethod(): string 
    { 
        return $this->method; 
    }

    /**
     * Gets the compiled regex pattern (useful for debugging).
     *
     * @return string
     */
    public function getPattern(): string 
    { 
        return $this->pattern; 
    }

    /**
     * Returns a string representation of the route.
     *
     * @return string
     */
    public function __toString(): string
    {
        return sprintf('%s->%s() [%s]', $this->controller, $this->method, $this->pattern);
    }
}