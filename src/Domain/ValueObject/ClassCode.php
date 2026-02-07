<?php

namespace Src\Domain\ValueObject;

use InvalidArgumentException;

final class ClassCode
{
    private string $value;

    public function __construct(string $code)
    {
        // TODO: vérifier si le code est correct
        if (!$code) { // ex !preg_match('/^[A-Z0-9]{6}$/', $code)
            throw new InvalidArgumentException('Invalid class code: ' . $code);
        }
        $this->value = $code;
    }

    public function getValue(): string {
        return $this->value;
    }
}