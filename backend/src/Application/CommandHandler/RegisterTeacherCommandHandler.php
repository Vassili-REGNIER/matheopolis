<?php

declare(strict_types=1);

namespace Matheopolis\Application\CommandHandler;

use Matheopolis\Application\Command\RegisterTeacherCommand;
use Matheopolis\Application\Service\UserRegistrationService;
use Matheopolis\Domain\User;

final class RegisterTeacherCommandHandler
{
    public function __construct(
        private readonly UserRegistrationService $registration,
    ) {}

    public function handle(RegisterTeacherCommand $command): User
    {
        return $this->registration->registerTeacher(
            $command->firstname,
            $command->lastname,
            $command->pseudo,
            $command->password,
            $command->email,
            $command->teacherInvitationCode,
        );
    }
}
