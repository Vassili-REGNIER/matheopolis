<?php
declare(strict_types=1);

namespace Src\Controllers;

use Core\Controller;
use Core\Interfaces\AuthSessionInterface;
use Core\Interfaces\LoggerInterface;
use Core\Services\AuthSessionService;
use Core\Services\LoggerService;
use Src\Repository\UserRepository;
use Src\Views\HomeView;

/**
 * HomeController
 * Manages homepage access
 */
class HomeController extends Controller {

    private UserRepository $userRepository;
    private LoggerInterface $logger;
    private AuthSessionInterface $auth;

    public function __construct(
        HomeView $homeView,
        UserRepository $userRepository,
        LoggerInterface $logger,
        AuthSessionInterface $auth,
    ) {
        $this->view = $homeView;
        $this->userRepository = $userRepository;
        $this->logger = $logger;
        $this->auth = $auth;
    }

    /**
     * Route: /
     * Displays the homepage.
     */
    public function index(): void
    {
        $userId = $this->auth->id();

        $this->logger->debug("Home page accessed", [
            'user_id' => $userId ? $userId : 'Guest'
        ]);

        $fullName = 'Guest';

        if ($this->auth->check()) {
            $user = $this->userRepository->find($userId);
            if ($user) {
                // TODO: je pense que c'est à la vue de concatainer les données pour l'affichage,
                // TODO: on dois seulement lui passer les infos brut, donc logique à déplacer
                $fullName = trim($user->getFirstname() . ' ' . $user->getLastname());
            }
        }

        $this->view->setUser($fullName);
        $this->view->render();
    }
}