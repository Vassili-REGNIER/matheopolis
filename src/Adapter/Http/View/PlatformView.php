<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\View;

use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\SecurityInterface;
use Matheopolis\Application\Port\SessionInterface;
use Matheopolis\Domain\User;

final class PlatformView extends AbstractView
{
    protected string $title = 'Matheopolis - Dashboard';

    protected string $template = 'platform/dashboard';

    public function __construct(
        SecurityInterface $security,
        HttpInterface $http,
        SessionInterface $session,
        AuthSessionInterface $auth,
    ) {
        parent::__construct(
            [
                'dashboard' => [],
                'user' => null,
                'createTeacherCodeLink' => $http->generateLink('action/teacher-codes/create'),
                'createClassroomLink' => $http->generateLink('action/classes/create'),
                'resetStudentPasswordLink' => $http->generateLink('action/students/reset-password'),
                'createPuzzleLink' => $http->generateLink('action/puzzles/create'),
                'solvePuzzleLink' => $http->generateLink('action/puzzles/solve'),
            ],
            $security,
            $http,
            $session,
            $auth,
        );
    }

    public function setUser(User $user): void
    {
        $this->set('user', $user);
    }

    /**
     * @param array<string, mixed> $dashboard
     */
    public function setDashboardData(array $dashboard): void
    {
        $this->set('dashboard', $dashboard);
    }
}
