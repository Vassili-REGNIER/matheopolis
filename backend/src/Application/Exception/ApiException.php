<?php

declare(strict_types=1);

namespace Matheopolis\Application\Exception;

/**
 * Represents the API exception component.
 */
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

    /**
     * Status.
     */
    public function status(): int
    {
        return $this->status;
    }

    /**
     * Code name.
     */
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
