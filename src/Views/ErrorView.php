<?php
declare(strict_types=1);

namespace Src\Views;

use Core\Interfaces\AuthSessionInterface;
use Core\Interfaces\SecurityInterface;
use Core\Interfaces\SessionInterface;
use Core\Services\HttpService;
use Core\View;

class ErrorView extends View
{
    protected string $title = 'Matheopolis - Erreur';
    protected string $template = 'error/404';

    public function __construct(
        SecurityInterface $security,
        HttpService $httpService,
        SessionInterface $session,
        AuthSessionInterface $auth,
    )
    {
        $data = [
            'message' => 'Une erreur s\'est produite.',
            'title' => 'Erreur'
        ];
        parent::__construct($data, $security, $httpService, $session, $auth);
    }

    public function setType(int $status): void
    {
        switch ($status) {
            // Client Errors (4xx)
            case 400:
                $this->setTemplate('error/4xx');
                $this->set('status', 400);
                $this->set('message', 'La requête est invalide.');
                break;

            case 401:
                $this->setTemplate('error/4xx');
                $this->set('status', 401);
                $this->set('message', 'Accès refusé. Veuillez vous connecter pour accéder à cette ressource.');
                break;

            case 403:
                $this->setTemplate('error/4xx');
                $this->set('status', 403);
                $this->set('message', 'Accès interdit. Vous n\'avez pas les droits nécessaires pour effectuer cette action.');
                break;

            case 404:
                $this->setTemplate('error/4xx');
                $this->set('status', 404);
                $this->set('message', 'Vous semblez perdu dans Matheopolis...');
                break;

            case 405:
                $this->setTemplate('error/4xx');
                $this->set('status', 405);
                $this->set('message', 'Méthode non autorisée. Cette action n\'est pas permise ici.');
                break;

            case 419:
                $this->setTemplate('error/4xx');
                $this->set('status', 419);
                $this->set('message', 'Votre session a expiré ou le jeton de sécurité est invalide. Veuillez recharger la page et réessayer.');
                break;

            case 429:
                $this->setTemplate('error/4xx');
                $this->set('status', 429);
                $this->set('message', 'Trop de tentatives. Veuillez ralentir et réessayer dans un instant.');
                break;

            // Server Errors (5xx)
            case 500:
                $this->setTemplate('error/5xx');
                $this->set('status', 500);
                $this->set('message', 'Une erreur interne est survenue. Nos équipes ont été notifiées.');
                break;

            default:
                $template = ($status >= 500) ? 'error/5xx' : 'error/4xx';
                $this->setTemplate($template);
                $this->set('status', $status);
                $this->set('message', 'Une erreur inattendue est survenue.');
                break;
        }
    }
}