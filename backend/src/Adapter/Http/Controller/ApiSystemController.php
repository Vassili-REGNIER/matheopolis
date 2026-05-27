<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Application\Port\ConfigInterface;

final class ApiSystemController extends ApiBaseController
{
    public function __construct(
        private readonly ConfigInterface $config,
        \Matheopolis\Application\Port\HttpInterface $http,
        \Matheopolis\Application\Port\AuthSessionInterface $auth,
        \Matheopolis\Application\Port\SessionInterface $session,
        \Matheopolis\Application\Port\UserRepositoryInterface $users,
    ) {
        parent::__construct($http, $auth, $session, $users);
    }

    public function health(): never
    {
        $this->success([
            'service' => 'matheopolis-backend',
            'status' => 'ok',
            'environment' => $this->config->getString('APP_ENV', 'dev'),
            'time' => gmdate(DATE_ATOM),
        ]);
    }
}
