<?php

declare(strict_types=1);

namespace Matheopolis\Domain\ValueObject;

final class Role
{
    /** @var array<int, string> */
    private const VALID_ROLES = ['standard', 'teacher', 'student', 'admin'];

    private string $value;

    public function __construct(string $role)
    {
        if (!\in_array($role, self::VALID_ROLES, true)) {
            throw new \InvalidArgumentException('Invalid role: '.$role);
        }
        $this->value = $role;
    }

    public function getValue(): string
    {
        return $this->value;
    }
}
