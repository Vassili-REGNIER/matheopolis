<?php

declare(strict_types=1);

namespace Matheopolis\Application\CommandHandler;

use Matheopolis\Application\Service\AuthenticationService;

final class LogoutUserCommandHandler
{
    public function __construct(
        private readonly AuthenticationService $authentication,
    ) {}

    public function handle(): void
    {
        $this->authentication->logout();
    }
}
