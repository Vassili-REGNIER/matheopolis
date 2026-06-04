<?php

declare(strict_types=1);

namespace Matheopolis\Domain;

final readonly class Riddle
{
    public function __construct(
        private int $id,
        private int $stepId,
        private int $chapterId,
        private string $slug,
        private string $gameId,
        private string $mode,
        private string $title,
        private string $instruction,
        private ?string $introText,
        private string $completionMessage,
        private ?string $gameParamsJson,
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getStepId(): int
    {
        return $this->stepId;
    }

    public function getChapterId(): int
    {
        return $this->chapterId;
    }

    public function getSlug(): string
    {
        return $this->slug;
    }

    public function getGameId(): string
    {
        return $this->gameId;
    }

    public function getMode(): string
    {
        return $this->mode;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getInstruction(): string
    {
        return $this->instruction;
    }

    public function getIntroText(): ?string
    {
        return $this->introText;
    }

    public function getCompletionMessage(): string
    {
        return $this->completionMessage;
    }

    public function getGameParamsJson(): ?string
    {
        return $this->gameParamsJson;
    }

    public function isPractice(): bool
    {
        return 'practice' === $this->mode;
    }
}
