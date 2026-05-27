<?php

declare(strict_types=1);

namespace Matheopolis\Application\Command;

final readonly class RegisterStandardUserCommand
{
    public function __construct(
        public string $firstname,
        public string $lastname,
        public string $pseudo,
        public string $password,
        public string $email,
    ) {}
}
