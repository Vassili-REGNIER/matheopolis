<?php
declare(strict_types=1);

use Core\Route;

return [
    // --- Home ---
    new Route('Home', 'index',  '/'),

    // --- Auth ---
    new Route('Auth', 'renderForm', '/auth/{mode}'),

    new Route('Auth', 'login',    '/action/login'),
    new Route('Auth', 'register', '/action/register'),
    new Route('Auth', 'join',     '/action/join'),

    new Route('Auth', 'logout',     '/action/logout'),

    // --- API ---
    # new Route('TaskApi', 'index', '/api/tasks'),
];