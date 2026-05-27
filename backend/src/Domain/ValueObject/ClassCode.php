<?php

declare(strict_types=1);

namespace Matheopolis\Domain\ValueObject;

final class ClassCode
{
    private string $value;

    public function __construct(string $code)
    {
        if ('' === $code) {
            throw new \InvalidArgumentException('Invalid class code: '.$code);
        }
        $this->value = $code;
    }

    public function getValue(): string
    {
        return $this->value;
    }
}
