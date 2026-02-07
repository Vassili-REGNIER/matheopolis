<?php
declare(strict_types=1);

namespace Src\Domain;

readonly class Chapter
{
    public function __construct(
        private int    $id,
        private string $title,
        private string $slug,
        private string $order_index,
        private ?string $level = null,
    ) {}

    // Getters
    public function getId(): int { return $this->id; }
    public function getTitle(): string { return $this->title; }
    public function getSlug(): string { return $this->slug; }
    public function getOrderIndex(): string { return $this->order_index; }
    public function getLevel(): string { return $this->level; }
}