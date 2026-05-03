<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

interface SecurityInterface
{
    public function escape(string $string): string;

    public function csrfField(): string;
}
