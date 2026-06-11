<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Functional;

use Matheopolis\Adapter\Http\Router\Route;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 *
 * @coversNothing
 */
final class RouteMatchingTest extends TestCase
{
    /**
     * Verifies the expected behavior.
     */
    public function testSimpleRouteMatchesWithNoArguments(): void
    {
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $route = new Route('ApiSystem', 'health', '/api/health');
        $args = [];

        self::assertTrue($route->isMatched('/api/health', $args));
        self::assertSame([], $args);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testParameterizedRouteExtractsArguments(): void
    {
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $route = new Route('ApiUsers', 'profile', '/api/users/{id}');
        $args = [];

        self::assertTrue($route->isMatched('/api/users/42', $args));
        self::assertSame(['42'], $args);
    }

    /**
     * Verifies the expected behavior.
     */
    public function testRouteRespectsHttpMethod(): void
    {
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $route = new Route('ApiAuth', 'login', '/api/auth/login', 'POST');
        $args = [];

        self::assertFalse($route->isMatched('/api/auth/login', $args));
    }
}
