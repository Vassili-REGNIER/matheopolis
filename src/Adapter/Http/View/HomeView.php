<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\View;

use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\SecurityInterface;
use Matheopolis\Application\Port\SessionInterface;

final class HomeView extends AbstractView
{
    protected string $title = 'Matheopolis - Home';

    protected string $template = 'home/index';

    public function __construct(
        SecurityInterface $security,
        HttpInterface $http,
        SessionInterface $session,
        AuthSessionInterface $auth,
    ) {
        parent::__construct(
            ['title' => 'Bonjour'],
            $security,
            $http,
            $session,
            $auth,
        );
    }

    public function setUser(string $user): void
    {
        $this->set('user', $user);
    }
}
