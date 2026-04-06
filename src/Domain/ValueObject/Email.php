<?php

declare(strict_types=1);

namespace Matheopolis\Domain\ValueObject;

final class Email
{
    private string $value;

    public function __construct(string $email)
    {
        if (false === filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Invalid email: '.$email);
        }
        $this->value = $email;
    }

    public function getValue(): string
    {
        return $this->value;
    }
}
