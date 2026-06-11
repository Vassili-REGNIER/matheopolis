<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

/**
 * Defines the contract for the scenario repository dependency.
 */
interface ScenarioRepositoryInterface
{
    /**
     * @return array{steps: array<int, array<string, mixed>>}
     */
    public function buildPlayScenario(int $chapterId): array;
}
