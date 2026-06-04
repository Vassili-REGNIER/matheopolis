<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

readonly class QuizOption
{
    public function __construct(
        private int $id,
        private int $questionId,
        private string $label,
        private bool $isCorrect,
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getQuestionId(): int
    {
        return $this->questionId;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function isCorrect(): bool
    {
        return $this->isCorrect;
    }
}
