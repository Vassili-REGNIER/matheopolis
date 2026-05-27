<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Functional;

use Matheopolis\Adapter\Http\Router\Route;
use PHPUnit\Framework\TestCase;

final class RouteMatchingTest extends TestCase
{
    public function testSimpleRouteMatchesWithNoArguments(): void
    {
        $route = new Route('Home', 'index', '/');
        $args = [];

        self::assertTrue($route->isMatched('/', $args));
        self::assertSame([], $args);
    }

    public function testParameterizedRouteExtractsArguments(): void
    {
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $route = new Route('ApiUsers', 'profile', '/api/users/{id}');
        $args = [];

        self::assertTrue($route->isMatched('/api/users/42', $args));
        self::assertSame(['42'], $args);
    }

    public function testRouteRespectsHttpMethod(): void
    {
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $route = new Route('ApiAuth', 'login', '/api/auth/login', 'POST');
        $args = [];

        self::assertFalse($route->isMatched('/api/auth/login', $args));
    }
}
