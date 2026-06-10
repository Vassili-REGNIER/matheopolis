<?php

declare(strict_types=1);

use Matheopolis\Adapter\Http\Router\Route;

return [
    new Route('ApiSystem', 'health', '/api/health', 'GET'),

    new Route('ApiAuth', 'login', '/api/auth/login', 'POST'),
    new Route('ApiAuth', 'logout', '/api/auth/logout', 'POST'),
    new Route('ApiAuth', 'me', '/api/auth/me', 'GET'),
    new Route('ApiAuth', 'forgotPassword', '/api/auth/forgot-password', 'POST'),
    new Route('ApiAuth', 'resetPassword', '/api/auth/reset-password', 'POST'),
    new Route('ApiAuth', 'verifyEmail', '/api/auth/verify-email', 'POST'),

    new Route('ApiUsers', 'createTeacher', '/api/users/teachers', 'POST'),
    new Route('ApiUsers', 'createStudent', '/api/users/students', 'POST'),
    new Route('ApiUsers', 'createAccount', '/api/users', 'POST'),
    new Route('ApiUsers', 'profile', '/api/users/{id}', 'GET'),

    new Route('ApiClasses', 'list', '/api/classes', 'GET'),
    new Route('ApiClasses', 'create', '/api/classes', 'POST'),
    new Route('ApiClasses', 'details', '/api/classes/{id}', 'GET'),
    new Route('ApiClasses', 'update', '/api/classes/{id}', 'PATCH'),
    new Route('ApiClasses', 'remove', '/api/classes/{id}', 'DELETE'),
    new Route('ApiClasses', 'students', '/api/classes/{id}/students', 'GET'),
    new Route('ApiClasses', 'studentsProgress', '/api/classes/{id}/students/progress', 'GET'),
    new Route('ApiClasses', 'studentsProgressExport', '/api/classes/{id}/students/progress/export', 'GET'),
    new Route('ApiClasses', 'importStudents', '/api/classes/{id}/students/import', 'POST'),
    new Route('ApiClasses', 'deleteStudent', '/api/classes/{id}/students/{studentId}', 'DELETE'),
    new Route('ApiClasses', 'resetStudentPassword', '/api/classes/{id}/students/{studentId}/reset-password', 'POST'),

    new Route('ApiQuizzes', 'list', '/api/quizzes', 'GET'),
    new Route('ApiQuizzes', 'create', '/api/quizzes', 'POST'),
    new Route('ApiQuizzes', 'show', '/api/quizzes/{id}', 'GET'),
    new Route('ApiQuizzes', 'update', '/api/quizzes/{id}', 'PATCH'),
    new Route('ApiQuizzes', 'remove', '/api/quizzes/{id}', 'DELETE'),
    new Route('ApiQuizzes', 'progress', '/api/quizzes/{id}/progress', 'GET'),
    new Route('ApiQuizzes', 'startAttempt', '/api/quizzes/{id}/attempts', 'POST'),
    new Route('ApiQuizzes', 'submitResponse', '/api/quizzes/{id}/responses', 'POST'),
    new Route('ApiQuizzes', 'correction', '/api/quizzes/{id}/correction', 'GET'),
    new Route('ApiQuizzes', 'addQuestion', '/api/quizzes/{id}/questions', 'POST'),
    new Route('ApiQuizzes', 'updateQuestion', '/api/quizzes/{id}/questions/{questionId}', 'PATCH'),
    new Route('ApiQuizzes', 'deleteQuestion', '/api/quizzes/{id}/questions/{questionId}', 'DELETE'),
    new Route('ApiQuizzes', 'listTargetClasses', '/api/quizzes/{id}/target-classes', 'GET'),
    new Route('ApiQuizzes', 'setTargetClass', '/api/quizzes/{id}/target-classes/{classId}', 'PUT'),
    new Route('ApiQuizzes', 'removeTargetClass', '/api/quizzes/{id}/target-classes/{classId}', 'DELETE'),

    new Route('ApiChapters', 'list', '/api/chapters', 'GET'),
    new Route('ApiChapters', 'show', '/api/chapters/{id}', 'GET'),
    new Route('ApiChapters', 'start', '/api/chapters/{id}/start', 'POST'),
    new Route('ApiChapters', 'progress', '/api/chapters/{id}/progress', 'GET'),
    new Route('ApiChapters', 'syncStep', '/api/chapters/{id}/steps', 'POST'),
    new Route('ApiChapters', 'complete', '/api/chapters/{id}/complete', 'POST'),

    new Route('ApiRiddles', 'show', '/api/riddles/{riddleId}', 'GET'),
    new Route('ApiRiddles', 'start', '/api/riddles/{riddleId}/start', 'POST'),
    new Route('ApiRiddles', 'progress', '/api/riddles/{riddleId}/progress', 'GET'),
    new Route('ApiRiddles', 'submitResponse', '/api/riddles/{riddleId}/responses', 'POST'),
];
