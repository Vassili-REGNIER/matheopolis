<?php

declare(strict_types=1);

namespace Matheopolis\Tests\Functional;

use Matheopolis\Adapters\Http\Router\Route;
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
        $route = new Route('Auth', 'renderForm', '/auth/{mode}');
        $args = [];

        self::assertTrue($route->isMatched('/auth/login', $args));
        self::assertSame(['login'], $args);
    }
}
