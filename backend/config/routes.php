<?php

declare(strict_types=1);

use Matheopolis\Adapter\Http\Router\Route;

return [
    new Route('ApiSystem', 'health', '/api/health', 'GET'),

    new Route('ApiAuth', 'login', '/api/auth/login', 'POST'),
    new Route('ApiAuth', 'logout', '/api/auth/logout', 'POST'),
    new Route('ApiAuth', 'me', '/api/auth/me', 'GET'),

    new Route('ApiUsers', 'createTeacher', '/api/users/teachers', 'POST'),
    new Route('ApiUsers', 'createStudent', '/api/users/students', 'POST'),
    new Route('ApiUsers', 'profile', '/api/users/{id}', 'GET'),

    new Route('ApiTeacherCodes', 'create', '/api/teacher-codes', 'POST'),
    new Route('ApiTeacherCodes', 'list', '/api/teacher-codes', 'GET'),
    new Route('ApiTeacherCodes', 'disable', '/api/teacher-codes/{id}', 'DELETE'),

    new Route('ApiClasses', 'create', '/api/classes', 'POST'),
    new Route('ApiClasses', 'details', '/api/classes/{id}', 'GET'),
    new Route('ApiClasses', 'update', '/api/classes/{id}', 'PATCH'),
    new Route('ApiClasses', 'remove', '/api/classes/{id}', 'DELETE'),
    new Route('ApiClasses', 'students', '/api/classes/{id}/students', 'GET'),
    new Route('ApiClasses', 'studentsProgress', '/api/classes/{id}/students/progress', 'GET'),

    new Route('ApiRiddles', 'list', '/api/puzzles', 'GET'),
    new Route('ApiRiddles', 'start', '/api/riddles/{riddleId}/start', 'POST'),
    new Route('ApiRiddles', 'progress', '/api/riddles/{riddleId}/progress', 'GET'),
    new Route('ApiRiddles', 'attempt', '/api/riddles/{riddleId}/attempt', 'POST'),
    new Route('ApiRiddles', 'complete', '/api/riddles/{riddleId}/complete', 'POST'),
];
