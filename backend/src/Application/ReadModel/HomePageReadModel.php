<?php

declare(strict_types=1);

namespace Matheopolis\Application\ReadModel;

final readonly class HomePageReadModel
{
    public function __construct(
        public string $displayName,
    ) {}
}
