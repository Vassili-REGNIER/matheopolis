<?php

declare(strict_types=1);

namespace Matheopolis\Application\QueryHandler;

use Matheopolis\Application\Query\TryAutoLoginQuery;
use Matheopolis\Application\Service\AuthenticationService;

final class TryAutoLoginQueryHandler
{
    public function __construct(
        private readonly AuthenticationService $authentication,
    ) {}

    public function handle(TryAutoLoginQuery $_query): bool
    {
        return $this->authentication->tryAutoLogin();
    }
}
