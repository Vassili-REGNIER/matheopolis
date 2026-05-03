<?php

declare(strict_types=1);

use Matheopolis\Adapters\Http\Router\Route;

return [
    new Route('Home', 'index', '/'),
    new Route('Platform', 'dashboard', '/dashboard'),
    new Route('Auth', 'renderForm', '/auth/{mode}'),
    new Route('Auth', 'login', '/action/login'),
    new Route('Auth', 'register', '/action/register'),
    new Route('Auth', 'join', '/action/join'),
    new Route('Auth', 'logout', '/action/logout'),
    new Route('Platform', 'createTeacherCode', '/action/teacher-codes/create'),
    new Route('Platform', 'createClassroom', '/action/classes/create'),
    new Route('Platform', 'resetStudentPassword', '/action/students/reset-password'),
    new Route('Platform', 'createPuzzle', '/action/puzzles/create'),
    new Route('Platform', 'solvePuzzle', '/action/puzzles/solve'),
];
