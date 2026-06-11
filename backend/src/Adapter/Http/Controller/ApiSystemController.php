<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Controller;

use Matheopolis\Application\Port\AuthSessionInterface;
use Matheopolis\Application\Port\ConfigInterface;
use Matheopolis\Application\Port\HttpInterface;
use Matheopolis\Application\Port\SessionInterface;
use Matheopolis\Application\Port\UserRepositoryInterface;

/**
 * Handles HTTP requests for API system endpoints.
 */
final class ApiSystemController extends ApiBaseController
{
    /**
     * Creates a new ApiSystemController instance.
     */
    public function __construct(
        private readonly ConfigInterface $config,
        HttpInterface $http,
        AuthSessionInterface $auth,
        SessionInterface $session,
        UserRepositoryInterface $users,
    ) {
        parent::__construct($http, $auth, $session, $users);
    }

    /**
     * Health.
     */
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
