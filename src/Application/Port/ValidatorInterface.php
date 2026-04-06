<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

interface ValidatorInterface
{
    /**
     * @param array<string, mixed>  $source
     * @param array<string, string> $schema
     *
     * @return array<string, mixed>|false
     */
    public function run(array $source, array $schema): array|false;

    /**
     * @return array<string, string>
     */
    public function getErrors(): array;
}
