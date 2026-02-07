<?php

namespace Src\Domain\ValueObject;

use InvalidArgumentException;

final class Role
{
    private array $VALID_ROLES = ['standard', 'teacher', 'student', 'admin'];
    private string $value;

    public function __construct(string $role)
    {
        if (!in_array($role, $this->VALID_ROLES, true)) {
            throw new InvalidArgumentException('Invalid role: ' . $role);
        }
        $this->value = $role;
    }

    public function getValue(): string {
        return $this->value;
    }
}