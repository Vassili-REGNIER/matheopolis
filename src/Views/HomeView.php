<?php
declare(strict_types=1);

namespace Src\Views;

use Core\Interfaces\AuthSessionInterface;
use Core\Interfaces\SecurityInterface;
use Core\Interfaces\SessionInterface;
use Core\Services\HttpService;
use Core\View;

class HomeView extends View 
{
    protected string $title = 'Matheopolis - Home';
    protected string $template = 'home/index';

    public function __construct(
        SecurityInterface $security,
        HttpService $httpService,
        SessionInterface $session,
        AuthSessionInterface $auth
    )
    {
        $data = [
            'title' => 'Bonjour'
        ];
        parent::__construct($data, $security, $httpService, $session, $auth);
    }

    public function setUser(string $user): void
    {
        $this->set('user', $user);
    }
}