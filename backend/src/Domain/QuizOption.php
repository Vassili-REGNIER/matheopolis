<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

/**
 * Represents the quiz option component.
 */
readonly class QuizOption
{
    /**
     * Creates a new QuizOption instance.
     */
    public function __construct(
        private int $id,
        private int $questionId,
        private string $label,
        private bool $isCorrect,
    ) {}

    /**
     * Returns the ID.
     */
    public function getId(): int
    {
        return $this->id;
    }

    /**
     * Returns the question ID.
     */
    public function getQuestionId(): int
    {
        return $this->questionId;
    }

    /**
     * Returns the label.
     */
    public function getLabel(): string
    {
        return $this->label;
    }

    /**
     * Checks whether the correct condition is met.
     */
    public function isCorrect(): bool
    {
        return $this->isCorrect;
    }
}
