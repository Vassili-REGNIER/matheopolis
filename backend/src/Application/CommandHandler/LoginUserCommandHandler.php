<?php

declare(strict_types=1);

namespace Matheopolis\Application\CommandHandler;

use Matheopolis\Application\Command\LoginUserCommand;
use Matheopolis\Application\Service\AuthenticationService;

final class LoginUserCommandHandler
{
    public function __construct(
        private readonly AuthenticationService $authentication,
    ) {}

    public function handle(LoginUserCommand $command): bool
    {
        return $this->authentication->attemptLogin(
            $command->login,
            $command->password,
            $command->remember,
        );
    }
}
