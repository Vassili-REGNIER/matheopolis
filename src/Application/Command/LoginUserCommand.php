<?php

declare(strict_types=1);

namespace Matheopolis\Application\Command;

final readonly class LoginUserCommand
{
    public function __construct(
        public string $login,
        public string $password,
        public bool $remember = false,
    ) {}
}
