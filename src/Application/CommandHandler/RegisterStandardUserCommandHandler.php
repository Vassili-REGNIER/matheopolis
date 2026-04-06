<?php

declare(strict_types=1);

namespace Matheopolis\Application\CommandHandler;

use Matheopolis\Application\Command\RegisterStandardUserCommand;
use Matheopolis\Application\Service\UserRegistrationService;
use Matheopolis\Domain\User;

final class RegisterStandardUserCommandHandler
{
    public function __construct(
        private readonly UserRegistrationService $registration,
    ) {}

    public function handle(RegisterStandardUserCommand $command): User
    {
        return $this->registration->registerStandard(
            $command->firstname,
            $command->lastname,
            $command->pseudo,
            $command->password,
            $command->email,
        );
    }
}
