<?php

declare(strict_types=1);

namespace Matheopolis\Application\Exception;

final class ApiException extends \RuntimeException
{
    /**
     * @param array<string, mixed> $details
     */
    public function __construct(
        private readonly int $status,
        private readonly string $codeName,
        string $message,
        private readonly array $details = [],
    ) {
        parent::__construct($message);
    }

    public function status(): int
    {
        return $this->status;
    }

    public function codeName(): string
    {
        return $this->codeName;
    }

    /**
     * @return array<string, mixed>
     */
    public function details(): array
    {
        return $this->details;
    }
}
