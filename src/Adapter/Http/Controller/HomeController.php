<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Adapter\Http\View\HomeView;
use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\LoggerInterface;
use Matheopolis\Application\Query\GetHomePageQuery;
use Matheopolis\Application\QueryHandler\GetHomePageQueryHandler;

final class HomeController extends AbstractController
{
    public function __construct(
        private readonly HomeView $homeView,
        private readonly GetHomePageQueryHandler $getHomePage,
        private readonly LoggerInterface $logger,
        private readonly AuthSessionInterface $auth,
        private readonly HttpInterface $http,
    ) {
        $this->view = $homeView;
    }

    public function index(): void
    {
        if ($this->auth->check()) {
            $this->http->redirect('dashboard');
        }

        $readModel = $this->getHomePage->handle(new GetHomePageQuery());
        $this->logger->debug('Home page accessed', [
            'display_name' => $readModel->displayName,
        ]);

        $this->homeView->setUser($readModel->displayName);
        $this->homeView->render();
    }
}
