<?php

namespace Src\Domain\ValueObject;

use InvalidArgumentException;

final class Email
{
    private string $value;

    public function __construct(string $email)
    {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email: ' . $email);
        }
        $this->value = $email;
    }

    public function getValue(): string {
        return $this->value;
    }
}