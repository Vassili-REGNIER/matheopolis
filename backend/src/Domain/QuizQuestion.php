<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

/**
 * Represents the quiz question component.
 */
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

    /**
     * Returns the ID.
     */
    public function getId(): int
    {
        return $this->id;
    }

    /**
     * Returns the quiz ID.
     */
    public function getQuizId(): int
    {
        return $this->quizId;
    }

    /**
     * Returns the label.
     */
    public function getLabel(): string
    {
        return $this->label;
    }

    /**
     * Returns the order index.
     */
    public function getOrderIndex(): int
    {
        return $this->orderIndex;
    }

    /**
     * Returns the type.
     */
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
