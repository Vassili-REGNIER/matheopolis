<?php

declare(strict_types=1);

namespace Matheopolis\Application\Command;

final readonly class RegisterTeacherCommand
{
    public function __construct(
        public string $firstname,
        public string $lastname,
        public string $pseudo,
        public string $password,
        public string $email,
        public string $teacherInvitationCode,
    ) {}
}
