<?php

declare(strict_types=1);

namespace Matheopolis\Application\CommandHandler;

use Matheopolis\Application\Command\RegisterStudentCommand;
use Matheopolis\Application\Service\UserRegistrationService;
use Matheopolis\Domain\User;

final class RegisterStudentCommandHandler
{
    public function __construct(
        private readonly UserRegistrationService $registration,
    ) {}

    public function handle(RegisterStudentCommand $command): User
    {
        return $this->registration->registerStudent(
            $command->firstname,
            $command->lastname,
            $command->pseudo,
            $command->password,
            $command->classCode,
        );
    }
}
