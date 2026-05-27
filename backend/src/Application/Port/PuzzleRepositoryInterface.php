<?php

declare(strict_types=1);

namespace Matheopolis\Application\Port;

use Matheopolis\Domain\Puzzle;

interface PuzzleRepositoryInterface
{
    /**
     * @return array<int, Puzzle>
     */
    public function findAll(): array;

    public function find(int $id): ?Puzzle;

    public function findBySlug(string $slug): ?Puzzle;

    public function insert(string $slug, string $title, string $statement, int $position, bool $isActive): Puzzle;

    public function update(int $id, string $title, string $statement, int $position, bool $isActive): void;
}
