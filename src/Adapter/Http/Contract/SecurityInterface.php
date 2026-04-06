<?php

declare(strict_types=1);

namespace Matheopolis\Adapter\Http\Contract;

interface SecurityInterface
{
    public function escape(string $string): string;

    public function csrfField(): string;
}
