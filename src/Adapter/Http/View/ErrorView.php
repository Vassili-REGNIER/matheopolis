<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\View;

use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\SecurityInterface;
use Matheopolis\Application\Port\SessionInterface;

final class ErrorView extends AbstractView
{
    protected string $title = 'Matheopolis - Erreur';

    protected string $template = 'error/404';

    public function __construct(
        SecurityInterface $security,
        HttpInterface $http,
        SessionInterface $session,
        AuthSessionInterface $auth,
    ) {
        parent::__construct(
            [
                'message' => 'Une erreur s\'est produite.',
                'title' => 'Erreur',
            ],
            $security,
            $http,
            $session,
            $auth,
        );
    }

    public function setType(int $status): void
    {
        switch ($status) {
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
