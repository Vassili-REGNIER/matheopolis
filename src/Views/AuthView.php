<?php
declare(strict_types=1);

namespace Src\Views;

use Core\Interfaces\AuthSessionInterface;
use Core\Interfaces\SecurityInterface;
use Core\Interfaces\SessionInterface;
use Core\Services\HttpService;
use Core\View;

class AuthView extends View 
{
    protected string $title = 'Matheopolis - Authentication';
    protected string $template = 'home/auth';

    public function __construct(
        SecurityInterface $security,
        HttpService $httpService,
        SessionInterface $session,
        AuthSessionInterface $auth
    )
    {
        $data = [
            'title' => 'Authentification',
            'initialMode' => 'login'
        ];
        parent::__construct($data, $security, $httpService, $session, $auth);
    }

    public function setInitialMode(string $mode): void
    {
        $this->set('initialMode', $mode);
    }
}