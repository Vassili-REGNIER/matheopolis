<?php

namespace Src\DTO;

class LoginData
{
    public function __construct(
        public string $login,
        public string $password,
        public ?bool $remember = false,
    ) {}
}