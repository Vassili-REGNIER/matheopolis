<?php

declare(strict_types=1);

namespace Matheopolis\Application\QueryHandler;

use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;
use Matheopolis\Application\Query\GetHomePageQuery;
use Matheopolis\Application\ReadModel\HomePageReadModel;

final class GetHomePageQueryHandler
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly AuthSessionInterface $auth,
    ) {}

    public function handle(GetHomePageQuery $_query): HomePageReadModel
    {
        if (!$this->auth->check()) {
            return new HomePageReadModel('Guest');
        }

        $userId = $this->auth->id();
        if (null === $userId) {
            return new HomePageReadModel('Guest');
        }

        $user = $this->users->find($userId);
        if (null === $user) {
            return new HomePageReadModel('Guest');
        }

        $displayName = trim($user->getFirstname().' '.$user->getLastname());

        return new HomePageReadModel($displayName);
    }
}
