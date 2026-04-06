<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Adapter\Http\View\HomeView;
use Matheopolis\Application\Port\LoggerInterface;
use Matheopolis\Application\Query\GetHomePageQuery;
use Matheopolis\Application\QueryHandler\GetHomePageQueryHandler;

final class HomeController extends AbstractController
{
    public function __construct(
        private readonly HomeView $homeView,
        private readonly GetHomePageQueryHandler $getHomePage,
        private readonly LoggerInterface $logger,
    ) {
        $this->view = $homeView;
    }

    public function index(): void
    {
        $readModel = $this->getHomePage->handle(new GetHomePageQuery());
        $this->logger->debug('Home page accessed', [
            'display_name' => $readModel->displayName,
        ]);

        $this->homeView->setUser($readModel->displayName);
        $this->homeView->render();
    }
}
