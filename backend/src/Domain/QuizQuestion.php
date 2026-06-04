<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

readonly class QuizQuestion
{
    /**
     * @param array<int, QuizOption> $options
     */
    public function __construct(
        private int $id,
        private int $quizId,
        private string $label,
        private int $orderIndex,
        private string $type,
        private array $options = [],
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getQuizId(): int
    {
        return $this->quizId;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function getOrderIndex(): int
    {
        return $this->orderIndex;
    }

    public function getType(): string
    {
        return $this->type;
    }

    /**
     * @return array<int, QuizOption>
     */
    public function getOptions(): array
    {
        return $this->options;
    }
}
