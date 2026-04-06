<?php

declare(strict_types=1);

use Matheopolis\Infrastructure\Routing\Route;

return [
    new Route('Home', 'index', '/'),
    new Route('Auth', 'renderForm', '/auth/{mode}'),
    new Route('Auth', 'login', '/action/login'),
    new Route('Auth', 'register', '/action/register'),
    new Route('Auth', 'join', '/action/join'),
    new Route('Auth', 'logout', '/action/logout'),
];
