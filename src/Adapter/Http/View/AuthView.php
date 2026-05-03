<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\View;

use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\SecurityInterface;
use Matheopolis\Application\Port\SessionInterface;

final class AuthView extends AbstractView
{
    protected string $title = 'Matheopolis - Authentication';

    protected string $template = 'home/auth';

    public function __construct(
        SecurityInterface $security,
        HttpInterface $http,
        SessionInterface $session,
        AuthSessionInterface $auth,
    ) {
        parent::__construct(
            [
                'title' => 'Authentification',
                'initialMode' => 'login',
                'loginAction' => $http->generateLink('action/login'),
                'joinAction' => $http->generateLink('action/join'),
                'registerAction' => $http->generateLink('action/register'),
            ],
            $security,
            $http,
            $session,
            $auth,
        );
    }

    public function setInitialMode(string $mode): void
    {
        $this->set('initialMode', $mode);
    }
}
