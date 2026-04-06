<?php

declare(strict_types=1);

namespace Matheopolis\Domain\Repository;

use Matheopolis\Domain\ClassEntity;

interface ClassRepositoryInterface
{
    public function findByCode(string $code): ?ClassEntity;
}
